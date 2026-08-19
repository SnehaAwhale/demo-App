from app.extensions import db


class CoverageOption(db.Model):
    __tablename__ = "coverage_options"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    product_type = db.Column(db.Text, unique=True, nullable=False)
    min_coverage = db.Column(db.Integer, nullable=False)
    max_coverage = db.Column(db.Integer, nullable=False)
    step = db.Column(db.Integer, nullable=False)
    default_coverage = db.Column(db.Integer, nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "product_type": self.product_type,
            "min_coverage": self.min_coverage,
            "max_coverage": self.max_coverage,
            "step": self.step,
            "default_coverage": self.default_coverage,
        }
