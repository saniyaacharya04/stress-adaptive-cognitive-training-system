from backend.database.base import SessionLocal
from backend.database.models import AdminUser
from werkzeug.security import generate_password_hash
db = SessionLocal()
if not db.query(AdminUser).filter_by(username="admin").first():
    db.add(AdminUser(username="admin", password_hash=generate_password_hash("admin123")))
    db.commit()
    print("Admin created")
else:
    print("Admin already exists")
db.close()
