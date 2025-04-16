import os
import re
import json
import yaml
import subprocess
import threading
import datetime
from queue import Queue

# Pattern to remove ANSI escape sequences
ANSI_ESCAPE_PATTERN = re.compile(r'\x1B\[[0-?]*[ -/]*[@-~]')

# Global training process handle and log queue for streaming logs
train_process = None
log_queue = Queue()

MODEL_ENVIRONMENTS = {
    "yolov5": "yolov5_env",
    "yolov7": "yolov7_env"
}


def get_python_path_for_env(env_name):
    """
    Retrieves the Python interpreter path for a given conda environment.

    Args:
        env_name (str): Name of the conda environment.

    Returns:
        str: The absolute path to the Python interpreter in the specified environment.

    Raises:
        Exception: If the conda environment list fails or the environment cannot be found.
    """
    result = subprocess.run(["conda", "env", "list", "--json"],
                            capture_output=True, text=True)
    if result.returncode != 0:
        raise Exception("Failed to run conda env list: " + result.stderr)

    try:
        env_list, _ = json.JSONDecoder().raw_decode(result.stdout)
    except json.JSONDecodeError as e:
        print("Error parsing JSON:", e)
        raise

    # Find the environment path matching the provided environment name
    env_path = next((env for env in env_list["envs"]
                     if os.path.basename(env) == env_name), None)
    if env_path is None:
        raise Exception(f"Environment '{env_name}' not found.")

    # Build path to python env
    python_path = os.path.join(env_path, "python.exe" if os.name == "nt" else "bin/python")
    if not os.path.exists(python_path):
        raise Exception(f"Python not found in environment '{env_name}': {python_path}")

    return python_path


def run_training_logic(data):
    image_size = data.get("imageSize", 640)
    batch_size = data.get("batchSize", 16)
    epochs = data.get("epochs", 50)
    weights = data.get("weights", "S")
    data_dir = data.get("dataDir")
    val_dir = data.get("valDir")
    class_list = data.get("classList")
    model = data.get("model", "yolov5")

    results_dir = os.path.join(model, "runs", "train")
    conda_env = MODEL_ENVIRONMENTS.get(model, "yolov_base_env")
    try:
        python_path = get_python_path_for_env(conda_env)
    except Exception as e:
        print(f"Error obtaining Python path for environment '{conda_env}': {e}")
        return

    yaml_file = create_unique_yaml(data_dir, val_dir, class_list)
    model_lower = model.lower()
    valid_models = ["yolov5", "yolov6", "yolov7", "yolov8"]
    if model_lower not in valid_models:
        raise Exception(f"Model version '{model}' is not valid.")

    train_script = os.path.join(model_lower, "train.py").replace("\\", "/")
    if not os.path.exists(train_script):
        raise Exception(f"Training script '{train_script}' not found.")

    cmd = [
        python_path,
        train_script,
        "--img", str(image_size),
        "--batch", str(batch_size),
        "--epochs", str(epochs),
        "--weights", weights,
        "--data", yaml_file,
        "--project", results_dir
    ]

    print("Run command:", " ".join(cmd))

    def run_training():
        global train_process
        train_process = subprocess.Popen(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            encoding="utf-8",
            errors="replace"
        )
        for line in train_process.stdout:
            cleaned_line = clean_line(line)
            log_queue.put(cleaned_line)  # Uložíme vyčištěný log do fronty
            print(cleaned_line, end="", flush=True)
        train_process.stdout.close()
        train_process.wait()
        log_queue.put("Training completed.\n")

    threading.Thread(target=run_training).start()
    return {"message": "Training initiated"}

def clean_line(line):
    line = line.replace('\r', '\n')
    line = ANSI_ESCAPE_PATTERN.sub('', line)
    return line

def stop_training_logic():
    global train_process
    if train_process is not None:
        train_process.terminate()  #todo nebo train_process.kill() dle potřeby
        train_process = None
        return {"message": "Training stopped"}
    else:
        raise Exception("No training process to stop")


def get_training_runs_logic(model):
    """
    Retrieves a list of completed training runs for the specified model.

    Args:
        model (str): The model name.

    Returns:
        list: List of dictionaries representing training runs, each containing:
              - id: Run identifier.
              - name: Run name.
              - timestamp: Creation time in ISO format.
              - path: Full filesystem path to the run directory.
    """
    base_dir = os.path.join(os.getcwd(), model, "runs", "train")
    runs = []
    if os.path.exists(base_dir):
        for run_dir in os.listdir(base_dir):
            full_run_path = os.path.join(base_dir, run_dir)
            if os.path.isdir(full_run_path):
                weight_file = os.path.join(full_run_path, "weights", "best.pt")
                if os.path.exists(weight_file):
                    creation_time = os.path.getctime(full_run_path)
                    creation_time_iso = datetime.datetime.fromtimestamp(creation_time).isoformat() + "Z"
                    runs.append({
                        "id": run_dir,
                        "name": run_dir,
                        "timestamp": creation_time_iso,
                        "path": full_run_path
                    })
        runs.sort(key=lambda x: x["timestamp"], reverse=True)
    return runs


