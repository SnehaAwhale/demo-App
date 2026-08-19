from app.extensions import db


class RateClass(db.Model):
    __tablename__ = "rate_classes"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name = db.Column(db.Text, unique=True, nullable=False)
    multiplier = db.Column(db.Float, nullable=False)
    requires_tobacco = db.Column(db.Boolean, nullable=False)
    description = db.Column(db.Text)
    is_active = db.Column(db.Boolean, nullable=False, default=True)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "multiplier": self.multiplier,
            "requires_tobacco": self.requires_tobacco,
            "description": self.description,
            "is_active": self.is_active,
        }
