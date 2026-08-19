import os

from flask import Flask
from flask_cors import CORS

from config import config_by_name
from app.extensions import db


def create_app(config_name=None):
    config_name = config_name or os.environ.get("FLASK_ENV", "development")

    app = Flask(__name__)
    app.config.from_object(config_by_name[config_name])

    os.makedirs(os.path.join(os.path.dirname(app.root_path), "instance"), exist_ok=True)

    CORS(app, resources={r"/api/*": {"origins": app.config["CORS_ORIGINS"]}})

    db.init_app(app)

    from app.api import api_bp

    app.register_blueprint(api_bp, url_prefix="/api")

    with app.app_context():
        from app import models  # noqa: F401 - ensure models are registered before create_all

        db.create_all()

    return app
