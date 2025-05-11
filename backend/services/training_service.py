
import datetime
import json
import os
import re
import subprocess
import threading
from pathlib import Path
from queue import SimpleQueue  # noblocking
from functools import partial
import yaml
from services.env_utils import get_python_interpreter

FOLDER_MODELS = "models"
ANSI_ESCAPE_PATTERN = re.compile(r"\x1B\[[0-?]*[ -/]*[@-~]")
NON_ASCII_PATTERN  = re.compile(r"[^\x00-\x7F]")


def clean_line(line):
    """Strip ANSI codes & non‑ASCII, normalise CR→LF."""
    return NON_ASCII_PATTERN.sub("", ANSI_ESCAPE_PATTERN.sub("", line.replace("\r", "\n")))


WEIGHTS = {
    "yolov5": ["yolov5s.pt", "yolov5m.pt", "yolov5l.pt"],
    "yolov7": [
        "yolov7.pt", "yolov7-tiny.pt", "yolov7-e6.pt", "yolov7-d6.pt", "yolov7x.pt",
    ],
}

train_process = None
log_queue = SimpleQueue()

def create_unique_yaml(train_dir, val_dir, classes, model, folder="yaml"):
    model_yaml_dir = Path(FOLDER_MODELS) / model / folder
    model_yaml_dir.mkdir(parents=True, exist_ok=True)

    file_name = f"data_{datetime.datetime.now():%Y%m%d_%H%M%S}.yaml"
    fp = model_yaml_dir / file_name

    with fp.open("w", encoding="utf-8") as f:
        yaml.dump({
            "train": train_dir,
            "val": val_dir,
            "nc": len(classes),
            "names": classes,
        }, f, default_flow_style=False, allow_unicode=True)

    abs_path = fp.resolve()
    print(f"[DEBUG] YAML created: {abs_path}")
    return str(abs_path)

def resolve_weights(model: str, user_weights):
    repo_dir = Path(FOLDER_MODELS) / model

    def _abs(p: Path):
        return p if p.is_absolute() else (repo_dir / p)

    if not user_weights:
        raise ValueError("No weights specified. Provide --weights or choose a training run.")

    # 1) training run best-pt
    if isinstance(user_weights, dict) and user_weights.get("type") == "runs":
        run_id = user_weights["value"]
        base_dir = Path(os.getcwd()) / FOLDER_MODELS / model / "runs" / "train"
        run_dir = base_dir / run_id / "weights"
        p = run_dir / "best.pt"
        print(f"[DEBUG] user-supplied run checkpoint ⇒ {p}")

    # 2) pretrained weight
    else:
        name = user_weights if isinstance(user_weights, str) else user_weights.get("value")
        p = _abs(Path(name))
        print(f"[DEBUG] user-supplied weights ⇒ {p}")

    if p.is_file():
        return str(p.resolve())
    else:
        raise FileNotFoundError(f"Weights not found at expected path: {p}")

def run_training_logic(data):
    global train_process

    img_size   = data.get("imageSize", 640)
    batch_size = data.get("batchSize", 16)
    epochs     = data.get("epochs", 50)
    model      = data.get("model", "yolov7")
    weights_in = data.get("weights")

    print(f"[DEBUG] params: model={model}, img={img_size}, batch={batch_size}, epochs={epochs}, weights_in={weights_in}")

    yaml_rel = create_unique_yaml(data["dataDir"], data["valDir"], data["classList"], model)

    train_py = (Path(FOLDER_MODELS) / model / "train.py").resolve()
    cwd = train_py.parent
    print(f"[DEBUG] train.py = {train_py}")
    print(f"[DEBUG] cwd      = {cwd}")

    python_path = get_python_interpreter(data.get("model", "yolov7"), data.get("python"))
    print(f"[DEBUG] python   = {python_path}")

    weights_abs = resolve_weights(model, weights_in)

    cmd = [
        python_path,
        "-u",
        str(train_py),
        "--img", str(img_size),
        "--batch", str(batch_size),
        "--epochs", str(epochs),
        "--data", yaml_rel,
        "--weights", weights_abs,
    ]

    # Optional hyperparameters
    lr = data.get("learningRate")
    if lr is not None:
        cmd += ["--lr", str(lr)]

    wd = data.get("weightDecay")
    if wd is not None:
        if model == "yolov5":
            cmd += ["--wd", str(wd)]
        else:
            cmd += ["--weight-decay", str(wd)]

    opt = data.get("optimizer")
    if model == "yolov7":
        if opt and opt.lower().startswith("adam"):
            cmd.append("--adam")
    else:  # yolov5
        if opt:
            cmd += ["--optimizer", opt]

    cos_flag = data.get("cosineScheduler")  # bool or None
    if model == "yolov7":
        if cos_flag is False:
            cmd.append("--linear-lr")
    else:  # yolov5
        if cos_flag:
            cmd.append("--cos-lr")

    dev = data.get("device")
    if dev:
        cmd += ["--device", str(dev)]

    print("[DEBUG] launch cmd →")
    for part in cmd:
        print("       ", part)


    def _worker():
        global train_process
        try:
            train_process = subprocess.Popen(
                cmd,
                bufsize=1,
                text=True,
                encoding="utf-8",
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                cwd=cwd,
                env={**os.environ, "PYTHONUNBUFFERED": "1"},
            )
            print(f"[DEBUG] started PID {train_process.pid}")
        except Exception as e:
            print(f"[ERROR] failed to launch subprocess: {e.__class__.__name__}: {e}")
            log_queue.put(f"LAUNCH ERROR: {e}\n")
            return

        info = json.loads(gpu_data(python_path, cwd))
        log_queue.put(f"[GPU-CHECK] cuda={info['available']} ({info['count']}×{info['name']})\n")
        print(f"[DEBUG] GPU probe → {info}")

        buffer = ""
        for chunk in iter(partial(train_process.stdout.read, 1024), ''):
            buffer += chunk
            while "\n" in buffer:
                line, buffer = buffer.split("\n", 1)
                log_queue.put(clean_line(line + "\n"))
        if buffer:
            log_queue.put(clean_line(buffer))

        train_process.wait()
        log_queue.put(f"Training finished RC={train_process.returncode}\n")
        print(f"[DEBUG] trainer exited RC={train_process.returncode}")
        train_process = None

    threading.Thread(target=_worker, daemon=True).start()
    return {"message": "Training thread started"}


