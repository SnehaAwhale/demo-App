import pytest

from services.premium_calculator import calculate_premium, get_all_quotes

NON_TOBACCO_CLASSES = ["Level Preferred", "Level Non-Tobacco", "Modified Non-Tobacco"]
TOBACCO_CLASSES = ["Level Tobacco", "Modified Tobacco"]


def test_1_age_50_female_level_preferred(app):
    result = calculate_premium(50, "female", 35000, "Level Preferred")
    assert result == {"monthly_premium": 77.38, "annual_premium": 928.56}


def test_2_age_50_female_level_non_tobacco(app):
    result = calculate_premium(50, "female", 35000, "Level Non-Tobacco")
    assert result["monthly_premium"] == 92.09


def test_3_age_50_female_level_tobacco(app):
    result = calculate_premium(50, "female", 35000, "Level Tobacco")
    assert result["monthly_premium"] == 122.66


def test_4_age_51_female_level_preferred(app):
    result = calculate_premium(51, "female", 35000, "Level Preferred")
    assert result["monthly_premium"] == 80.40


def test_5_age_56_female_level_preferred(app):
    result = calculate_premium(56, "female", 35000, "Level Preferred")
    assert result["monthly_premium"] == 97.35


def test_6_coverage_change(app):
    lower = calculate_premium(50, "female", 25000, "Level Preferred")
    higher = calculate_premium(50, "female", 50000, "Level Preferred")
    assert lower["monthly_premium"] == 55.27
    assert higher["monthly_premium"] == 110.55


def test_7_tobacco_filtering_non_tobacco_user(app):
    quotes = get_all_quotes(50, "female", 35000, tobacco_use=False)
    by_name = {quote["rate_class"]: quote for quote in quotes}

    for name in NON_TOBACCO_CLASSES:
        assert by_name[name]["eligible"] is True
        assert by_name[name]["monthly"] != "N/A"

    for name in TOBACCO_CLASSES:
        assert by_name[name]["eligible"] is False
        assert by_name[name]["monthly"] == "N/A"
        assert by_name[name]["annual"] == "N/A"


def test_8_tobacco_filtering_tobacco_user(app):
    quotes = get_all_quotes(50, "female", 35000, tobacco_use=True)
    by_name = {quote["rate_class"]: quote for quote in quotes}

    for name in TOBACCO_CLASSES:
        assert by_name[name]["eligible"] is True
        assert by_name[name]["monthly"] != "N/A"

    for name in NON_TOBACCO_CLASSES:
        assert by_name[name]["eligible"] is False
        assert by_name[name]["monthly"] == "N/A"
        assert by_name[name]["annual"] == "N/A"


def test_9_age_validation(app):
    with pytest.raises(ValueError, match=r"^Age must be 50-85$"):
        calculate_premium(45, "female", 35000, "Level Preferred")


def test_10_coverage_max_validation(app):
    with pytest.raises(ValueError, match=r"^Coverage must be between \$5,000 and \$50,000$"):
        calculate_premium(50, "female", 60000, "Level Preferred")


def test_10_coverage_step_validation(app):
    with pytest.raises(ValueError, match=r"^Coverage must be in increments of \$1,000$"):
        calculate_premium(50, "female", 35500, "Level Preferred")
