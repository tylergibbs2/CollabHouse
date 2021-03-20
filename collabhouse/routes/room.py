import json

from quart import current_app as app


class Room:
    def __init__(self, id: str):
        self._sockets = set()
        self.id = id

    def add_socket(self, socket):
        self._sockets.add(socket)

    def remove_socket(self, socket):
        self._sockets.remove(socket)

    @classmethod
    async def new(cls, name: str):
        async with app.db_pool.acquire() as con:
            new_id = await con.fetchval("""
                INSERT INTO
                    rooms (
                        name
                    )
                VALUES
                    ($1)
                RETURNING id;
            """, name)

        return cls(new_id)

    @classmethod
    async def existing(cls, id: str):
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
