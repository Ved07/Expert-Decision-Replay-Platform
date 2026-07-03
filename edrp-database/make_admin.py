from database import SessionLocal
from models import User

db = SessionLocal()

# change this to your actual email
user = db.query(User).filter(User.email == "ved@example.com").first()

if user:
    user.role = "Administrator"
    db.commit()
    print(f"✅ {user.name} is now an Administrator")
else:
    print("❌ No user found with that email")

db.close()