from pathlib import Path
import os

from dotenv import load_dotenv


load_dotenv(dotenv_path=Path(".") / ".env")


class QuartConfig:
    JWT_SECRET_KEY = os.getenv("SESSION_SECRET")
    TOKEN_KEY = str.encode(os.getenv("TOKEN_KEY"))
    QUART_AUTH_COOKIE_SECURE = False
