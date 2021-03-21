from datetime import datetime, timedelta
import json

from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError
from quart import current_app as app
from quart import request, Blueprint, Response
import quart_jwt_extended as jwt


hasher = PasswordHasher()


auth_blueprint = Blueprint("auth", __name__)


@auth_blueprint.after_app_request
async def refresh_expiring_jwts(response):
    if str(request.url_rule) == "/api/logout":
        return response

    try:
        exp_timestamp = jwt.get_raw_jwt()["exp"]
        now = datetime.utcnow()
        target_timestamp = datetime.timestamp(now + timedelta(minutes=30))
        if target_timestamp > exp_timestamp:
            access_token = jwt.create_access_token(identity=jwt.get_jwt_identity())
            response.set_cookie("access_token_cookie", access_token)
            response.set_cookie("jwt_csrf_token", jwt.get_csrf_token(access_token))
        return response
    except (RuntimeError, KeyError):
        return response


@auth_blueprint.route("/api/logout", methods=["DELETE"])
@jwt.jwt_required
async def logout():
    jti = jwt.get_raw_jwt().get("jti")
    async with app.db_pool.acquire() as con:
        await con.execute("""
            INSERT INTO
                old_tokens (
                    token
                )
            VALUES
                ($1);
        """, jti)

    app.blacklisted_tokens.add(jti)

    headers = {
        "Content-Type": "application/json"
    }

    response = Response(json.dumps({"status": 200, "result": True}), headers=headers)

    response.set_cookie("access_token_cookie", "", expires=0)
    response.set_cookie("jwt_csrf_token", "", expires=0)

    return response


@auth_blueprint.route("/api/login", methods=["POST"])
async def login():
    try:
        data = await request.get_json()
    except Exception:
        return {"status": 400, "error": "Invalid POST data."}, 400

    email = data.get("email")
    password = data.get("password")

    if not email:
        return {"status": 400, "error": "Missing email parameter."}, 400
    if not password:
        return {"status": 400, "error": "Missing password parameter."}, 400

    async with app.db_pool.acquire() as con:
        user = await con.fetchrow("""
                SELECT
                    name,
                    password_hash
                FROM
                    users
                WHERE LOWER($1) = LOWER(email);
            """, email)

    if user["password_hash"] is None:
        return {"status": 401, "error": "Invalid credentials."}, 401

    try:
        hasher.verify(user["password_hash"], password)
    except VerifyMismatchError:
        return {"status": 401, "error": "Invalid credentials."}, 401

    if hasher.check_needs_rehash(user["password_hash"]):
        async with app.db_pool.acquire() as con:
            await con.execute("""
                UPDATE
                    users
                SET
                    password_hash=$1
                WHERE LOWER($2) = LOWER(email);
            """, hasher.hash(password), email)

    additional = {
        "name": user["name"]
    }
    access_token = jwt.create_access_token(identity=email.lower(), user_claims=additional)

    headers = {
        "Content-Type": "application/json"
    }

    async with app.db_pool.acquire() as con:
        user = await con.fetchrow("""
                SELECT
                    id,
                    name,
                    email
                FROM
                    users
                WHERE LOWER($1) = LOWER(email);
            """, email)

    response = Response(json.dumps({"status": 200, "result": dict(user)}), headers=headers)

    response.set_cookie("access_token_cookie", access_token)
    response.set_cookie("jwt_csrf_token", jwt.get_csrf_token(access_token))

    return response


@auth_blueprint.route("/api/register", methods=["POST"])
async def register():
    existing_jwt = jwt.get_jwt_identity()
    if existing_jwt:
        return {"status": 401, "error": "You cannot register for a new account if you are logged in."}, 401

    try:
        data = await request.get_json()
    except Exception:
        return {"status": 400, "error": "Invalid POST data."}, 400

    email = data.get("email")
    password = data.get("password")
    name = data.get("name")

    if not email:
        return {"status": 400, "error": "Missing email parameter."}, 400
    elif not password:
        return {"status": 400, "error": "Missing password parameter."}, 400
    elif not name:
        return {"status": 400, "error": "Missing name parameter."}, 400

    hash_ = hasher.hash(password)

    async with app.db_pool.acquire() as con:
        existing = await con.fetchval("""
            SELECT
                email
            FROM
                users
            WHERE LOWER($1) = LOWER(email);
        """, email)

        if existing:
            return {"status": 400, "error": "User with specified email already exists."}, 400

        new_user = await con.fetchrow("""
            INSERT INTO
                users (
                    email,
                    password_hash,
                    name
                )
            VALUES
                ($1, $2, $3)
            RETURNING id::TEXT, email, name;
        """, email, hash_, name)

    additional = {
        "name": name
    }
    access_token = jwt.create_access_token(identity=email.lower(), user_claims=additional)

    headers = {
        "Content-Type": "application/json"
    }

    response = Response(json.dumps({"status": 200, "result": dict(new_user)}), headers=headers)

    response.set_cookie("access_token_cookie", access_token)
    response.set_cookie("jwt_csrf_token", jwt.get_csrf_token(access_token))

    return response
