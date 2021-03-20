import asyncio
import inspect
import json
from json.decoder import JSONDecodeError

from quart import Blueprint, websocket
import quart_jwt_extended as jwt


socket_blueprint = Blueprint("socket", __name__)


rooms = []


class SocketMethods:
    """
    usage:

    ws://localhost:5000/api/ws
    {
        "method": "test",       # REQUIRED
        "params": ["blah"]      # OPTIONAL, MUST BE A LIST IF EXISTS
    }
    """
    requires_auth = ["test"]

    @staticmethod
    async def method_join_room(socket, id: str):
        pass


async def generate_response(socket, data):
    try:
        data = json.loads(data)
    except JSONDecodeError:
        return {"status": 400, "error": "Invalid JSON data."}

    if not isinstance(data, dict):
        return {"status": 400, "error": "Invalid JSON object."}

    method = data.get("method")
    if not method:
        return {"status": 400, "error": "Request is missing required 'method' key."}

    token = data.get("access_token")
    try:
        user = jwt.decode_token(token)
    except Exception:
        user = None
    if user is None and method in SocketMethods.requires_auth:
        return {"status": 401, "error": "Method requires authentication."}

    func = getattr(SocketMethods, f"method_{method}", None)
    if func is None:
        return {"status": 400, "error": f"Method '{method}' does not exist."}

    parameters = data.get("params", [])
    if not isinstance(parameters, list):
        return {"status": 400, "error": "Key 'params' must be a list."}

    all_argc = func.__code__.co_argcount
    all_argc -= 1 if method in SocketMethods.requires_auth else 0

    if len(parameters) != all_argc:
        return {"status": 400, "error": "Parameters has mismatching number of arguments."}

    if method in SocketMethods.requires_auth:
        args = user["identity"], *parameters

    if inspect.iscoroutinefunction(func):
        ret = await func(*args)
    else:
        ret = func(*args)

    return {
        "status": 200,
        "result": ret
    }


@socket_blueprint.websocket("/api/ws")
async def ws():
    local_socket = websocket._get_current_object()
    try:
        while True:
            data = await websocket.receive()
            resp = await generate_response(local_socket, data)
            if resp:
                await websocket.send(json.dumps(resp))
    except asyncio.CancelledError:
        raise
