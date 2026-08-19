from app import create_app
from app.seeds.seed_data import seed_all

app = create_app()

with app.app_context():
    seed_all()
    print("Seed data applied.")
