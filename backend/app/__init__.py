import os

from flask import Flask, send_from_directory
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
        from app.seeds.seed_data import seed_all

        db.create_all()
        # Idempotent (get-or-create) — safe to run on every boot, and keeps
        # a fresh database (e.g. a new Postgres instance on Railway) self-healing
        # without a manual seed step.
        seed_all()

    # Serve the built React app (frontend/dist, from `npm run build`) in production.
    frontend_dist = os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "dist")

    @app.route("/", defaults={"path": ""})
    @app.route("/<path:path>")
    def serve_react(path):
        if path and os.path.exists(os.path.join(frontend_dist, path)):
            return send_from_directory(frontend_dist, path)
        return send_from_directory(frontend_dist, "index.html")

    return app
