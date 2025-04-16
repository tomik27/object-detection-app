import os
from flask import Blueprint, request, jsonify, send_from_directory
from services.evaluation_service import get_evaluation_data

evaluation_bp = Blueprint('evaluation_bp', __name__)

@evaluation_bp.route("/", methods=["GET"])
def evaluation():
    """Vrátí hodnocení experimentu"""
    experiment = request.args.get("experiment")
    model = request.args.get("model")

    if not experiment:
        return jsonify({"error": "Experiment parameter is required"}), 400

    host_url = request.host_url.rstrip("/")
    try:
        eval_data = get_evaluation_data(model, experiment, host_url)
        return jsonify(eval_data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@evaluation_bp.route("/file/<model>/<exp>/<filename>", methods=["GET"])
def get_evaluation_file(model, exp, filename):
    """Vrátí konkrétní soubor s výsledky hodnocení"""
    base_path = os.path.join(os.getcwd(), model, "runs", "train", exp)
    if not os.path.exists(os.path.join(base_path, filename)):
        return jsonify({"error": f"File {filename} not found in experiment {exp}"}), 404
    return send_from_directory(base_path, filename)
