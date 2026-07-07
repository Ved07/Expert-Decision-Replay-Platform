from database import SessionLocal
from models import User

db = SessionLocal()

# Update these three lines for each user you want to promote, then re-run the script
email = "admin@example.com"
new_role = "Administrator"   # Employee / Reviewer / Manager / Administrator

user = db.query(User).filter(User.email == email).first()

if user:
    user.role = new_role
    db.commit()
    print(f"✅ {user.name} ({user.email}) is now a {new_role}")
else:
    print(f"❌ No user found with email {email}")

db.close()