def create_unique_yaml(data_dir, val_dir, class_list, yaml_folder="yaml"):
    """
    Creates a unique YAML file containing the training and validation data paths,
    number of classes, and the list of class names. The filename is made unique
    with a timestamp.

    Args:
        data_dir (str): Path to the training data.
        val_dir (str): Path to the validation data.
        class_list (list): List of class names.
        yaml_folder (str, optional): Folder to store YAML files. Defaults to "yaml".

    Returns:
        str: Absolute path to the created YAML file.
    """
    if not os.path.exists(yaml_folder):
        os.makedirs(yaml_folder)
        print(f"Created YAML folder: {yaml_folder}")

    timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    yaml_filename = f"data_{timestamp}.yaml"
    yaml_file = os.path.abspath(os.path.join(yaml_folder, yaml_filename)).replace("\\", "/")

    yaml_data = {
        "train": data_dir,
        "val": val_dir,
        "nc": len(class_list) if class_list else 0,
        "names": class_list
    }

    with open(yaml_file, "w", encoding="utf-8") as f:
        yaml.dump(yaml_data, f, default_flow_style=False, allow_unicode=True)
    print(f"Created YAML file: {yaml_file}")

    return yaml_file


def get_training_run_data(model, experiment):
    """
    Loads the opt.yaml file from the specified experiment folder, then reads the dataset YAML
    (pointed to by the "data" key in opt.yaml) and extracts training parameters:
    image size, batch size, validation folder, and class names.

    Args:
        model (str): Name of the model folder (e.g., "yolov5").
        experiment (str): Experiment identifier (e.g., "exp1").

    Returns:
        dict: A dictionary containing the experiment ID, image size, batch size,
              validation folder path, and class names.

    Raises:
        Exception: If the experiment folder or necessary files are not found.
    """
    base_train_dir = os.path.join(os.getcwd(), model.lower(), "runs", "train")
    experiment_folder = os.path.join(base_train_dir, experiment)
    if not os.path.exists(experiment_folder):
        raise Exception("Experiment folder not found: " + experiment_folder)

    # Construct the path to opt.yaml inside the experiment folder.
    opt_yaml_path = os.path.join(experiment_folder, "opt.yaml")
    if not os.path.exists(opt_yaml_path):
        raise FileNotFoundError(f"opt.yaml not found in experiment folder: {experiment_folder}")

    # Load opt.yaml
    with open(opt_yaml_path, "r", encoding="utf-8") as f:
        opt_data = yaml.safe_load(f)

    # Extract training parameters from opt.yaml.
    if model.lower().startswith("yolov5"):
        img_size = opt_data.get("imgsz")
    else:
        img_size = opt_data.get("img_size")
        if isinstance(img_size, list) and len(img_size) > 0:
            img_size = img_size[0]

    batch_size = opt_data.get("batch_size")
    dataset_yaml_path = opt_data.get("data")
    if not dataset_yaml_path or not os.path.exists(dataset_yaml_path):
        raise Exception(f"Dataset YAML not found at: {dataset_yaml_path}")

    with open(dataset_yaml_path, "r", encoding="utf-8") as f:
        dataset_data = yaml.safe_load(f)

    val_folder = dataset_data.get("val")
    classes = dataset_data.get("names")

    return {
        "experiment": experiment,
        "img_size": img_size,
        "batch_size": batch_size,
        "val": val_folder,
        "classes": classes,
    }

def get_evaluation_data(model, experiment, host_url):
    """
    Loads evaluation data for a given experiment by constructing URLs for the confusion matrix
    and F1 curve images.

    Args:
        model (str): Model name.
        experiment (str): Experiment identifier (e.g., "exp6").
        host_url (str): Base URL of the server (e.g., request.host_url.rstrip('/')).

    Returns:
        dict: Evaluation data containing:
              - confusion_matrix_url: URL for the confusion matrix image.
              - f1_curve_url: URL for the F1 curve image.

    Raises:
        Exception: If the training run folder is not found.
    """
    base_train_dir = os.path.join(os.getcwd(), model, "runs", "train")
    experiment_folder = os.path.join(base_train_dir, experiment)

    if not os.path.exists(experiment_folder):
        raise Exception("Train run folder not found")

    eval_data = {
        "confusion_matrix_url": f"{host_url}/api/training/file/{model}/{experiment}/confusion_matrix.png",
        "f1_curve_url": f"{host_url}/api/training/file/{model}/{experiment}/F1_curve.png"
    }
    return eval_data
