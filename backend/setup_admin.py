# backend/setup_admin.py
from database.base import SessionLocal
from database.models import AdminUser
from werkzeug.security import generate_password_hash

def setup_admin(username="admin", password="admin123"):
    db = SessionLocal()
    try:
        existing = db.query(AdminUser).filter(AdminUser.username == username).first()
        if existing:
            print("Admin exists; skipping.")
            return
        admin = AdminUser(username=username, password_hash=generate_password_hash(password))
        db.add(admin)
        db.commit()
        print(f"Created admin user: {username}")
    finally:
        db.close()

if __name__ == "__main__":
    setup_admin()
