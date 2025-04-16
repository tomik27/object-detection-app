# app.py
from flask import Flask
from flask_cors import CORS

from routes.detection_routes import detect_bp
from routes.evaluation_routes import evaluation_bp
from routes.training_routes import training_bp
from routes.validation_routes import validation_bp
from flasgger import Swagger


def create_app():
    app = Flask(__name__)
    swagger = Swagger(app)
    CORS(app)
    app.register_blueprint(training_bp, url_prefix='/api/training')
    app.register_blueprint(detect_bp, url_prefix='/api/detection')
    app.register_blueprint(evaluation_bp, url_prefix='/api/evaluation')
    app.register_blueprint(validation_bp, url_prefix='/api/validation')

    return app

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True)
