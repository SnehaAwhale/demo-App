from flask_restx import Namespace, Resource

ns = Namespace("health", description="Service health checks")


@ns.route("")
class Health(Resource):
    def get(self):
        """Return service health status"""
        return {"status": "ok"}, 200
