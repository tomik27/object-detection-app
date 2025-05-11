"""
mini_coco_3class_plus_detect.py
-------------------------------------------------
Creates a balanced *mini‑dataset* from COCO 2017 containing three classes
(`person`, `car`, `dog`) and three **mutually exclusive** splits:

The script YAML configuration files:

* `dataset.yaml`        – classic train setup (for model training)
* `dataset_val.yaml`    – points **only** to the val split (for independent eval)
Example usage::

    yolo task=detect mode=train  data=mini_coco_3class/dataset.yaml
    yolo task=detect mode=val    data=mini_coco_3class/dataset_val.yaml
    yolo task=detect mode=predict model=best.pt source=mini_coco_3class/detect/images

Runs without CLI arguments – tweak the constants at the top if needed.
"""

import json
import random
import urllib.request
import zipfile
from collections import defaultdict
from pathlib import Path
from typing import Dict, List, Set

from tqdm import tqdm

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
CLASSES: Dict[int, str] = {1: "person", 3: "car", 18: "dog"}
MAX_PER_CLASS_TRAIN: int = 1000    # instances per class in the train split
MAX_PER_CLASS_VAL: int = 250       # instances per class in the val split
MAX_DETECT_IMAGES: int = 20        # total images placed in the detect split
SEED: int = 42
OUT: Path = Path("mini_coco_3class")

# COCO addresses
ANN_ZIP_URL: str = (
    "http://images.cocodataset.org/annotations/annotations_trainval2017.zip"
)
ANN_ZIP_FILE: str = "annotations_trainval2017.zip"
TRAIN_JSON: Path = Path("annotations") / "instances_train2017.json"
VAL_JSON: Path = Path("annotations") / "instances_val2017.json"
TRAIN_IMG_BASE: str = "http://images.cocodataset.org/train2017/"
VAL_IMG_BASE: str = "http://images.cocodataset.org/val2017/"

random.seed(SEED)

# ---------------------------------------------------------------------------
# Helper functions
# ---------------------------------------------------------------------------

def download(url: str, dest: Path) -> None:
    """Download *url* to *dest* unless it already exists."""
    if dest.exists():
        return
    dest.parent.mkdir(parents=True, exist_ok=True)
    print(f"⇣  {dest.name}")
    urllib.request.urlretrieve(url, dest)


def ensure_annotations() -> None:
    """Ensure that COCO JSON annotations for train and val are extracted."""
    if TRAIN_JSON.exists() and VAL_JSON.exists():
        return
    download(ANN_ZIP_URL, Path(ANN_ZIP_FILE))
    print("· extracting annotations …")
    with zipfile.ZipFile(ANN_ZIP_FILE) as z:
        for member in (TRAIN_JSON.as_posix(), VAL_JSON.as_posix()):
            z.extract(member)


def parse_coco(json_path: Path):
    with open(json_path, "r", encoding="utf-8") as f:
        coco = json.load(f)
    id2file = {img["id"]: img["file_name"] for img in coco["images"]}
    dimensions = {img["id"]: (img["width"], img["height"]) for img in coco["images"]}
    anns_per_img: Dict[int, List[dict]] = defaultdict(list)
    for ann in coco["annotations"]:
        if ann["category_id"] in CLASSES:
            anns_per_img[ann["image_id"]].append(ann)
    return id2file, dimensions, anns_per_img


def balanced_select(
    anns_per_img: Dict[int, List[dict]],
    max_per_class: int,
) -> List[int]:
    """Pick images so that each class reaches up to *max_per_class* instances."""
    selected: List[int] = []
    per_class: Dict[int, int] = defaultdict(int)
    for iid, anns in anns_per_img.items():
        cats: Set[int] = {a["category_id"] for a in anns}
        need: bool = any(per_class[c] < max_per_class for c in cats)
        if need:
            selected.append(iid)
            for c in cats:
                per_class[c] += 1
        if all(per_class[c] >= max_per_class for c in CLASSES):
            break
    print("Vybráno obrázků:", len(selected))
    for cid, name in CLASSES.items():
        print(f"{name:6}: {per_class[cid]}")
    return selected


