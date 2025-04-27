import os
from pathlib import Path

def get_python_interpreter(model, python_override):
    env_name = f"{model}_mm"
    if python_override:
        return python_override

    mm_root = Path(os.environ.get("USERPROFILE", "~")).expanduser() / "micromamba" / "envs" / env_name
    py = mm_root / ("python.exe" if os.name == "nt" else "bin/python")
    print(f"[DEBUG] probing interpreter {py}")
    if not py.is_file():
        raise FileNotFoundError(f"Python interpreter for env '{env_name}' not found at {py}")
    return str(py)
