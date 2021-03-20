import sys

if sys.version_info < (3, 7):
    print("Please update Python to use version 3.7+")
    exit(1)

from .app import app


if __name__ == "__main__":
    app.run(host="0.0.0.0")