def save_yolo_label(
    iid: int,
    anns: List[dict],
    dim: Dict[int, tuple],
    part_dir: Path,
) -> None:
    """Save YOLO *.txt* label for a given image id.*"""
    W, H = dim[iid]
    lines: List[str] = []
    for a in anns:
        cid = a["category_id"]
        x, y, w, h = a["bbox"]
        xc, yc = (x + w / 2) / W, (y + h / 2) / H
        lines.append(
            f"{list(CLASSES).index(cid)} {xc:.6f} {yc:.6f} {w / W:.6f} {h / H:.6f}"
        )
    lbl_path = part_dir / "labels" / (str(iid).zfill(12) + ".txt")
    lbl_path.write_text("\n".join(lines))


def prepare_split(
    name: str,
    ids: List[int],
    id2file: Dict[int, str],
    dim: Dict[int, tuple],
    anns_per_img: Dict[int, List[dict]],
    img_base_url: str,
) -> None:
    part_dir = OUT / name
    (part_dir / "images").mkdir(parents=True, exist_ok=True)
    (part_dir / "labels").mkdir(parents=True, exist_ok=True)

    for iid in tqdm(ids, desc=f"⇣  {name} images"):
        fname = id2file[iid]
        img_dest = part_dir / "images" / fname
        if not img_dest.exists():
            urllib.request.urlretrieve(img_base_url + fname, img_dest)
        save_yolo_label(iid, anns_per_img[iid], dim, part_dir)


def write_yaml(path: Path, split_key: str, split_subdir: str) -> None:
    """Write a minimal YOLOv8 YAML pointing at a single split."""
    lines = [
        f"path: {OUT.resolve()}",
        f"{split_key}: {split_subdir}/images",
        "names:",
    ]
    for i, name in enumerate(CLASSES.values()):
        lines.append(f"  {i}: {name}")
    path.write_text("\n".join(lines))

if __name__ == "__main__":
    OUT.mkdir(exist_ok=True)
    ensure_annotations()

    # --------------------------- Train split ----------------------------
    id2file_tr, dim_tr, anns_tr = parse_coco(TRAIN_JSON)
    train_ids = balanced_select(anns_tr, MAX_PER_CLASS_TRAIN)

    # --------------------------- Val split ------------------------------
    id2file_val, dim_val, anns_val = parse_coco(VAL_JSON)
    val_ids = balanced_select(anns_val, MAX_PER_CLASS_VAL)

    # --------------------------- Detect split ---------------------------
    detect_candidates = list(set(id2file_val.keys()) - set(val_ids))
    if len(detect_candidates) < MAX_DETECT_IMAGES:
        raise RuntimeError("Not enough images left to build detect split without overlap.")
    random.shuffle(detect_candidates)
    detect_ids = detect_candidates[:MAX_DETECT_IMAGES]
    print("Detect split images:", len(detect_ids))

    # --------------------------- Download & save ------------------------
    prepare_split("train", train_ids, id2file_tr, dim_tr, anns_tr, TRAIN_IMG_BASE)
    prepare_split("val", val_ids, id2file_val, dim_val, anns_val, VAL_IMG_BASE)
    prepare_split("detect", detect_ids, id2file_val, dim_val, anns_val, VAL_IMG_BASE)

    # --------------------------- YAMLs ----------------------------------
    # Classic train+val YAML
    trainval_yaml = [
        f"path: {OUT.resolve()}",
        "train: train/images",
        "val: val/images",
        "names:",
    ]
    for i, name in enumerate(CLASSES.values()):
        trainval_yaml.append(f"  {i}: {name}")
    (OUT / "dataset.yaml").write_text("\n".join(trainval_yaml))

    # Val‑only YAML
    write_yaml(OUT / "dataset_val.yaml", "val", "val")

    # Detect‑only YAML – uses the 'test' key as expected by YOLOv8
    write_yaml(OUT / "dataset_detect.yaml", "test", "detect")

    print("\n✅ Dataset ready in", OUT.resolve())
