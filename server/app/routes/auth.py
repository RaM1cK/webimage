from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import (
    create_access_token,
    create_refresh_token,
    jwt_required,
    get_jwt_identity,
    get_jwt,
    set_access_cookies,
    set_refresh_cookies,
    unset_jwt_cookies,
    decode_token,
)
from ..extensions import db
from ..models import User
from ..services.tokens import store_refresh, is_refresh_valid, revoke_refresh, block_access

auth_bp = Blueprint("auth", __name__)


def _token_expires_seconds(td):
    return int(td.total_seconds()) if td else 3600


@auth_bp.post("/register")
def register():
    data = request.get_json() or {}
    username = (data.get("username") or "").strip()
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    if not username or not email or not password:
        return jsonify({"error": "username, email and password are required"}), 400
    if User.query.filter((User.username == username) | (User.email == email)).first():
        return jsonify({"error": "User with this username or email already exists"}), 409

    user = User(username=username, email=email)
    user.set_password(password)
    db.session.add(user)
    db.session.commit()

    return jsonify({"user": user.to_dict()}), 201


@auth_bp.post("/login")
def login():
    data = request.get_json() or {}
    login_value = (data.get("username") or data.get("email") or "").strip().lower()
    password = data.get("password") or ""
    if not login_value or not password:
        return jsonify({"error": "username/email and password are required"}), 400

    user = User.query.filter((User.username == login_value) | (User.email == login_value)).first()
    if not user or not user.check_password(password):
        return jsonify({"error": "Invalid credentials"}), 401

    identity = str(user.id)
    access_token = create_access_token(identity=identity, additional_claims={"username": user.username})
    refresh_token = create_refresh_token(identity=identity)

    decoded = decode_token(refresh_token)
    jti = decoded.get("jti")
    refresh_exp = _token_expires_seconds(current_app.config.get("JWT_REFRESH_TOKEN_EXPIRES"))
    try:
        if jti:
            store_refresh(jti, user.id, refresh_exp)
    except Exception:
        current_app.logger.exception("Failed to store refresh token in Redis for user_id=%s", user.id)

    resp = jsonify({"user": user.to_dict()})
    set_access_cookies(resp, access_token)
    set_refresh_cookies(resp, refresh_token)
    return resp


@auth_bp.post("/refresh")
@jwt_required(refresh=True)
def refresh():
    identity = get_jwt_identity()
    jwt_data = get_jwt()
    jti = jwt_data.get("jti")
    try:
        if jti and not is_refresh_valid(jti):
            resp = jsonify({"error": "Refresh token revoked"})
            unset_jwt_cookies(resp)
            return resp, 401
    except Exception:
        current_app.logger.exception("Failed to validate refresh token (jti=%s)", jti)

    user = User.query.get(int(identity))
    if not user:
        resp = jsonify({"error": "User not found"})
        unset_jwt_cookies(resp)
        return resp, 404

    access_token = create_access_token(identity=identity, additional_claims={"username": user.username})
    resp = jsonify({"user": user.to_dict()})
    set_access_cookies(resp, access_token)
    return resp


@auth_bp.post("/logout")
@jwt_required()
def logout():
    jwt_data = get_jwt()
    jti = jwt_data.get("jti")
    exp = jwt_data.get("exp")
    import time
    ttl = max(int(exp - time.time()), 1) if exp else 3600
    try:
        if jti:
            block_access(jti, ttl)
    except Exception:
        current_app.logger.exception("Failed to block access token on logout (jti=%s)", jti)

    # try to revoke refresh token from cookie
    refresh_token = request.cookies.get(current_app.config.get("JWT_REFRESH_COOKIE_NAME", "refresh_token_cookie"))
    if refresh_token:
        try:
            d = decode_token(refresh_token)
            if d.get("jti"):
                revoke_refresh(d.get("jti"))
        except Exception:
            current_app.logger.exception("Failed to revoke refresh token on logout")

    resp = jsonify({"status": "logged_out"})
    unset_jwt_cookies(resp)
    return resp


@auth_bp.get("/me")
@jwt_required()
def me():
    identity = get_jwt_identity()
    user = User.query.get(int(identity))
    if not user:
        return jsonify({"error": "User not found"}), 404
    return jsonify({"user": user.to_dict()})


@auth_bp.patch("/settings")
@jwt_required()
def update_settings():
    identity = get_jwt_identity()
    user = User.query.get(int(identity))
    if not user:
        return jsonify({"error": "User not found"}), 404
    data = request.get_json() or {}
    if "autoSaveEnabled" in data:
        user.auto_save_enabled = bool(data["autoSaveEnabled"])
    if "autoSaveInterval" in data:
        try:
            interval = int(data["autoSaveInterval"])
            if interval < 5:
                interval = 5
            if interval > 3600:
                interval = 3600
            user.auto_save_interval = interval
        except Exception:
            current_app.logger.exception("Invalid autoSaveInterval value: %r", data.get("autoSaveInterval"))
    db.session.commit()
    return jsonify({"user": user.to_dict()})
