import os
import re
import json
import yaml
import subprocess
import threading
import datetime
from queue import Queue

# regex na ANSI escape
ansi_escape = re.compile(r'\x1B\[[0-?]*[ -/]*[@-~]')
# regex na všechno non‑ASCII
non_ascii = re.compile(r'[^\x00-\x7F]')

train_process = None
log_queue    = Queue()

MODEL_ENVIRONMENTS = {
    "yolov5": "yolov5_env",
    "yolov7": "yolov7_env"
}
FOLDER_MODELS = "models"

def get_python_path_for_env(env_name: str) -> str:
    result = subprocess.run(
        ["conda", "env", "list", "--json"],
        capture_output=True, text=True
    )
    if result.returncode != 0:
        raise Exception("Conda env list selhalo: " + result.stderr)
    envs, _ = json.JSONDecoder().raw_decode(result.stdout)
    path = next((p for p in envs["envs"] if os.path.basename(p)==env_name), None)
    if not path:
        raise Exception(f"Env '{env_name}' nenalezen")
    python_bin = "python.exe" if os.name=="nt" else "bin/python"
    full = os.path.join(path, python_bin)
    if not os.path.isfile(full):
        raise Exception(f"Python nenalezen v env '{env_name}': {full}")
    return full

def create_unique_yaml(data_dir, val_dir, class_list, yaml_folder="yaml") -> str:
    os.makedirs(yaml_folder, exist_ok=True)
    ts = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    yf = os.path.abspath(os.path.join(yaml_folder, f"data_{ts}.yaml"))
    with open(yf, "w", encoding="utf-8") as f:
        yaml.dump({
            "train": data_dir,
            "val":   val_dir,
            "nc":    len(class_list),
            "names": class_list
        }, f, default_flow_style=False, allow_unicode=True)
    return yf

def clean_line(line: str) -> str:
    # 1) úplně pryč \r
    line = line.replace('\r', '')
    # 2) pryč ANSI sekvence
    line = ansi_escape.sub('', line)
    # 3) pryč non‑ASCII (včetně původních �)
    line = non_ascii.sub('', line)
    # 4) jen tisknutelné znaky
    return ''.join(ch for ch in line if ch.isprintable())

def run_training_logic(data: dict) -> dict:
    global train_process

    # 1) vstupy
    image_size = data.get("imageSize", 640)
    batch_size = data.get("batchSize", 16)
    epochs     = data.get("epochs", 50)
    weights    = data.get("weights", "yolov5s.pt")
    ddir       = data.get("dataDir")
    vdir       = data.get("valDir")
    classes    = data.get("classList")
    model      = data.get("model", "yolov5").lower()
    if not (ddir and vdir and classes):
        raise ValueError("dataDir, valDir i classList jsou povinné")

    # 2) YAML
    yaml_file = create_unique_yaml(ddir, vdir, classes)
    print("YAML:", yaml_file)

    # 3) validace modelu
    if model not in ["yolov5","yolov6","yolov7","yolov8"]:
        raise ValueError(f"Model '{model}' není podporován")
    train_py = os.path.abspath(os.path.join(FOLDER_MODELS, model, "train.py"))
    if not os.path.isfile(train_py):
        raise FileNotFoundError("Nenalezen train.py: " + train_py)

    # 4) conda env
    env_name = MODEL_ENVIRONMENTS.get(model, "base_env")
    try:
        get_python_path_for_env(env_name)
    except Exception as e:
        print("Conda env error:", e)
        return {"message": "Env nepřístupné"}

    # 5) sestav cmd
    cmd = [
        "conda", "run", "--no-capture-output", "-n", env_name,
        "python", "-u", train_py,
        "--img",   str(image_size),
        "--batch", str(batch_size),
        "--epochs",str(epochs),
        "--weights",weights,
        "--data",  yaml_file
    ]
    print("Run command:", " ".join(cmd))

    # 6) worker
    def _worker():
        global train_process
        env = os.environ.copy()
        env["PYTHONUNBUFFERED"]    = "1"
        env["PYTHONIOENCODING"]    = "utf-8"
        env["TQDM_DISABLE_UNICODE"]= "1"
        env["NO_COLOR"]            = "1"

        train_process = subprocess.Popen(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            bufsize=1,
            text=True,
            encoding="utf-8",
            errors="replace",
            cwd=os.path.dirname(train_py),
            env=env
        )
        for raw in train_process.stdout:
            line = clean_line(raw)
            log_queue.put(line)
            print(line, end="", flush=True)

        train_process.stdout.close()
        train_process.wait()
        log_queue.put("Training completed.\n")
        train_process = None

    threading.Thread(target=_worker, daemon=True).start()
    return {"message": "Trénink zahájen"}



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
    base_dir = os.path.join(os.getcwd(), FOLDER_MODELS, model, "runs", "train")
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
