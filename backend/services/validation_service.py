import json
import os
import subprocess
import threading
from datetime import datetime

import yaml

YOLO_DIR = os.path.join(os.getcwd(), "yolov5")
YAML_DIR = os.path.join(os.getcwd(), "yaml")
RUNS_DIR = os.path.join(os.getcwd(), "runs", "val")
VAL_SCRIPTS = {
        "yolov5": "val.py",
        "yolov7": "test.py"
}


def create_yaml_for_validation(source, train_run, model):
    """
    Loads the original dataset YAML from the training run's opt.yaml,
    updates the 'val' value to the new source path, and saves a unique
    YAML file in the yaml/val directory.

    Args:
        source (str): Path to the folder with validation images and labels.
        training_run (str): Name of the training run (e.g., "exp1") from which to load opt.yaml.
        model (str): Name of the model folder (e.g., "yolov5" or "yolov7").

    Returns:
        str: Absolute path to the newly created YAML file.
    """
    opt_yaml_path = os.path.join(model.lower(), "runs", "train", train_run, "opt.yaml")
    if not os.path.exists(opt_yaml_path):
        raise FileNotFoundError(f"opt.yaml not found: {opt_yaml_path}")

    # Load opt.yaml that contains the dataset YAML path
    with open(opt_yaml_path, "r", encoding="utf-8") as f:
        opt_data = yaml.safe_load(f)

    original_data_yaml = opt_data.get("data")
    if not original_data_yaml or not os.path.exists(original_data_yaml):
        raise FileNotFoundError(f"Original dataset YAML not found: {original_data_yaml}")

    with open(original_data_yaml, "r", encoding="utf-8") as f:
        dataset_yaml = yaml.safe_load(f)

    dataset_yaml["val"] = source

    yaml_folder = os.path.join("yaml", "val")
    if not os.path.exists(yaml_folder):
        os.makedirs(yaml_folder)

    # Create a unique filename using a timestamp
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    yaml_filename = f"data_{timestamp}.yaml"
    yaml_file = os.path.abspath(os.path.join(yaml_folder, yaml_filename)).replace("\\", "/")

    # Uložení upraveného YAML souboru
    with open(yaml_file, "w", encoding="utf-8") as f:
        yaml.dump(dataset_yaml, f, default_flow_style=False, allow_unicode=True)

    return yaml_file

def start_validation(source, train_run, img_size, conf, iou, model):
    """
    Starts the validation script (e.g., val.py or test.py) with the given parameters
    in a new thread.

    Args:
        source (str): Path to the folder with validation images and labels.
        training_run (str): Name of the training run (e.g., "exp1") where weights and opt.yaml are stored.
        img_size (int): Image size.
        conf (float): Confidence threshold.
        iou (float): IoU threshold.
        model (str): Name of the model folder (e.g., "yolov5" or "yolov7").

    Returns:
        str: A unique experiment identifier for the validation results.
    """
    # Create a YAML configuration file for validation with updated data path
    data_yaml = create_yaml_for_validation(source, train_run, model)

    model = model.lower()
    val_script = os.path.join(model,VAL_SCRIPTS[model])
    train_weights = os.path.join(model, "runs", "train", train_run, "weights", "best.pt")
    result_dir = os.path.join(os.getcwd(), model, "runs", "val")

    # Construct the command for running the validation script
    cmd = [
        "python", val_script,
        "--weights", train_weights,
        "--data", data_yaml,
        "--img", str(img_size),
        "--conf", str(conf),
        "--iou", str(iou),
        "--project", result_dir
    ]

    def run_validation():
        process = subprocess.Popen(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            encoding="utf-8",
            errors="replace"
        )
        # Read process output and print logs
        for line in process.stdout:
            cleaned_line = line.strip()
            # log_queue.put(cleaned_line)
            print(cleaned_line, flush=True)
        process.stdout.close()
        process.wait()
        # log_queue.put("Validace ukončena.")

    # Spuštění validačního skriptu v novém vlákně
    threading.Thread(target=run_validation).start()

    return get_experimental_folder(model)


