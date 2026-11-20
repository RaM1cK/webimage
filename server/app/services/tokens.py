from flask_jwt_extended import get_jwt
from ..extensions import get_redis

REFRESH_PREFIX = "refresh:"
BLOCKLIST_PREFIX = "block:"


def store_refresh(jti, user_id, expires_seconds):
    r = get_redis()
    r.setex(f"{REFRESH_PREFIX}{jti}", expires_seconds, str(user_id))


def is_refresh_valid(jti):
    r = get_redis()
    return r.get(f"{REFRESH_PREFIX}{jti}") is not None


def revoke_refresh(jti):
    r = get_redis()
    r.delete(f"{REFRESH_PREFIX}{jti}")


def revoke_all_user_refresh(user_id):
    # simple implementation: not tracking list; could be improved
    pass


def block_access(jti, expires_seconds):
    r = get_redis()
    r.setex(f"{BLOCKLIST_PREFIX}{jti}", expires_seconds, "1")


def is_access_blocked(jti):
    r = get_redis()
    return r.get(f"{BLOCKLIST_PREFIX}{jti}") is not None
