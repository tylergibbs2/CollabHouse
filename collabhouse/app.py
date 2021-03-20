from quart import abort, Quart, render_template, request
from quart_jwt_extended import create_access_token, JWTManager, jwt_required

from .config import QuartConfig


app = Quart("collabhouse")
app.config.from_object(QuartConfig())
JWTManager(app)


@app.route("/login", methods=["POST"])
async def login():
    try:
        data = await request.get_json()
    except TypeError:
        return abort(400)

    username = data.get("username", None)
    password = data.get("password", None)

    if not username:
        return {"status": 400, "error": "Missing username parameter."}, 400
    if not password:
        return {"status": 400, "error": "Missing password parameter."}, 400



@app.errorhandler(404)
async def not_found(error):
    return await render_template("index.html")
