import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    APP_NAME = "Social Media Analytics API"
    VERSION = "1.0"

    # SQLite DB

    BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

    DATABASE_URL = f"sqlite:///{os.path.join(BASE_DIR, 'database', 'db.sqlite3')}"

    # Secret Key
    SECRET_KEY = os.getenv("SECRET_KEY", "supersecret")

    # Apify
    APIFY_TOKEN = os.getenv("APIFY_TOKEN")

settings = Settings()