from app.models.coverage_option import CoverageOption
from app.models.rate_base import RateBase
from app.models.rate_class import RateClass
from app.models.rider_rate import RiderRate


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


# Modified Non-Tobacco is only underwritable at or below this coverage amount.
MODIFIED_NON_TOBACCO_MAX_COVERAGE = 30000
# Modified Tobacco is only underwritable below this coverage amount.
MODIFIED_TOBACCO_MAX_COVERAGE = 21000

# Single source of truth for per-rate-class coverage eligibility, on top of
# the base tobacco-status match below. A class listed here stays in the
# results (it's still tobacco-relevant) but renders as a disabled N/A row
# when its predicate fails, rather than being excluded outright. Add future
# per-class coverage rules here instead of special-casing names in the loop.
_COVERAGE_ELIGIBILITY_RULES = {
    "Modified Non-Tobacco": (
        lambda coverage: coverage <= MODIFIED_NON_TOBACCO_MAX_COVERAGE,
        f"Requires coverage of ${MODIFIED_NON_TOBACCO_MAX_COVERAGE:,} or below",
    ),
    "Modified Tobacco": (
        lambda coverage: coverage < MODIFIED_TOBACCO_MAX_COVERAGE,
        f"Requires coverage below ${MODIFIED_TOBACCO_MAX_COVERAGE:,}",
    ),
}


def get_all_quotes(age, gender, coverage_amount, tobacco_use, product_type="L"):
    _validate_age(age)
    _validate_coverage(coverage_amount, product_type)
    base_rate = _get_base_rate(age, gender, product_type)

    results = []
    for rate_class in RateClass.query.all():
        # A rate class that doesn't match the applicant's tobacco status is
        # not just ineligible, it's not a valid option at all — omit it
        # entirely rather than listing it as a disabled N/A row.
        if bool(tobacco_use) != bool(rate_class.requires_tobacco):
            continue

        coverage_rule = _COVERAGE_ELIGIBILITY_RULES.get(rate_class.name)
        if coverage_rule is not None:
            is_eligible, reason = coverage_rule
            if not is_eligible(coverage_amount):
                results.append(
                    {
                        "rate_class": rate_class.name,
                        "monthly": "N/A",
                        "annual": "N/A",
                        "eligible": False,
                        "reason": reason,
                    }
                )
                continue

        monthly, annual = _compute_premium(base_rate.rate_per_1000, coverage_amount, rate_class.multiplier)
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


def calculate_rider_premium(coverage_amount, rider_name):
    rider = RiderRate.query.filter_by(rider_name=rider_name, is_active=True).first()
    if rider is None:
        raise ValueError(f"Unknown or inactive rider '{rider_name}'")

    monthly = round(rider.rate_per_1000 * (coverage_amount / 1000), 2)
    annual = round(monthly * 12, 2)

    return {"rider_name": rider_name, "monthly": monthly, "annual": annual}


def get_coverage_options(product_type="L"):
    option = _get_coverage_option(product_type)
    return {
        "min": option.min_coverage,
        "max": option.max_coverage,
        "step": option.step,
        "default": option.default_coverage,
    }
