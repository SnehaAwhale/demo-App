from app.models.coverage_option import CoverageOption
from app.models.rate_base import RateBase
from app.models.rate_class import RateClass


def _get_coverage_option(product_type):
    option = CoverageOption.query.filter_by(product_type=product_type).first()
    if option is None:
        raise ValueError(f"No coverage options configured for product_type '{product_type}'")
    return option


def _validate_age(age):
    if age < 50 or age > 85:
        raise ValueError("Age must be 50-85")


def _validate_coverage(coverage_amount, product_type):
    option = _get_coverage_option(product_type)
    if coverage_amount < option.min_coverage or coverage_amount > option.max_coverage:
        raise ValueError(
            f"Coverage must be between ${option.min_coverage:,} and ${option.max_coverage:,}"
        )
    if coverage_amount % option.step != 0:
        raise ValueError(f"Coverage must be in increments of ${option.step:,}")
    return option


def _get_rate_class(rate_class_name):
    rate_class = RateClass.query.filter_by(name=rate_class_name).first()
    if rate_class is None:
        raise ValueError(f"Unknown rate class '{rate_class_name}'")
    return rate_class


def _get_base_rate(age, gender, product_type):
    normalized_gender = gender.strip().lower() if isinstance(gender, str) else gender
    rate = RateBase.query.filter_by(age=age, gender=normalized_gender, product_type=product_type).first()
    if rate is None:
        raise ValueError(
            f"No base rate found for age {age}, gender '{gender}', product_type '{product_type}'"
        )
    return rate


def _compute_premium(rate_per_1000, coverage_amount, multiplier):
    monthly = round(rate_per_1000 * (coverage_amount / 1000) * multiplier, 2)
    annual = round(monthly * 12, 2)
    return monthly, annual


def calculate_premium(age, gender, coverage_amount, rate_class_name, product_type="L"):
    _validate_age(age)
    _validate_coverage(coverage_amount, product_type)
    rate_class = _get_rate_class(rate_class_name)
    base_rate = _get_base_rate(age, gender, product_type)

    monthly, annual = _compute_premium(base_rate.rate_per_1000, coverage_amount, rate_class.multiplier)

    return {"monthly_premium": monthly, "annual_premium": annual}


def get_all_quotes(age, gender, coverage_amount, tobacco_use, product_type="L"):
    _validate_age(age)
    _validate_coverage(coverage_amount, product_type)
    base_rate = _get_base_rate(age, gender, product_type)

    results = []
    for rate_class in RateClass.query.all():
        if not tobacco_use and rate_class.requires_tobacco:
            results.append(
                {
                    "rate_class": rate_class.name,
                    "monthly": "N/A",
                    "annual": "N/A",
                    "eligible": False,
                    "reason": "Tobacco rate class - not applicable",
                }
            )
        elif tobacco_use and not rate_class.requires_tobacco:
            results.append(
                {
                    "rate_class": rate_class.name,
                    "monthly": "N/A",
                    "annual": "N/A",
                    "eligible": False,
                    "reason": "Non-tobacco rate class - not applicable",
                }
            )
        else:
            monthly, annual = _compute_premium(
                base_rate.rate_per_1000, coverage_amount, rate_class.multiplier
            )
            results.append(
                {
                    "rate_class": rate_class.name,
                    "monthly": monthly,
                    "annual": annual,
                    "eligible": True,
                }
            )

    results.sort(key=lambda r: r["monthly"] if isinstance(r["monthly"], float) else float("inf"))
    return results


def recalculate_for_coverage(age, gender, new_coverage, tobacco_use, product_type="L"):
    """
    Same as get_all_quotes, named explicitly for the coverage-slider use case:
    the frontend calls this every time the user changes the coverage amount.
    """
    return get_all_quotes(age, gender, new_coverage, tobacco_use, product_type)


def get_coverage_options(product_type="L"):
    option = _get_coverage_option(product_type)
    return {
        "min": option.min_coverage,
        "max": option.max_coverage,
        "step": option.step,
        "default": option.default_coverage,
    }
