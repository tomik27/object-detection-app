import os

from flasgger import swag_from
from flask import Blueprint, request, jsonify, send_from_directory

from services.validation_service import start_validation, list_validation_runs, get_latest_validation_images, \
    get_validation_details, get_validation_runs

validation_bp = Blueprint('validation_bp', __name__)
current_dir = os.path.dirname(os.path.abspath(__file__))
yaml_path = os.path.join(current_dir, 'docs', 'validation_api.yaml')

@validation_bp.route("/start", methods=["POST"])
@swag_from(yaml_path)
def start_validation_route():
    """
    Initiates a validation run.

    Expects JSON data with:
      - source: Path to source images.
      - groundTruth: Path to ground truth (txt files).
      - imgSize: Image size (e.g., 640).
      - conf: Confidence threshold (e.g., 0.25).
      - iou: IOU threshold (e.g., 0.5).
      - trainingRun: Identifier for the training run.
      - model: Model name.

    Returns:
      JSON with the experiment ID.
    """
    data = request.json
    source = data.get("source")
    train_run = data.get("trainingRun")
    img_size = data.get("imgSize", "640")
    conf = data.get("conf", "0.25")
    iou = data.get("iou", "0.5")
    model = data.get("model")

    if not (source and train_run):
        return jsonify({"error": "Missing required parameters"}), 400

    try:
        experiment = start_validation(source, train_run, img_size, conf, iou, model)
        return jsonify({"experiment": experiment}), 200
    except Exception as e:
        return jsonify({"error": f"Validation start failed: {str(e)}"}), 500

@validation_bp.route("/latest-results", methods=["GET"])
@swag_from(yaml_path)
def latest_validation_results():
    """
    Returns a list of the latest validated images for a given experiment.

    Query Parameters:
      - experiment: Experiment identifier (required).
      - model: Model name.
    """
    experiment = request.args.get("experiment")
    model = request.args.get("model")
    if not experiment:
        return jsonify({"error": "Experiment parameter is required"}), 400
    try:
        result = get_latest_validation_images(model, experiment)
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": f"Error getting latest validation images: {str(e)}"}), 500


@validation_bp.route("/get", methods=["GET"])
@swag_from(yaml_path)
def validation_details():
    """
    Returns detailed validation results for a given experiment.

    Query Parameters:
      - experiment: Experiment identifier (required).
      - model: Model name.
    """
    experiment = request.args.get("experiment")
    model = request.args.get("model")
    host_url = request.host_url.rstrip("/")
    if not experiment:
        return jsonify({"error": "Parameter experiment is required"}), 400
    try:
        details = get_validation_details(experiment, host_url, model)
        return jsonify(details), 200
    except Exception as e:
        return jsonify({"error": f"Error getting validation details: {str(e)}"}), 500



@validation_bp.route("/list", methods=["GET"])
@swag_from(yaml_path)
def validation_runs_list():
    """
        Returns a list of validation runs for the specified model.

        Query Parameters:
          - model: Model name (defaults to "yolov5" if not provided).
        """
    model = request.args.get("model", "yolov5")
    try:
        runs = get_validation_runs(model)
        return jsonify(runs)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@validation_bp.route("/file/<model>/<exp>/<filename>", methods=["GET"])
@swag_from(yaml_path)
def get_validation_file(model, exp, filename):
    """todo neudělat jedno api, kde bude parametr se složkou train/val/eval"""
    base_path = os.path.join(os.getcwd(), model, "runs", "val", exp)
    if not os.path.exists(os.path.join(base_path, filename)):
        return jsonify({"error": f"File {filename} not found in experiment {exp}"}), 404
    return send_from_directory(base_path, filename)