import os
import time
from flask import Flask
from sqlalchemy.exc import OperationalError
from .config import Config
from .extensions import db, migrate, jwt, cors
from .routes.auth import auth_bp
from .routes.works import works_bp
from .routes.health import health_bp
from .routes.threed import threed_bp


def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    cors.init_app(app, resources={r"/api/*": {"origins": app.config.get("CLIENT_ORIGIN", "*")}}, supports_credentials=True)

    from .services.tokens import is_access_blocked

    @jwt.token_in_blocklist_loader
    def check_if_token_revoked(jwt_header, jwt_payload):
        jti = jwt_payload.get("jti")
        try:
            return is_access_blocked(jti)
        except Exception:
            app.logger.exception("Failed to check access token blocklist (jti=%s)", jti)
            return False

    app.register_blueprint(health_bp, url_prefix="/api")
    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(works_bp, url_prefix="/api/works")
    app.register_blueprint(threed_bp, url_prefix="/api/3d")

    with app.app_context():
        from . import models  # noqa: F401

        # Wait for database to be ready (e.g. when starting via docker-compose)
        last_err = None
        for attempt in range(30):
            try:
                db.create_all()
                last_err = None
                break
            except OperationalError as e:
                last_err = e
                app.logger.warning("Database not ready, retrying (%s/30)...", attempt + 1)
                time.sleep(2)
        if last_err is not None:
            raise last_err

        try:
            from .services.storage import ensure_bucket
            ensure_bucket()
        except Exception:
            # storage may not be ready at startup in dev
            app.logger.exception("Failed to ensure S3 bucket at startup")

    return app
