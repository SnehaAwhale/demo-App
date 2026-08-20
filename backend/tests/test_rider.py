import pytest

from services.premium_calculator import calculate_rider_premium

RIDER_NAME = "Accidental Death Benefit"


# --- Service-level tests: calculate_rider_premium ---------------------------


def test_rider_premium_at_35000(app):
    result = calculate_rider_premium(35000, RIDER_NAME)
    assert result == {"rider_name": RIDER_NAME, "monthly": 17.50, "annual": 210.00}


def test_rider_premium_at_25000(app):
    result = calculate_rider_premium(25000, RIDER_NAME)
    assert result == {"rider_name": RIDER_NAME, "monthly": 12.50, "annual": 150.00}


def test_rider_premium_unknown_rider(app):
    with pytest.raises(ValueError, match="Unknown or inactive rider"):
        calculate_rider_premium(35000, "Not A Real Rider")


# --- Endpoint-level tests: POST /api/quote/rider -----------------------------


def _start_quote(client, coverage_amount=None):
    session_resp = client.post("/api/session/start")
    application_id = session_resp.get_json()["application_id"]

    client.post(
        "/api/quote/start",
        json={
            "application_id": application_id,
            "first_name": "Jane",
            "last_name": "Doe",
            "date_of_birth": "01/01/1960",
            "zip_code": "43215",
            "gender": "female",
            "tobacco_use": False,
        },
    )
    client.post(
        "/api/quote/save",
        json={
            "application_id": application_id,
            "coverage_amount": 35000,
            "selected_rate_class": "Level Preferred",
        },
    )

    if coverage_amount is not None and coverage_amount != 35000:
        client.post(
            "/api/quote/recalculate",
            json={"application_id": application_id, "coverage_amount": coverage_amount},
        )

    return application_id


def test_rider_endpoint_enabled(app):
    client = app.test_client()
    application_id = _start_quote(client)

    resp = client.post(
        "/api/quote/rider",
        json={"application_id": application_id, "rider_name": RIDER_NAME, "enabled": True},
    )
    body = resp.get_json()

    assert resp.status_code == 200
    assert body["rider_name"] == RIDER_NAME
    assert body["rider_monthly"] == 17.50
    assert body["rider_annual"] == 210.00
    assert body["total_monthly"] == round(body["base_premium"] + 17.50, 2)
    assert body["total_annual"] == round(body["base_premium"] * 12 + 210.00, 2)


def test_rider_endpoint_disabled(app):
    client = app.test_client()
    application_id = _start_quote(client)

    resp = client.post(
        "/api/quote/rider",
        json={"application_id": application_id, "rider_name": RIDER_NAME, "enabled": False},
    )
    body = resp.get_json()

    assert resp.status_code == 200
    assert body["rider_monthly"] == 0
    assert body["rider_annual"] == 0
    assert body["total_monthly"] == body["base_premium"]


def test_rider_endpoint_recalculates_after_coverage_change(app):
    client = app.test_client()
    application_id = _start_quote(client, coverage_amount=25000)

    resp = client.post(
        "/api/quote/rider",
        json={"application_id": application_id, "rider_name": RIDER_NAME, "enabled": True},
    )
    body = resp.get_json()

    assert resp.status_code == 200
    assert body["rider_monthly"] == 12.50
    assert body["total_monthly"] == round(body["base_premium"] + 12.50, 2)


def test_rider_endpoint_missing_rate_class(app):
    client = app.test_client()
    session_resp = client.post("/api/session/start")
    application_id = session_resp.get_json()["application_id"]
    client.post(
        "/api/quote/start",
        json={
            "application_id": application_id,
            "first_name": "Jane",
            "last_name": "Doe",
            "date_of_birth": "01/01/1960",
            "zip_code": "43215",
            "gender": "female",
            "tobacco_use": False,
        },
    )

    resp = client.post(
        "/api/quote/rider",
        json={"application_id": application_id, "rider_name": RIDER_NAME, "enabled": True},
    )
    assert resp.status_code == 400


def test_rider_endpoint_unknown_application_id(app):
    client = app.test_client()
    resp = client.post(
        "/api/quote/rider",
        json={"application_id": "does-not-exist", "rider_name": RIDER_NAME, "enabled": True},
    )
    assert resp.status_code == 404
