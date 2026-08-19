from datetime import datetime, timezone

from app.extensions import db


class Quote(db.Model):
    __tablename__ = "quotes"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    application_id = db.Column(db.String(64), db.ForeignKey("sessions.id"), nullable=False)
    first_name = db.Column(db.Text)
    last_name = db.Column(db.Text)
    date_of_birth = db.Column(db.Text)
    age = db.Column(db.Integer)
    gender = db.Column(db.Text)
    state = db.Column(db.Text)
    zip_code = db.Column(db.String(5))
    tobacco_use = db.Column(db.Boolean)
    coverage_amount = db.Column(db.Integer)
    selected_rate_class = db.Column(db.Text)
    monthly_premium = db.Column(db.Float)
    annual_premium = db.Column(db.Float)
    product_type = db.Column(db.Text)
    created_at = db.Column(db.DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(
        db.DateTime,
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    def to_dict(self):
        return {
            "id": self.id,
            "application_id": self.application_id,
            "first_name": self.first_name,
            "last_name": self.last_name,
            "date_of_birth": self.date_of_birth,
            "age": self.age,
            "gender": self.gender,
            "state": self.state,
            "zip_code": self.zip_code,
            "tobacco_use": self.tobacco_use,
            "coverage_amount": self.coverage_amount,
            "selected_rate_class": self.selected_rate_class,
            "monthly_premium": self.monthly_premium,
            "annual_premium": self.annual_premium,
            "product_type": self.product_type,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
        }
