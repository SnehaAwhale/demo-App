from app.extensions import db


class RiderRate(db.Model):
    __tablename__ = "rider_rates"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    rider_name = db.Column(db.Text, unique=True, nullable=False)
    rate_per_1000 = db.Column(db.Float, nullable=False)
    description = db.Column(db.Text)
    is_active = db.Column(db.Boolean, nullable=False, default=True)

    def to_dict(self):
        return {
            "id": self.id,
            "rider_name": self.rider_name,
            "rate_per_1000": self.rate_per_1000,
            "description": self.description,
            "is_active": self.is_active,
        }
