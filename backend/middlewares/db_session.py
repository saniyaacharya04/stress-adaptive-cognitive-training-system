# backend/middlewares/logging_middleware.py

from flask import request

def register_request_logging(app):
    @app.before_request
    def log_request():
        try:
            # lightweight log to stdout for dev; file logging handled in app.py
            print(f"[REQ] {request.method} {request.path}")
        except Exception:
            # be defensive: don't break requests on logging failure
            pass
