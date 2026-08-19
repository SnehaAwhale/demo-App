from flask import Blueprint
from flask_restx import Api

api_bp = Blueprint("api", __name__)

api = Api(
    api_bp,
    version="1.0",
    title="Life Insurance Quotation API",
    description="API for the life insurance quotation platform",
    doc="/docs",
)

from app.api.health import ns as health_ns
from app.api.quote import ns as quote_ns
from app.api.session import ns as session_ns

api.add_namespace(health_ns, path="/health")
api.add_namespace(session_ns, path="/session")
api.add_namespace(quote_ns, path="/quote")
