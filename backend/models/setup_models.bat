@echo off

echo 📦 Cloning YOLOv5...
git clone https://github.com/ultralytics/yolov5.git backend\models\yolov5

echo 📦 Cloning YOLOv7...
git clone https://github.com/WongKinYiu/yolov7.git backend\models\yolov7

echo 📄 Copying environment.yml files...
copy backend\models\yolov5-environment.yml backend\models\yolov5\environment.yml
copy backend\models\yolov7-environment.yml backend\models\yolov7\environment.yml

echo 🐍 Creating yolo5_env...
cd backend\models\yolov5
conda env create -f environment.yml

echo 🐍 Creating yolo7_env...
cd ..\yolov7
conda env create -f environment.yml

echo ✅ YOLO models and environments are ready!
