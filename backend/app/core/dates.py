from datetime import date, datetime


def parse_date_of_birth(value):
    """Parses a date of birth string in MM/DD/YYYY format."""
    return datetime.strptime(value, "%m/%d/%Y").date()


def calculate_age(dob, as_of=None):
    as_of = as_of or date.today()
    age = as_of.year - dob.year
    if (as_of.month, as_of.day) < (dob.month, dob.day):
        age -= 1
    return age
