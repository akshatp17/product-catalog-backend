import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    DATABASE_URL = os.getenv("DATABASE_URL")
    FLASK_ENV    = os.getenv("FLASK_ENV", "development")
    DEBUG        = os.getenv("FLASK_DEBUG", "1") == "1"
    DEFAULT_PAGE_LIMIT = 20
    MAX_PAGE_LIMIT     = 100