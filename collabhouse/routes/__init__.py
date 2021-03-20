from quart import blueprints
from .auth import auth_blueprint
from .socket import socket_blueprint

blueprints = [auth_blueprint, socket_blueprint]
