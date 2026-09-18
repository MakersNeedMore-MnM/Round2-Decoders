from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.auth.jwt import create_access_token
from app.auth.password import hash_password, verify_password
from app.models.user import User
from app.schemas.user import UserCreate, UserLogin
from google.oauth2 import id_token
from google.auth.transport import requests
from app.schemas.user import GoogleLogin


class AuthService:

    def register(
        self,
        db: Session,
        user: UserCreate,
    ):

        existing_email = db.query(User).filter(User.email == user.email).first()

        if existing_email:
            raise ValueError("Email already exists")

        existing_username = (
            db.query(User).filter(User.username == user.username).first()
        )

        if existing_username:
            raise ValueError("Username already exists")

        new_user = User(
            username=user.username,
            email=user.email,
            hashed_password=hash_password(user.password),
        )

        db.add(new_user)

        try:
            db.commit()
        except IntegrityError:
            db.rollback()
            raise ValueError("Username or email already exists")

        db.refresh(new_user)

        return new_user

    def login(
        self,
        db: Session,
        credentials: UserLogin,
    ):

        user = db.query(User).filter(User.email == credentials.email).first()

        if not user:
            raise ValueError("Invalid credentials")

        if not verify_password(
            credentials.password,
            user.hashed_password,
        ):
            raise ValueError("Invalid credentials")

        token = create_access_token(
            {
                "sub": user.email,
                "user_id": user.id,
            }
        )

        return {
            "access_token": token,
            "token_type": "bearer",
        }

    def google_login(
        self,
        db: Session,
        credentials: GoogleLogin,
    ):

        idinfo = id_token.verify_oauth2_token(
            credentials.token,
            requests.Request(),
        )

        email = idinfo["email"]

        name = idinfo.get(
            "name",
            email.split("@")[0],
        )

        user = db.query(User).filter(User.email == email).first()

        if not user:

            user = User(
                username=name,
                email=email,
                hashed_password="google_auth_user",
            )

            db.add(user)

            db.commit()

            db.refresh(user)

        token = create_access_token(
            {
                "sub": user.email,
                "user_id": user.id,
            }
        )

        return {
            "access_token": token,
            "token_type": "bearer",
        }
