import os

from flasgger import swag_from
from flask import Blueprint, request, jsonify, Response, send_from_directory
from services.training_service import run_training_logic, stop_training_logic, get_training_runs_logic, log_queue, \
    get_training_run_data, get_evaluation_data

training_bp = Blueprint('training_bp', __name__)
current_dir = os.path.dirname(os.path.abspath(__file__))
yaml_path = os.path.join(current_dir, 'docs', 'training_api.yaml')


@training_bp.route("/", methods=["POST"])
@swag_from(yaml_path)
def start_training():
    """Starts the training process for a model."""
    data = request.json
    try:
        result = run_training_logic(data)
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@training_bp.route("/stop", methods=["POST"])
@swag_from(yaml_path)
def stop_training():
    """Stops the currently running training process."""
    try:
        result = stop_training_logic()
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@training_bp.route("/list", methods=["GET"])
@swag_from(yaml_path)
def list_training_runs():
    """Returns a list of training runs for a specified model."""
    model = request.args.get("model", "yolov5")
    try:
        runs = get_training_runs_logic(model)
        return jsonify(runs), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@training_bp.route("/logs", methods=["GET"])
@swag_from(yaml_path)
def stream_logs():
    def generate():
        while True:
            line = log_queue.get()  # Blokující vyčítání nové zprávy
            yield f"data: {line}\n\n"
    return Response(generate(), mimetype="text/event-stream")

@training_bp.route("/getData", methods=["GET"])
@swag_from(yaml_path)
def get_training_data():
    """Retrieves training run data."""
    model = request.args.get("model", "yolov5")
    experiment = request.args.get("experiment")

    if not experiment:
        return jsonify({"error": "experiment parameter is required"}), 400

    try:
        data = get_training_run_data(model, experiment)
        return jsonify(data), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@training_bp.route("/get", methods=["GET"])
@swag_from(yaml_path)
def get_evaluation():
    """Returns evaluation data for a specific training run. """
    experiment = request.args.get("experiment")
    model = request.args.get("model")

    if not experiment:
        return jsonify({"error": "Experiment parameter is required"}), 400

    host_url = request.host_url.rstrip("/")
    try:
        eval_data = get_evaluation_data(model, experiment, host_url)
        return jsonify(eval_data), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@training_bp.route("/file/<model>/<exp>/<filename>", methods=["GET"])
@swag_from(yaml_path)
def get_evaluation_file(model, exp, filename):
    """Returns a specific file from the evaluation results."""
    base_path = os.path.join(os.getcwd(), model, "runs", "train", exp)
    if not os.path.exists(os.path.join(base_path, filename)):
        return jsonify({"error": f"File {filename} not found in experiment {exp}"}), 404
    return send_from_directory(base_path, filename)