def list_validation_runs():
    """
    Prochází adresář RUNS_DIR a vrací seznam experimentů (validací).
    Pokud je v každém experimentu uložen soubor results.json, načte i metriky a datum poslední úpravy.
    """
    base_dir = RUNS_DIR  # Experimenty jsou přímo ve složce runs/val
    runs = []
    if not os.path.exists(base_dir):
        return runs
    for exp in os.listdir(base_dir):
        exp_path = os.path.join(base_dir, exp)
        if os.path.isdir(exp_path):
            results_file = os.path.join(exp_path, "results.json")
            metrics = {}
            if os.path.exists(results_file):
                try:
                    with open(results_file, "r") as f:
                        metrics = json.load(f)
                except Exception:
                    metrics = {}
            timestamp = datetime.fromtimestamp(os.path.getmtime(exp_path)).strftime("%Y-%m-%d %H:%M:%S")
            runs.append({
                "id": exp,
                "name": exp,
                "timestamp": timestamp,
                "metrics": metrics,
            })
    # Sort experiments with the latest ones first
    runs = sorted(runs, key=lambda x: x["timestamp"], reverse=True)
    return runs


def get_latest_validation_images(model, experiment):
    """
    Vrací seznam posledních validovaných obrázků pro daný experiment.
    Předpokládá se, že obrázky jsou uloženy v podsložce 'images' v adresáři experimentu.
    """
    images_dir = os.path.join(os.getcwd(), model, "runs", "val", experiment)
    if not os.path.exists(images_dir):
        return {"images": []}

    images = []
    for filename in os.listdir(images_dir):
        if filename.lower().endswith(('.png', '.jpg', '.jpeg')):
            images.append(filename)
    return {"images": images}


def get_validation_runs(model):
    base_dir = os.path.join(os.getcwd(), model, "runs", "val")
    runs = []
    if os.path.exists(base_dir):
        for run_dir in os.listdir(base_dir):
            full_run_path = os.path.join(base_dir, run_dir)
            if os.path.isdir(full_run_path):
                creation_time = os.path.getctime(full_run_path)
                creation_time_iso = datetime.fromtimestamp(creation_time).isoformat() + "Z"
                runs.append({
                    "id": run_dir,
                    "name": run_dir,
                    "timestamp": creation_time_iso,
                    "path": full_run_path
                })
        runs.sort(key=lambda x: x["timestamp"], reverse=True)
    return runs


def get_validation_details(experiment, host_url, model):
    """
    Loads detailed validation results (e.g., metrics stored in results.json) and constructs URLs for images.
    """
    val_dir = os.path.join(os.getcwd(), model, "runs", "val")
    exp_dir = os.path.join(val_dir, experiment)
    if not os.path.exists(exp_dir):
        return {"error": "Experiment not found"}

    return {
        "confusion_matrix_url": f"{host_url}/api/validation/file/{model}/{experiment}/confusion_matrix.png",
        "pr_curve_url": f"{host_url}/api/validation/file/{model}/{experiment}/PR_curve.png",
        "r_curve_url": f"{host_url}/api/validation/file/{model}/{experiment}/R_curve.png",
        "f1_curve_url": f"{host_url}/api/validation/file/{model}/{experiment}/F1_curve.png"
    }

def get_experimental_folder(model):
    base_detect_dir = os.path.join(os.getcwd(), model, "runs", "val")
    if not os.path.exists(base_detect_dir):
        os.makedirs(base_detect_dir, exist_ok=True)
    exp_dirs = [d for d in os.listdir(base_detect_dir)
                if os.path.isdir(os.path.join(base_detect_dir, d)) and d.startswith("exp")]
    if exp_dirs:
        max_num = max([int(d[3:]) for d in exp_dirs if d[3:].isdigit()] or [0])
    else:
        max_num = 0
    new_experiment = "exp" + str(max_num + 1)
    return new_experiment
