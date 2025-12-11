# backend/core/exceptions/handlers.py

from flask import jsonify
import logging

def register_error_handlers(app):

    @app.errorhandler(404)
    def not_found(e):
        return jsonify({"ok": False, "error": "not found"}), 404

    @app.errorhandler(500)
    def server_error(e):
        logging.exception("Unhandled error: %s", e)
        return jsonify({"ok": False, "error": "internal server error"}), 500
