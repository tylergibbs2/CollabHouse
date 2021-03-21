import asyncio

import asyncpg
from quart import Quart, render_template
import quart_jwt_extended as jwt

from .config import QuartConfig
from .routes import blueprints


app = Quart("collabhouse")
app.config.from_object(QuartConfig())
jwt_manager = jwt.JWTManager(app)


for blueprint in blueprints:
    app.register_blueprint(blueprint)


@jwt_manager.token_in_blacklist_loader
def check_if_blacklisted(jwt_payload):
    jti = jwt_payload["jti"]

    return jti in app.blacklisted_tokens


@app.before_serving
async def setup_db():
    loop = asyncio.get_event_loop()

    app.db_pool = await asyncpg.create_pool(
        host=app.config["PSQL_HOST"],
        port=app.config["PSQL_PORT"],
        user=app.config["PSQL_USER"],
        password=app.config["PSQL_PASS"],
        database=app.config["PSQL_DB"],
        loop=loop
    )

    async with app.db_pool.acquire() as con:
        tokens = await con.fetch("""
            SELECT
                token
            FROM
                old_tokens;
        """)

    app.blacklisted_tokens = set(t["token"] for t in tokens)


@app.errorhandler(404)
async def not_found(error):
    return await render_template("index.html")
