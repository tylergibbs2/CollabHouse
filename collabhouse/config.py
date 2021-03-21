from pathlib import Path
import os

from dotenv import load_dotenv


load_dotenv(dotenv_path=Path(".") / ".env")


class QuartConfig:
    PSQL_HOST = os.getenv("PSQL_HOST")
    PSQL_PORT = os.getenv("PSQL_PORT")
    PSQL_USER = os.getenv("PSQL_USER")
    PSQL_PASS = os.getenv("PSQL_PASS")
    PSQL_DB = os.getenv("PSQL_DB")

    JWT_SECRET_KEY = os.getenv("SESSION_SECRET")
    JWT_ACCESS_TOKEN_EXPIRES = False
    JWT_TOKEN_LOCATION = ["cookies", "json"]
    JWT_BLACKLIST_ENABLED = True
    JWT_BLACKLIST_TOKEN_CHECKS = ["access", "refresh"]

    QUART_AUTH_COOKIE_SECURE = False