def stop_training_logic():
    global train_process
    if train_process and train_process.poll() is None:
        train_process.terminate()
        train_process = None
        return {"message": "Training stopped"}
    raise RuntimeError("No training process to stop")

def get_training_runs_logic(model, include_all = False):
    print(f"[DEBUG] get_training_runs_logic called for model={model}, include_all={include_all}")
    base_dir = os.path.join(os.getcwd(), FOLDER_MODELS, model, "runs", "train")
    runs = []
    if os.path.exists(base_dir):
        for run_dir in os.listdir(base_dir):
            full_path = os.path.join(base_dir, run_dir)
            if not os.path.isdir(full_path):
                continue

            has_best = os.path.exists(os.path.join(full_path, "weights", "best.pt"))
            if include_all or has_best:
                ts = datetime.datetime.fromtimestamp(
                    os.path.getctime(full_path)
                ).isoformat() + "Z"
                runs.append({
                    "id": run_dir,
                    "name": run_dir,
                    "timestamp": ts,
                    "path": full_path,
                    "has_best": has_best
                })

        runs.sort(key=lambda x: x["timestamp"], reverse=True)

    print(f"[DEBUG] Found runs: {runs}")
    return runs

def get_training_run_data(model, experiment):
    print(f"[DEBUG] get_training_run_data called for model={model}, experiment={experiment}")
    folder = os.path.join(os.getcwd(), FOLDER_MODELS, model, "runs", "train", experiment)
    print(f"[DEBUG] folder={folder}")
    opt_yaml = os.path.join(folder, "opt.yaml")
    if not os.path.exists(opt_yaml):
        raise FileNotFoundError(f"opt.yaml nenalezen: {opt_yaml}")
    opt = yaml.safe_load(open(opt_yaml, encoding="utf-8"))
    print(f"[DEBUG] get_training_run_data opt: {opt}")

    img = opt.get("imgsz") or (opt.get("img_size")[0] if isinstance(opt.get("img_size"), list) else None)
    print(f"[DEBUG] get_training_run_data img: {img}")
    batch = opt.get("batch_size")

    data_yaml = opt.get("data")
    ds = yaml.safe_load(open(data_yaml, encoding="utf-8"))
    result = {"experiment": experiment, "img_size": img, "batch_size": batch, "val": ds.get("val"), "classes": ds.get("names")}
    print(f"[DEBUG] get_training_run_data result: {result}")
    return result

def get_evaluation_data(model, experiment, host_url):
    print(f"[DEBUG] get_evaluation_data called for model={model}, experiment={experiment}, host_url={host_url}")
    base = f"{host_url}/api/training/file/{model}/{experiment}"
    result = {"confusion_matrix_url": base + "/confusion_matrix.png", "f1_curve_url": base + "/F1_curve.png"}
    print(f"[DEBUG] get_evaluation_data result: {result}")
    return result

def gpu_data(python_interpreter, env_cwd):
    code = (
        "import torch, json;"
        "print(json.dumps({"
        "'available': torch.cuda.is_available(),"
        "'count': torch.cuda.device_count(),"
        "'name': torch.cuda.get_device_name(0) if torch.cuda.is_available() else 'cpu'"
        "}))"
    )
    out = subprocess.check_output(
        [python_interpreter, "-c", code],
        cwd=env_cwd, text=True, encoding="utf-8")
    return out.strip()

