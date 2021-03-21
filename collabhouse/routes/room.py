import json
import uuid

from quart import current_app as app


rooms = []


class Room:
    def __init__(self, id: str):
        self._sockets = set()
        self.id = id

    async def add_socket(self, socket):
        for connected in self._sockets:
            await socket.send(json.dumps({
                "method": "user_join",
                "params": [connected.user_info["identity"], connected.user_info["name"]]
            }))

        self._sockets.add(socket)
        await self.broadcast({
            "method": "user_join",
            "params": [socket.user_info["identity"], socket.user_info["name"]]
        })

    async def remove_socket(self, socket):
        self._sockets.remove(socket)
        await self.broadcast({
            "method": "user_leave",
            "params": [socket.user_info["identity"], socket.user_info["name"]]
        })

    async def updated(self):
        async with app.db_pool.acquire() as con:
            await con.execute("""
                UPDATE
                    rooms
                SET
                    last_updated=NOW() at time zone 'utc'
                WHERE id=$1;
            """, self.id)

    @classmethod
    async def new(cls, name: str, creator_id: int):
        async with app.db_pool.acquire() as con:
            new_id = await con.fetchval("""
                INSERT INTO
                    rooms (
                        name,
                        creator
                    )
                VALUES
                    ($1, $2)
                RETURNING id;
            """, name, creator_id)

        return cls(new_id)

    async def get_info(self):
        async with app.db_pool.acquire() as con:
            info = await con.fetchrow("""
                SELECT
                    r.name as room_name,
                    u.name as creator_name
                FROM
                    rooms as r
                LEFT JOIN
                    users as u
                ON
                    r.creator = u.id
                WHERE r.id = $1;
            """, self.id)

        return dict(info)

    @staticmethod
    async def exists(id: str):
        try:
            uuid.UUID(id)
        except ValueError:
            # invalid uuid
            return False

        async with app.db_pool.acquire() as con:
            existing = await con.fetchval("""
                SELECT
                    id
                FROM
                    rooms
                WHERE id=$1;
            """, id)

        return bool(existing)

    @classmethod
    async def from_id(cls, id: str):
        try:
            uuid.UUID(id)
        except ValueError:
            # invalid uuid
            return

        async with app.db_pool.acquire() as con:
            existing = await con.fetchval("""
                SELECT
                    id
                FROM
                    rooms
                WHERE id=$1;
            """, id)

        if existing:
            return cls(id)

    async def broadcast(self, payload: dict):
        for socket in self._sockets:
            await socket.send((json.dumps(payload)))

    async def broadcast_except_sender(self, sender, payload: dict):
        for socket in self._sockets:
            if socket == sender:
                continue

            await socket.send((json.dumps(payload)))

    async def get_components(self):
        async with app.db_pool.acquire() as con:
            components = await con.fetch("""
                SELECT
                    CAST(id as TEXT),
                    type,
                    content,
                    content_extra,
                    x_pos,
                    y_pos,
                    width,
                    height
                FROM
                    room_components
                WHERE room_id=$1;
            """, self.id)

        return [dict(c) for c in components]


class RoomComponent:
    def __init__(self, room: Room, id: str):
        self.room = room
        self.id = id

    @classmethod
    async def from_id(cls, room: Room, id: str):
        try:
            uuid.UUID(id)
        except ValueError:
            # invalid uuid
            return

        async with app.db_pool.acquire() as con:
            existing = await con.fetchval("""
                SELECT
                    id
                FROM
                    room_components
                WHERE id=$1;
            """, id)

        if existing:
            return cls(room, id)

    # RoomComponent.new(room_id, data) ----> save data in database and broadcast(new_component)

    @staticmethod
    async def new(room_id, data):
        async with app.db_pool.acquire() as con:
            new_component = await con.fetchrow(
                """
                INSERT INTO
                    room_components (
                        room_id,
                        type,
                        content,
                        content_extra,
                        x_pos,
                        y_pos
                    )
                VALUES
                    ($1, $2, $3, $4, $5, $6)
                RETURNING
                    id::TEXT, width, height;
                """,
                room_id,
                data.get("type"),
                data.get("content"),
                data.get("content_extra"),
                data.get("x_pos"),
                data.get("y_pos")
            )

        data["id"] = new_component["id"]
        data["type"] = data.get("type")
        data["content"] = data.get("content")
        data["content_extra"] = data.get("content_extra")
        data["x_pos"] = data.get("x_pos")
        data["y_pos"] = data.get("y_pos")
        data["width"] = new_component["width"]
        data["height"] = new_component["height"]

        for room in rooms:
            if room.id == room_id:
                await room.updated()
                await room.broadcast({
                    "method": "new_component",
                    "params": [data]
                })
                break

    async def delete(self, sender):
        # delete in database
        async with app.db_pool.acquire() as con:
            await con.execute(
                """
            DELETE FROM
                room_components
            WHERE id=$1
            """, self.id)

        # broadcast deletion
        for room in rooms:
            if room.id == self.room.id:
                await room.updated()
                await room.broadcast_except_sender(sender, {
                    "method": "component_delete",
                    "params": [self.id]
                })
                break

    async def drag(self, sender, x: int, y: int):
        await self.room.broadcast_except_sender(sender, {
            "method": "component_drag",
            "params": [self.id, x, y]
        })

    async def resize(self, sender, width: int, height: int):
        await self.room.broadcast_except_sender(sender, {
            "method": "component_resize",
            "params": [self.id, width, height]
        })

    async def drag_end(self, x: int, y: int):
        async with app.db_pool.acquire() as con:
            await con.execute("""
                UPDATE
                    room_components
                SET
                    x_pos=$1,
                    y_pos=$2
                WHERE id=$3;
            """, x, y, self.id)
        await self.room.updated()

    async def resize_end(self, width: int, height: int):
        async with app.db_pool.acquire() as con:
            await con.execute("""
                UPDATE
                    room_components
                SET
                    width=$1,
                    height=$2
                WHERE id=$3;
            """, width, height, self.id)
        await self.room.updated()
