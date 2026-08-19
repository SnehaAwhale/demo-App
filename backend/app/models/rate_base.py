from app.extensions import db


class RateBase(db.Model):
    __tablename__ = "rate_base"
    __table_args__ = (
        db.UniqueConstraint("age", "gender", "product_type", name="uq_rate_base_age_gender_product"),
    )

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    age = db.Column(db.Integer, nullable=False)
    gender = db.Column(db.Text, nullable=False)
    rate_per_1000 = db.Column(db.Float, nullable=False)
    product_type = db.Column(db.Text, nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "age": self.age,
            "gender": self.gender,
            "rate_per_1000": self.rate_per_1000,
            "product_type": self.product_type,
        }
