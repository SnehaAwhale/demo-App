from flask import request
from flask_restx import Namespace, Resource, fields

from app.core.constants import SessionStatus
from app.core.dates import calculate_age, parse_date_of_birth
from app.extensions import db
from app.models.quote import Quote
from app.models.rate_class import RateClass
from app.models.session import Session
from services.premium_calculator import (
    calculate_premium,
    get_all_quotes,
    get_coverage_options,
    recalculate_for_coverage,
)

ns = Namespace("quote", description="Quotation flow endpoints")

REQUIRED_START_FIELDS = [
    "application_id",
    "first_name",
    "last_name",
    "date_of_birth",
    "zip_code",
    "gender",
    "tobacco_use",
]

DEFAULT_PRODUCT_TYPE = "L"

# --- Swagger models -------------------------------------------------------

error_model = ns.model("Error", {"error": fields.String(description="Error message")})

rate_class_model = ns.model(
    "RateClassPremium",
    {
        "name": fields.String(description="Rate class name"),
        "monthly": fields.Float(description="Monthly premium; null if not eligible"),
        "annual": fields.Float(description="Annual premium; null if not eligible"),
        "eligible": fields.Boolean(description="Whether this rate class applies to the applicant"),
        "reason": fields.String(description="Present only when eligible is false"),
    },
)

applicant_model = ns.model(
    "Applicant",
    {
        "name": fields.String,
        "age": fields.Integer,
        "gender": fields.String,
        "zip_code": fields.String,
        "tobacco_use": fields.Boolean,
    },
)

coverage_range_model = ns.model(
    "CoverageRange",
    {
        "current": fields.Integer,
        "min": fields.Integer,
        "max": fields.Integer,
        "step": fields.Integer,
    },
)

quote_start_input = ns.model(
    "QuoteStartInput",
    {
        "application_id": fields.String(required=True, description="Application ID from POST /session/start"),
        "first_name": fields.String(required=True),
        "last_name": fields.String(required=True),
        "date_of_birth": fields.String(required=True, description="MM/DD/YYYY"),
        "zip_code": fields.String(required=True, description="5-digit ZIP code"),
        "gender": fields.String(required=True, enum=["male", "female"]),
        "tobacco_use": fields.Boolean(required=True),
        "product_type": fields.String(required=False, description="\"L\" or \"S\"; defaults to \"L\""),
    },
)

quote_start_output = ns.model(
    "QuoteStartOutput",
    {
        "application_id": fields.String,
        "applicant": fields.Nested(applicant_model),
        "coverage": fields.Nested(coverage_range_model),
        "rate_classes": fields.List(fields.Nested(rate_class_model)),
    },
)

quote_recalculate_input = ns.model(
    "QuoteRecalculateInput",
    {
        "application_id": fields.String(required=True),
        "coverage_amount": fields.Integer(required=True),
    },
)

quote_recalculate_output = ns.model(
    "QuoteRecalculateOutput",
    {
        "coverage": fields.Integer,
        "rate_classes": fields.List(fields.Nested(rate_class_model)),
    },
)

quote_save_input = ns.model(
    "QuoteSaveInput",
    {
        "application_id": fields.String(required=True),
        "coverage_amount": fields.Integer(required=True),
        "selected_rate_class": fields.String(required=True),
    },
)

quote_save_output = ns.model(
    "QuoteSaveOutput",
    {
        "application_id": fields.String,
        "applicant": fields.String(description="Full name"),
        "selected_rate_class": fields.String,
        "coverage": fields.Integer,
        "monthly_premium": fields.Float,
        "annual_premium": fields.Float,
        "status": fields.String,
    },
)


# --- Helpers ----------------------------------------------------------------


def _error(message, status_code):
    return {"error": message}, status_code


def _serialize_rate_classes(rate_classes):
    serialized = []
    for item in rate_classes:
        entry = {
            "name": item["rate_class"],
            "monthly": item["monthly"] if item["eligible"] else None,
            "annual": item["annual"] if item["eligible"] else None,
            "eligible": item["eligible"],
        }
        if not item["eligible"]:
            entry["reason"] = item["reason"]
        serialized.append(entry)
    return serialized


# --- Endpoints ----------------------------------------------------------------


