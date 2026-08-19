import pytest

from app import create_app
from app.extensions import db
from app.seeds.seed_data import seed_all


@pytest.fixture()
def app():
    application = create_app("testing")

    with application.app_context():
        db.create_all()
        seed_all()
        yield application
        db.session.remove()
        db.drop_all()
