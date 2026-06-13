import logging
import sys
from os.path import abspath, dirname

import secrets
import os

# Set up python path
sys.path.insert(0, dirname(dirname(dirname(abspath(__file__)))))

from app.db.session import SessionLocal, engine, Base
from app.db.models import User
from app.services.security import get_password_hash

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("db_seeder")

def generate_dev_password(length: int = 16) -> str:
    # Generates a secure URL-safe password
    return secrets.token_urlsafe(length)[:length]

def seed_users() -> None:
    db = SessionLocal()
    try:
        logger.info("Starting database seeding...")
        
        # Load or generate passwords
        admin_pwd = os.getenv("SEED_ADMIN_PASSWORD") or generate_dev_password()
        researcher_pwd = os.getenv("SEED_RESEARCHER_PASSWORD") or generate_dev_password()
        guest_pwd = os.getenv("SEED_GUEST_PASSWORD") or generate_dev_password()
        
        # Print generated credentials for dev visibility
        if not os.getenv("SEED_ADMIN_PASSWORD"):
            logger.info(f"Generated dev admin password: {admin_pwd}")
        if not os.getenv("SEED_RESEARCHER_PASSWORD"):
            logger.info(f"Generated dev researcher password: {researcher_pwd}")
        if not os.getenv("SEED_GUEST_PASSWORD"):
            logger.info(f"Generated dev guest password: {guest_pwd}")
            
        # Define users to seed
        users_to_seed = [
            {
                "username": "admin",
                "email": "admin@diseasegenemap.org",
                "password": admin_pwd,
                "role": "Admin"
            },
            {
                "username": "researcher",
                "email": "researcher@diseasegenemap.org",
                "password": researcher_pwd,
                "role": "Researcher"
            },
            {
                "username": "guest",
                "email": "guest@diseasegenemap.org",
                "password": guest_pwd,
                "role": "Guest"
            }
        ]
        
        for u_data in users_to_seed:
            # Check if user already exists
            existing_user = db.query(User).filter(
                (User.username == u_data["username"]) | (User.email == u_data["email"])
            ).first()
            
            if not existing_user:
                logger.info(f"Seeding user: {u_data['username']} ({u_data['role']})")
                hashed_pwd = get_password_hash(u_data["password"])
                db_user = User(
                    username=u_data["username"],
                    email=u_data["email"],
                    password_hash=hashed_pwd,
                    role=u_data["role"]
                )
                db.add(db_user)
            else:
                logger.info(f"User {u_data['username']} already exists. Skipping.")
                
        db.commit()
        logger.info("Database seeding completed successfully.")
        
    except Exception as e:
        logger.error(f"Error seeding database: {e}")
        db.rollback()
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed_users()
