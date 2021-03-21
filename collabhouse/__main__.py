import sys

if sys.version_info < (3, 7):
    print("Please update Python to use version 3.7+")
    exit(1)

import argparse
import os
from pathlib import Path

from dotenv import load_dotenv

from .app import app
from .bots.discord import bot


load_dotenv(dotenv_path=Path(".") / ".env")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="CollabHouse Commandline")
    parser.add_argument("--discord", action="store_true", help="Starts the Discord bot.")
    args = parser.parse_args()

    if args.discord:
        token = os.getenv("DISCORD_BOT_TOKEN")
        bot.run(token)
    else:
        app.run(host="0.0.0.0")
