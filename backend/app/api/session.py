from flask_restx import Namespace, Resource, fields

from app.core.constants import SessionStatus
from app.core.id_generator import generate_unique_application_id
from app.extensions import db
from app.models.session import Session

ns = Namespace("session", description="Quotation session management")

session_model = ns.model(
    "Session",
    {
        "application_id": fields.String(description="Unique Application ID for the quotation session"),
        "status": fields.String(description="Current session status"),
        "created_at": fields.String(description="Session creation timestamp (ISO 8601)"),
        "updated_at": fields.String(description="Session last updated timestamp (ISO 8601)"),
    },
)


@ns.route("/start")
class SessionStart(Resource):
    @ns.marshal_with(session_model, code=201)
    @ns.response(500, "Unable to generate a unique Application ID")
    def post(self):
        """Start a new quotation session and issue an Application ID"""
        try:
            application_id = generate_unique_application_id()
        except RuntimeError as exc:
            ns.abort(500, message=str(exc))

        session = Session(id=application_id, status=SessionStatus.IN_PROGRESS)
        db.session.add(session)
        db.session.commit()
        return session.to_dict(), 201


@ns.route("/<string:application_id>/complete")
@ns.param("application_id", "The Application ID of the session to complete")
class SessionComplete(Resource):
    @ns.marshal_with(session_model, code=200)
    @ns.response(404, "Session not found")
    @ns.response(409, "Session cannot be completed from its current status")
    def post(self, application_id):
        """Mark a quotation session as completed, retiring the Application ID"""
        session = Session.query.get(application_id)
        if session is None:
            ns.abort(404, message=f"Session '{application_id}' not found")

        if session.status != SessionStatus.IN_PROGRESS:
            ns.abort(
                409,
                message=f"Session '{application_id}' cannot be completed from status '{session.status}'",
            )

        session.status = SessionStatus.COMPLETED
        db.session.commit()
        return session.to_dict(), 200
