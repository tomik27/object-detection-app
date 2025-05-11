# Object Detection App

A full-stack web application for training, managing, and running object detection models using YOLOv5 and YOLOv7.  
The backend is built with Flask (Python) and the frontend is built using React (JavaScript).

---

## Features

- Web-based interface for object detection
- Separate Conda environments for YOLOv5 and YOLOv7
- API-based communication with subprocess model execution

---

## Requirements

- Micromamba
- [Node.js and npm](https://nodejs.org/)
- Git
- CUDA (optional, required for GPU)

---

## Project Structure

```text
object-detection-app/
├── backend/                        # Flask API logic
│   ├── app/
│   ├── environment.yml            # Micromamba env for backend
│   └── models/
│       ├── yolov5-environment.yml # Micromamba env file for YOLOv5
│       ├── yolov7-environment.yml # Micromamba env file for YOLOv7
│       ├── setup_models.sh        # YOLO setup script (Linux/macOS)
│       └── setup_models.bat       # YOLO setup script (Windows)
├── frontend/                       # React frontend
│   ├── components/                # UI components
│   │   ├── Annotation/
│   │   ├── Common/
│   │   ├── Detection/
│   │   ├── Evaluation/
│   │   ├── Training/
│   │   └── Validation/
│   └── App.jsx
├── scripts/                       # Training and install scripts
│   ├── annotations/               # Annotation files
│   ├── install_mm.bat             # Windows Micromamba installer
│   ├── start_mm.bat               # Windows Micromamba starter
│   └── mini_coco_3class.py        # Dataset prep script
└── README.md                      # This file
```

## 🔧 Installation

Install all environments and dependencies in one step.

### On Windows (Micromamba)

```cmd
scripts\install_mm.bat
```

This will:

- Create the `backend_mm` (Flask backend)
- Clone YOLOv5 and YOLOv7, and create their environments: `yolov5_mm`, `yolov7_mm`
- Install frontend dependencies using `npm install`


## 🚀 Run the Application

Start the whole project using:

### On Windows

```cmd
scripts\start_mm.bat
```

## 🌐 Access the Application

| Component           | URL                            |
|---------------------|--------------------------------|
| Frontend            | http://localhost:5173          |
| Backend             | http://localhost:5000/api      |
| Backend swagger api | http://localhost:5000/apidocs/ |

