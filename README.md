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

- [Anaconda](https://www.anaconda.com/products/distribution)
- [Node.js and npm](https://nodejs.org/)
- Git
- Python 3.10 (managed via Conda)

---

## Project Structure

```text
object-detection-app/
├── backend/
│   ├── app/                         # Flask API logic
│   ├── environment.yml              # Conda env for backend
│   └── models/
│       ├── yolov5-environment.yml   # Conda env file for YOLOv5
│       ├── yolov7-environment.yml   # Conda env file for YOLOv7
│       ├── setup_models.sh          # YOLO setup script (Linux/macOS)
│       └── setup_models.bat         # YOLO setup script (Windows)
├── frontend/                        # React frontend
├── install.sh                       # One-command installer (Linux/macOS)
├── install.bat                      # One-command installer (Windows)
├── start.sh                         # Run backend + frontend (Linux/macOS)
├── start.bat                        # Run backend + frontend (Windows)
└── README.md                       
```
## Setup

---

## 🔧 Installation

Install all environments and dependencies in one step:

### On Windows

```cmd
install.bat
```

### On Linux/macOS

```bash
bash install.sh
```

This will:

- Create the `backend_env` (Flask backend)
- Clone YOLOv5 and YOLOv7, and create their environments: `yolo5_env`, `yolo7_env`
- Install frontend dependencies using `npm install`

---

## 🚀 Run the Application

Start the whole project using:

### On Windows

```cmd
start.bat
```

### On Linux/macOS

```bash
bash start.sh
```

---

## 🌐 Access the Application

| Component           | URL                          |
|---------------------|------------------------------|
| Frontend            | http://localhost:3000        |
| Backend             | http://localhost:5000/api    |
| Backend swagger api | http://localhost:5000/apidocs/    |

