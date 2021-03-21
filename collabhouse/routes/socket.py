import asyncio
from http.cookies import SimpleCookie
import inspect
import json
from json.decoder import JSONDecodeError
import uuid

import arrow
from quart import current_app as app, static
from quart import Blueprint, websocket, request
from quart_jwt_extended import decode_token, jwt_required, get_jwt_identity

from .room import Room, RoomComponent, rooms


socket_blueprint = Blueprint("socket", __name__)


class SocketMethods:
    """
    usage:

    ws://localhost:5000/api/ws
    {
        "method": "room_component_drag",       # REQUIRED
        "params": [100, 500]      # OPTIONAL, MUST BE A LIST IF EXISTS
    }
    """
    @staticmethod
    async def component_add(socket, room: Room, type: str, content: str):
        await RoomComponent.new(room.id, {
            "type": type,
            "content": content,
            "content_extra": None,
            "x_pos": 50,
            "y_pos": 50
        })

    @staticmethod
    async def component_delete(socket, room: Room, component_id):
        component = await RoomComponent.from_id(room, component_id)
        if not component:
            return

        await component.delete(socket)

    @staticmethod
    async def component_drag(socket, room: Room, component_id: str, x: int, y: int):
        component = await RoomComponent.from_id(room, component_id)
        if not component:
            return

        await component.drag(socket, x, y)

    @staticmethod
    async def component_resize(socket, room: Room, component_id: str, width: int, height: int):
        component = await RoomComponent.from_id(room, component_id)
        if not component:
            return

        await component.resize(socket, width, height)

    @staticmethod
    async def component_drag_end(socket, room: Room, component_id: str, x: int, y: int):
        component = await RoomComponent.from_id(room, component_id)
        if not component:
            return

        await component.drag_end(x, y)

    @staticmethod
    async def component_resize_end(socket, room: Room, component_id: str, width: int, height: int):
        component = await RoomComponent.from_id(room, component_id)
        if not component:
            return

        await component.resize_end(width, height)

    @staticmethod
    async def mouse_move(socket, room: Room, token, x: int, y: int):
        identity = None

        if isinstance(token, dict):
            identity = token["identity"]
            name = token["name"]
        else:
            try:
                decoded = decode_token(str.encode(token))
            except Exception as e:
                name = "Guest"
                identity = "guest"
            else:
                name = decoded["user_claims"]["name"]
                identity = decoded["identity"]

        await room.broadcast_except_sender(socket, {
            "method": "mouse_move",
            "params": [identity, name, x, y]
        })


async def generate_response(socket, room, data):
    try:
        data = json.loads(data)
    except JSONDecodeError:
        return {"status": 400, "error": "Invalid JSON data."}

    if not isinstance(data, dict):
        return {"status": 400, "error": "Invalid JSON object."}

    method = data.get("method")
    if not method:
        return {"status": 400, "error": "Request is missing required 'method' key."}

    func = getattr(SocketMethods, method, None)
    if func is None:
        return {"status": 400, "error": f"Method '{method}' does not exist."}

    parameters = data.get("params", [])
    if not isinstance(parameters, list):
        return {"status": 400, "error": "Key 'params' must be a list."}

    all_argc = func.__code__.co_argcount - 2

    if len(parameters) != all_argc:
        return {"status": 400, "error": "Parameters has mismatching number of arguments."}

    if inspect.iscoroutinefunction(func):
        ret = await func(socket, room, *parameters)
    else:
        ret = func(socket, room, *parameters)

    return {
        "status": 200,
        "result": ret
    }


@socket_blueprint.route("/api/rooms", methods=["GET"])
@jwt_required
async def rooms_route():
    identity = get_jwt_identity()

    async with app.db_pool.acquire() as con:
        projects = await con.fetch("""
            SELECT
                r.id,
                r.name,
                u.name as creator,
                r.last_updated
            FROM
                rooms as r
            LEFT JOIN
                users as u
            ON
                r.creator = u.id
            WHERE LOWER(u.email) = $1;
        """, identity)

    room_dicts = [dict(r) for r in projects]
    for room_dict in room_dicts:
        arrow_dt = arrow.get(room_dict["last_updated"])
        room_dict["last_updated"] = arrow_dt.humanize()

    return {"status": 200, "result": room_dicts}


@socket_blueprint.route("/api/user", methods=["GET"])
@jwt_required
async def get_user():
    identity = get_jwt_identity()

    async with app.db_pool.acquire() as con:
        user = await con.fetchrow("""
            SELECT
                id,
                email,
                name
            FROM
                users
            WHERE LOWER(email) = $1;
        """, identity)

    return {"status": 200, "result": dict(user)}


@socket_blueprint.route("/room/create", methods=["POST"])
@jwt_required
async def create_room():
    identity = get_jwt_identity()

    async with app.db_pool.acquire() as con:
        user_id = await con.fetchval("""
            SELECT
                id
            FROM
                users
            WHERE LOWER(email) = $1;
        """, identity)

    room = await Room.new("Untitled room", user_id)

    return {"result": room.id}


@socket_blueprint.route("/room/<string:room_id>/update", methods=["POST"])
async def update_room(room_id: str):
    room = None
    for existing in rooms:
        if existing.id == room_id:
            room = existing
            break
    else:
        room = await Room.from_id(room_id)
        if room is None:
            return {"status": 404, "error": "Invalid room ID."}, 404
        rooms.append(room)

    try:
        data = await request.get_json()
    except Exception:
        return {"status": 400, "error": "Invalid POST data."}, 400

    name = data.get("name")

    async with app.db_pool.acquire() as con:
        await con.execute("""
            UPDATE
                rooms
            SET
                name=$1
            WHERE id=$2;
        """, name, room_id)

    await room.broadcast({
        "method": "name_update",
        "params": [name]
    })

    return {}


@socket_blueprint.websocket("/room/<string:room_id>/ws")
async def ws(room_id: str):
    room = None
    for existing in rooms:
        if existing.id == room_id:
            room = existing
            break
    else:
        room = await Room.from_id(room_id)
        if room is None:
            return {"status": 404, "error": "Invalid room ID."}, 404
        rooms.append(room)

    local_socket = websocket._get_current_object()

    cookie_string = local_socket.headers.get("Cookie", "")
    cookie = SimpleCookie()
    cookie.load(cookie_string)

    cookies = {}
    for key, morsel in cookie.items():
        cookies[key] = morsel.value

    user_info = None
    try:
        decoded = decode_token(cookies["access_token_cookie"])
    except Exception:
        user_info = {
            "identity": str(uuid.uuid4()),
            "name": "Guest"
        }
    else:
        name = decoded["user_claims"]["name"]
        identity = decoded["identity"]
        user_info = {
            "identity": identity,
            "name": name
        }

    local_socket.user_info = user_info
    await room.add_socket(local_socket)

    await local_socket.send(json.dumps({
        "components": await room.get_components(),
        "info": await room.get_info(),
        "user_info": user_info
    }))

    try:
        while True:
            data = await local_socket.receive()
            resp = await generate_response(local_socket, room, data)
            if resp and resp.get("result"):
                await local_socket.send(json.dumps(resp))
    except asyncio.CancelledError:
        # Client disconnected
        await room.remove_socket(local_socket)
        raise
