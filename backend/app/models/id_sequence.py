from app.extensions import db


class IdSequence(db.Model):
    """Single-row table tracking the 3-digit Application ID counter."""

    __tablename__ = "id_sequences"

    id = db.Column(db.Integer, primary_key=True)
    current_value = db.Column(db.Integer, nullable=False, default=999)