@ns.route("/start")
class QuoteStart(Resource):
    @ns.expect(quote_start_input, validate=False)
    @ns.response(200, "Success", quote_start_output)
    @ns.response(400, "Missing fields, invalid age, or invalid date format", error_model)
    @ns.response(404, "application_id not found", error_model)
    @ns.response(410, "Session expired", error_model)
    def post(self):
        """Start a quote: capture applicant details and return initial rate class premiums"""
        data = request.get_json(silent=True) or {}

        missing = [
            field for field in REQUIRED_START_FIELDS if field not in data or data[field] in (None, "")
        ]
        if missing:
            return _error(f"Missing required field(s): {', '.join(missing)}", 400)

        application_id = data["application_id"]
        session = db.session.get(Session, application_id)
        if session is None:
            return _error("Application ID not found", 404)
        if session.status != SessionStatus.IN_PROGRESS:
            return _error("Session has expired or is no longer active", 410)

        try:
            dob = parse_date_of_birth(data["date_of_birth"])
        except (ValueError, TypeError):
            return _error("Invalid date format for date_of_birth, expected MM/DD/YYYY", 400)

        age = calculate_age(dob)
        if age < 50 or age > 85:
            return _error("Applicant must be between 50 and 85 years old", 400)

        zip_code = str(data["zip_code"]).strip()
        if not zip_code.isdigit() or len(zip_code) != 5:
            return _error("zip_code must be a 5-digit ZIP code", 400)

        product_type = data.get("product_type", DEFAULT_PRODUCT_TYPE)
        gender = str(data["gender"]).strip().lower()
        tobacco_use = bool(data["tobacco_use"])

        try:
            coverage_option = get_coverage_options(product_type)
            rate_classes = get_all_quotes(age, gender, coverage_option["default"], tobacco_use, product_type)
        except ValueError as exc:
            return _error(str(exc), 400)

        quote = Quote.query.filter_by(application_id=application_id).first()
        if quote is None:
            quote = Quote(application_id=application_id)
            db.session.add(quote)

        quote.first_name = data["first_name"]
        quote.last_name = data["last_name"]
        quote.date_of_birth = dob.isoformat()
        quote.age = age
        quote.gender = gender
        quote.zip_code = zip_code
        quote.tobacco_use = tobacco_use
        quote.coverage_amount = coverage_option["default"]
        quote.product_type = product_type
        quote.selected_rate_class = None
        quote.monthly_premium = None
        quote.annual_premium = None
        db.session.commit()

        return {
            "application_id": application_id,
            "applicant": {
                "name": f"{data['first_name']} {data['last_name']}",
                "age": age,
                "gender": gender,
                "zip_code": zip_code,
                "tobacco_use": tobacco_use,
            },
            "coverage": {
                "current": coverage_option["default"],
                "min": coverage_option["min"],
                "max": coverage_option["max"],
                "step": coverage_option["step"],
            },
            "rate_classes": _serialize_rate_classes(rate_classes),
        }, 200


@ns.route("/recalculate")
class QuoteRecalculate(Resource):
    @ns.expect(quote_recalculate_input, validate=False)
    @ns.response(200, "Success", quote_recalculate_output)
    @ns.response(400, "Missing or invalid coverage_amount", error_model)
    @ns.response(404, "No quote found for this application_id", error_model)
    def post(self):
        """Recalculate all rate class premiums for a new coverage amount"""
        data = request.get_json(silent=True) or {}

        application_id = data.get("application_id")
        if not application_id:
            return _error("Missing required field: application_id", 400)

        coverage_amount = data.get("coverage_amount")
        if coverage_amount is None:
            return _error("Missing required field: coverage_amount", 400)
        if not isinstance(coverage_amount, int) or isinstance(coverage_amount, bool):
            return _error("coverage_amount must be an integer", 400)

        quote = Quote.query.filter_by(application_id=application_id).first()
        if quote is None:
            return _error("No quote found for this application_id", 404)

        try:
            rate_classes = recalculate_for_coverage(
                quote.age, quote.gender, coverage_amount, quote.tobacco_use, quote.product_type
            )
        except ValueError as exc:
            return _error(str(exc), 400)

        quote.coverage_amount = coverage_amount
        db.session.commit()

        return {
            "coverage": coverage_amount,
            "rate_classes": _serialize_rate_classes(rate_classes),
        }, 200


@ns.route("/save")
class QuoteSave(Resource):
    @ns.expect(quote_save_input, validate=False)
    @ns.response(200, "Success", quote_save_output)
    @ns.response(400, "Missing or invalid fields", error_model)
    @ns.response(404, "No quote found for this application_id", error_model)
    def post(self):
        """Save the applicant's selected rate class and finalize the quote"""
        data = request.get_json(silent=True) or {}

        application_id = data.get("application_id")
        if not application_id:
            return _error("Missing required field: application_id", 400)

        coverage_amount = data.get("coverage_amount")
        if coverage_amount is None:
            return _error("Missing required field: coverage_amount", 400)
        if not isinstance(coverage_amount, int) or isinstance(coverage_amount, bool):
            return _error("coverage_amount must be an integer", 400)

        selected_rate_class = data.get("selected_rate_class")
        if not selected_rate_class:
            return _error("Missing required field: selected_rate_class", 400)

        quote = Quote.query.filter_by(application_id=application_id).first()
        if quote is None:
            return _error("No quote found for this application_id", 404)

        rate_class = RateClass.query.filter_by(name=selected_rate_class).first()
        if rate_class is None:
            return _error(f"Unknown rate class '{selected_rate_class}'", 400)
        if quote.tobacco_use and not rate_class.requires_tobacco:
            return _error(
                f"Selected rate class '{selected_rate_class}' is not eligible: "
                "non-tobacco rate class - not applicable",
                400,
            )
        if not quote.tobacco_use and rate_class.requires_tobacco:
            return _error(
                f"Selected rate class '{selected_rate_class}' is not eligible: "
                "tobacco rate class - not applicable",
                400,
            )

        try:
            premium = calculate_premium(
                quote.age, quote.gender, coverage_amount, selected_rate_class, quote.product_type
            )
        except ValueError as exc:
            return _error(str(exc), 400)

        quote.coverage_amount = coverage_amount
        quote.selected_rate_class = selected_rate_class
        quote.monthly_premium = premium["monthly_premium"]
        quote.annual_premium = premium["annual_premium"]
        db.session.commit()

        return {
            "application_id": application_id,
            "applicant": f"{quote.first_name} {quote.last_name}",
            "selected_rate_class": selected_rate_class,
            "coverage": coverage_amount,
            "monthly_premium": premium["monthly_premium"],
            "annual_premium": premium["annual_premium"],
            "status": "quote_saved",
        }, 200
