from app.extensions import db
from app.models.coverage_option import CoverageOption
from app.models.rate_base import RateBase
from app.models.rate_class import RateClass

RATE_CLASSES = [
    ("Level Preferred", 1.000, False, "Best health, no tobacco"),
    ("Level Non-Tobacco", 1.190, False, "Standard health, no tobacco"),
    ("Modified Non-Tobacco", 1.350, False, "Health conditions, no tobacco"),
    ("Level Tobacco", 1.585, True, "Tobacco user, good health"),
    ("Modified Tobacco", 1.750, True, "Tobacco user, health conditions"),
]

RATE_BASE_AT_50 = {"female": 2.211, "male": 2.654}
RATE_BASE_GROWTH = 1.039
RATE_BASE_MIN_AGE = 50
RATE_BASE_MAX_AGE = 85
RATE_BASE_PRODUCT_TYPE = "L"

COVERAGE_OPTIONS = [
    ("L", 5000, 50000, 1000, 35000),
    ("S", 5000, 35000, 1000, 25000),
]


def seed_rate_classes():
    for name, multiplier, requires_tobacco, description in RATE_CLASSES:
        rate_class = RateClass.query.filter_by(name=name).first()
        if rate_class is None:
            rate_class = RateClass(name=name)
            db.session.add(rate_class)

        rate_class.multiplier = multiplier
        rate_class.requires_tobacco = requires_tobacco
        rate_class.description = description
        rate_class.is_active = True

    db.session.commit()


def seed_rate_base():
    for gender, base_rate in RATE_BASE_AT_50.items():
        for age in range(RATE_BASE_MIN_AGE, RATE_BASE_MAX_AGE + 1):
            rate_per_1000 = round(base_rate * (RATE_BASE_GROWTH ** (age - RATE_BASE_MIN_AGE)), 4)

            rate = RateBase.query.filter_by(
                age=age, gender=gender, product_type=RATE_BASE_PRODUCT_TYPE
            ).first()
            if rate is None:
                rate = RateBase(age=age, gender=gender, product_type=RATE_BASE_PRODUCT_TYPE)
                db.session.add(rate)

            rate.rate_per_1000 = rate_per_1000

    db.session.commit()


def seed_coverage_options():
    for product_type, min_coverage, max_coverage, step, default_coverage in COVERAGE_OPTIONS:
        option = CoverageOption.query.filter_by(product_type=product_type).first()
        if option is None:
            option = CoverageOption(product_type=product_type)
            db.session.add(option)

        option.min_coverage = min_coverage
        option.max_coverage = max_coverage
        option.step = step
        option.default_coverage = default_coverage

    db.session.commit()


def seed_all():
    seed_rate_classes()
    seed_rate_base()
    seed_coverage_options()
