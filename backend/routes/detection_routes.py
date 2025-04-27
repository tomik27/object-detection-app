import os
from flask import Blueprint, request, jsonify, send_from_directory
from services.detection_service import run_detection_logic, get_latest_images_logic, get_detection_list, get_detection
from flasgger import swag_from

detect_bp = Blueprint('detect_bp', __name__)
current_dir = os.path.dirname(os.path.abspath(__file__))
yaml_path = os.path.join(current_dir, 'docs', 'detection_api.yaml')


@detect_bp.route("/", methods=["POST"])
@swag_from(yaml_path)
def start_detection():
    """Starts the detection process"""
    try:
        experiment, command = run_detection_logic(request.form)
        return jsonify({
            "message": "Detection initiated",
            "experiment": experiment,
            "command": command
        }), 202
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@detect_bp.route("/get", methods=["GET"])
@swag_from("docs/detection_api.yaml")
def detection():
    """Returns detection results for a given experiment."""
    experiment = request.args.get("experiment")
    model = request.args.get("model", "yolov5")
    if not experiment:
        return jsonify({"error": "Experiment parameter is required"}), 400

    host_url = request.host_url.rstrip("/")
    try:
        detection_data = get_detection(model, experiment, host_url)
        return jsonify(detection_data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@detect_bp.route("/list", methods=["GET"])
@swag_from(yaml_path)
def list_detection_runs():
    """Returns a list of detection runs for the specified model."""
    model = request.args.get("model", "yolov5")
    if not model:
        return jsonify({"error": "Model parameter is required"}), 400

    try:
        runs = get_detection_list(model)
        return jsonify(runs)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@detect_bp.route("/latest", methods=["GET"])
@swag_from(yaml_path)
def get_latest_images():
    """
    Returns the latest detected images for the given experiment.

    Query Parameters:
      - experiment: (required) the experiment ID.
      - model: (optional) model name.
    """
    experiment = request.args.get("experiment")
    model = request.args.get("model")
    if not experiment:
        return jsonify({"error": "Experiment parameter is required"}), 400
    if not model:
        return jsonify({"error": "Model parameter is required"}), 400

    try:
        result = get_latest_images_logic(model, experiment)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@detect_bp.route("/image/<model>/<exp_folder>/<filename>", methods=["GET"])
@swag_from(yaml_path)
def get_detection_image(model, exp_folder, filename):
    """Returns a specific detected image file"""
    base_dir = os.path.join(os.getcwd(),"models", model, "runs", "detect", exp_folder)
    return send_from_directory(base_dir, filename)
