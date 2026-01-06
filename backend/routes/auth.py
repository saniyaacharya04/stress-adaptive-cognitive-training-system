from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from backend.database.base import SessionLocal
from backend.database.user import User
import jwt
from datetime import datetime, timedelta
import os

bp = Blueprint("auth", __name__, url_prefix="/api/auth")

JWT_SECRET = os.getenv("JWT_SECRET", "dev_secret")

def create_token(user):
    payload = {
        "sub": user.id,
        "role": user.role,
        "exp": datetime.utcnow() + timedelta(hours=12)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")

@bp.route("/signup", methods=["POST"])
def signup():
    data = request.get_json() or {}
    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return jsonify({"ok": False, "error": "missing fields"}), 400

    db = SessionLocal()
    if db.query(User).filter_by(email=email).first():
        return jsonify({"ok": False, "error": "user exists"}), 400

    user = User(
        email=email,
        password_hash=generate_password_hash(password),
        role="user"
    )
    db.add(user)
    db.commit()
    return jsonify({"ok": True})

@bp.route("/login", methods=["POST"])
def login():
    data = request.get_json() or {}
    email = data.get("email")
    password = data.get("password")

    db = SessionLocal()
    user = db.query(User).filter_by(email=email).first()

    if not user or not check_password_hash(user.password_hash, password):
        return jsonify({"ok": False, "error": "invalid credentials"}), 401

    return jsonify({"ok": True, "token": create_token(user)})
