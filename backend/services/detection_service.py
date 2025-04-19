import os
import subprocess
import threading
import time
import datetime
from flask import request  # Needed for extracting host URL in get_latest_images_logic
FOLDER_MODELS = "models"
def run_detection_logic(form):
    training_run = form.get("trainingRun")
    source = form.get("source")
    model = form.get("model")
    if not model:
        raise Exception("Model parameter is required")

    img_size = form.get("img_size", "640")
    conf = form.get("conf", "0.4")
    iou = form.get("iou", "0.45")
    weight_file = os.path.join("runs", "train", training_run, "weights", "best.pt")
    if not os.path.exists(os.path.join(FOLDER_MODELS, model, weight_file)):
        raise Exception(f"Weight file not found for training run: {training_run}")

    # Determine a new experiment number
    base_detect_dir = os.path.join(os.getcwd(),FOLDER_MODELS, model, "runs", "detect")
    if not os.path.exists(base_detect_dir):
        os.makedirs(base_detect_dir, exist_ok=True)
    exp_dirs = [
        d for d in os.listdir(base_detect_dir)
        if os.path.isdir(os.path.join(base_detect_dir, d)) and d.startswith("exp")
    ]
    if exp_dirs:
        max_num = max([int(d[3:]) for d in exp_dirs if d[3:].isdigit()] or [0])
    else:
        max_num = 0
    new_experiment = f"exp{max_num + 1}"

    # Construct the detection command
    cmd = [
        "python", "detect.py",
        "--weights", weight_file,
        "--img", str(img_size),
        "--source", source,
        "--conf", str(conf),
        "--iou", str(iou),
        "--project", os.path.join("runs", "detect"),
        "--name", new_experiment,
        "--exist-ok"
    ]

    def run_detection():
        cwd_path = os.path.join(os.getcwd(),FOLDER_MODELS, model)
        process = subprocess.Popen(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            cwd=cwd_path
        )
        for line in process.stdout:
            print(line, end="")
        process.stdout.close()
        process.wait()

    threading.Thread(target=run_detection).start()
    # Return the new experiment id and the full command as debug info
    return new_experiment, " ".join(cmd)

def get_latest_images_logic(model, experiment, timeout=10, poll_interval=1):
    base_detect_dir = os.path.join(os.getcwd(), FOLDER_MODELS, model, "runs", "detect")
    experiment_folder = os.path.join(base_detect_dir, experiment)
    waited = 0
    while waited < timeout and not os.path.exists(experiment_folder):
        time.sleep(poll_interval)
        waited += poll_interval
    if not os.path.exists(experiment_folder):
        return None

    image_files = [f for f in os.listdir(experiment_folder)
                   if f.lower().endswith(('.png', '.jpg', '.jpeg'))
                   and os.path.isfile(os.path.join(experiment_folder, f))]
    if not image_files:
        return None
    image_files.sort(key=lambda f: os.path.getmtime(os.path.join(experiment_folder, f)), reverse=True)
    host_url = request.host_url.rstrip('/')
    image_urls = [f"{host_url}/api/detection/image/{model}/{experiment}/{f}" for f in image_files]
    return {"experiment": experiment, "images": image_urls}


def get_detection_list(model):
    base_dir = os.path.join(os.getcwd(), FOLDER_MODELS, model, "runs", "detect")
    runs = []
    if os.path.exists(base_dir):
        for run_dir in os.listdir(base_dir):
            full_run_path = os.path.join(base_dir, run_dir)
            if os.path.isdir(full_run_path):
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

def get_detection(model, experiment, host_url):
    base_detect_dir = os.path.join(os.getcwd(), FOLDER_MODELS, model, "runs", "detect")
    experiment_folder = os.path.join(base_detect_dir, experiment)

    if not os.path.exists(experiment_folder):
        raise Exception("Detection run folder not found")

    # Get all image files (supported formats: .png, .jpg, .jpeg)
    files = os.listdir(experiment_folder)
    image_files = [f for f in files if f.lower().endswith(('.png', '.jpg', '.jpeg'))]

    image_urls = [f"{host_url}/api/detection/image/{model}/{experiment}/{f}" for f in image_files]
    return {"experiment": experiment, "images": image_urls}
