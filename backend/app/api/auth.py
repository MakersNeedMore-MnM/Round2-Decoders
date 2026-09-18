import base64
import hashlib
import hmac
import secrets
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import RedirectResponse
from google.auth.transport import requests
from google.oauth2 import id_token
from google_auth_oauthlib.flow import Flow
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.core.config import settings
from app.database.session import get_db
from app.models.connected_account import ConnectedAccount
from app.models.oauth_state import OAuthState

from app.models.user import User
from app.schemas.user import (
    GoogleLogin,
    UserCreate,
    UserLogin,
    UserResponse,
)
from app.services.auth_service import AuthService


router = APIRouter(
    prefix="/auth",
    tags=["Authentication"],
)

service = AuthService()


# ============================================================
# Google OAuth Configuration
# ============================================================

GOOGLE_SCOPES = [
    "openid",
    "https://www.googleapis.com/auth/userinfo.email",
    "https://www.googleapis.com/auth/gmail.send",
]

OAUTH_STATE_EXPIRY_MINUTES = 10


# ============================================================
# Existing Authentication
# ============================================================


@router.post("/register", response_model=UserResponse)
def register(
    user: UserCreate,
    db: Session = Depends(get_db),
):
    try:
        return service.register(db, user)

    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e),
        )


@router.post("/login")
def login(
    user: UserLogin,
    db: Session = Depends(get_db),
):
    try:
        return service.login(db, user)

    except ValueError as e:
        raise HTTPException(
            status_code=401,
            detail=str(e),
        )


@router.get("/me", response_model=UserResponse)
def me(
    current_user: User = Depends(get_current_user),
):
    return current_user


# ============================================================
# PKCE Utilities
# ============================================================


def generate_pkce():
    """
    Generate PKCE code verifier and S256 code challenge.
    """

    code_verifier = secrets.token_urlsafe(64)

    digest = hashlib.sha256(
        code_verifier.encode("ascii")
    ).digest()

    code_challenge = (
        base64.urlsafe_b64encode(digest)
        .decode("ascii")
        .rstrip("=")
    )

    return code_verifier, code_challenge


# ============================================================
# OAuth State Utilities
# ============================================================


def generate_oauth_state() -> str:
    """
    Generate an opaque random OAuth state value.

    The actual user ID and PKCE verifier are stored in the
    database rather than being exposed inside the state value.
    """

    return secrets.token_urlsafe(48)


def create_google_flow(
    code_verifier: str | None = None,
):
    """
    Create Google OAuth Flow.
    """

    client_config = {
        "web": {
            "client_id": settings.GOOGLE_CLIENT_ID,
            "client_secret": settings.GOOGLE_CLIENT_SECRET,
            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
            "token_uri": "https://oauth2.googleapis.com/token",
            "redirect_uris": [
                settings.GOOGLE_REDIRECT_URI
            ],
        }
    }

    flow = Flow.from_client_config(
        client_config,
        scopes=GOOGLE_SCOPES,
        code_verifier=code_verifier,
        autogenerate_code_verifier=False,
    )

    flow.redirect_uri = settings.GOOGLE_REDIRECT_URI

    return flow


# ============================================================
# Google Connect
# ============================================================


@router.get("/google/connect")
def google_connect(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Start Google OAuth connection for the currently
    authenticated ProspectIQ user.
    """

    try:
        # ----------------------------------------------------
        # 1. Generate PKCE
        # ----------------------------------------------------

        code_verifier, code_challenge = generate_pkce()

        # ----------------------------------------------------
        # 2. Generate opaque state
        # ----------------------------------------------------

        state = generate_oauth_state()

        # ----------------------------------------------------
        # 3. Calculate expiration
        # ----------------------------------------------------

        expires_at = (
            datetime.now(timezone.utc)
            + timedelta(minutes=OAUTH_STATE_EXPIRY_MINUTES)
        )

        # ----------------------------------------------------
        # 4. Store OAuth state + PKCE verifier
        # ----------------------------------------------------

        oauth_state = OAuthState(
            state=state,
            user_id=current_user.id,
            code_verifier=code_verifier,
            expires_at=expires_at,
        )

        db.add(oauth_state)
        db.commit()

        # ----------------------------------------------------
        # 5. Create Google OAuth flow
        # ----------------------------------------------------

        flow = create_google_flow(
            code_verifier=code_verifier
        )

        # ----------------------------------------------------
        # 6. Generate Google authorization URL
        # ----------------------------------------------------

        authorization_url, _ = flow.authorization_url(
            access_type="offline",
            include_granted_scopes="true",
            prompt="consent",
            state=state,
            code_challenge=code_challenge,
            code_challenge_method="S256",
        )

        return {
            "authorization_url": authorization_url,
        }

    except Exception as e:
        db.rollback()

        raise HTTPException(
            status_code=500,
            detail=f"Failed to start Google OAuth: {str(e)}",
        )


# ============================================================
# Google Callback
# ============================================================


@router.get("/google/callback")
def google_callback(
    code: str,
    state: str,
    db: Session = Depends(get_db),
):
    """
    Google OAuth callback.

    Flow:

    Google
       ↓
    state validation
       ↓
    retrieve PKCE verifier
       ↓
    exchange authorization code
       ↓
    verify Google identity
       ↓
    create/update ConnectedAccount
    """

    try:

        # ====================================================
        # 1. Retrieve OAuth state
        # ====================================================

        oauth_state = (
            db.query(OAuthState)
            .filter(
                OAuthState.state == state
            )
            .first()
        )

        if not oauth_state:
            raise HTTPException(
                status_code=400,
                detail="Invalid or expired OAuth state",
            )

        # ====================================================
        # 2. Check expiration
        # ====================================================

        now = datetime.now(timezone.utc)

        expires_at = oauth_state.expires_at

        # Handle databases returning naive datetime
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(
                tzinfo=timezone.utc
            )

        if now > expires_at:

            db.delete(oauth_state)
            db.commit()

            raise HTTPException(
                status_code=400,
                detail="OAuth state expired. Please reconnect Google.",
            )

        # ====================================================
        # 3. Retrieve ProspectIQ user
        # ====================================================

        prospectiq_user_id = oauth_state.user_id

        user = (
            db.query(User)
            .filter(
                User.id == prospectiq_user_id
            )
            .first()
        )

        if not user:

            db.delete(oauth_state)
            db.commit()

            raise HTTPException(
                status_code=404,
                detail="ProspectIQ user not found",
            )

        # ====================================================
        # 4. Retrieve PKCE verifier
        # ====================================================

        code_verifier = oauth_state.code_verifier

        if not code_verifier:

            db.delete(oauth_state)
            db.commit()

            raise HTTPException(
                status_code=400,
                detail=(
                    "PKCE verifier not found. "
                    "Please restart Google connection."
                ),
            )

        # ====================================================
        # 5. Delete OAuth state immediately
        #
        # This prevents replay attacks.
        # ====================================================

        db.delete(oauth_state)
        db.commit()

        # ====================================================
        # 6. Create OAuth flow
        # ====================================================

        flow = create_google_flow(
            code_verifier=code_verifier
        )

        # ====================================================
        # 7. Exchange authorization code
        # ====================================================

        flow.fetch_token(
            code=code
        )

        credentials = flow.credentials

        # ====================================================
        # 8. Make sure ID token exists
        # ====================================================

        if not credentials.id_token:
            raise HTTPException(
                status_code=400,
                detail="Google did not return an ID token",
            )

        # ====================================================
        # 9. Verify Google ID token
        # ====================================================

        request = requests.Request()

        id_info = id_token.verify_oauth2_token(
            credentials.id_token,
            request,
            settings.GOOGLE_CLIENT_ID,
        )

        # ====================================================
        # 10. Validate issuer
        # ====================================================

        issuer = id_info.get("iss")

        if issuer not in [
            "accounts.google.com",
            "https://accounts.google.com",
        ]:
            raise HTTPException(
                status_code=400,
                detail="Invalid Google token issuer",
            )

        # ====================================================
        # 11. Validate email
        # ====================================================

        google_email = id_info.get("email")

        if not google_email:
            raise HTTPException(
                status_code=400,
                detail="Google account email not found",
            )

        # ====================================================
        # 12. Validate email verification
        # ====================================================

        email_verified = id_info.get(
            "email_verified"
        )

        if email_verified is not True:
            raise HTTPException(
                status_code=400,
                detail="Google email is not verified",
            )

        # ====================================================
        # 13. Get Google account ID
        # ====================================================

        google_subject = id_info.get("sub")

        if not google_subject:
            raise HTTPException(
                status_code=400,
                detail="Google account ID not found",
            )

        # ====================================================
        # 14. Find existing Google connection
        # ====================================================

        account = (
            db.query(ConnectedAccount)
            .filter(
                ConnectedAccount.user_id
                == prospectiq_user_id,
                ConnectedAccount.provider
                == "google",
            )
            .first()
        )

        # ====================================================
        # 15. Update existing account
        # ====================================================

        if account:

            account.email = google_email

            account.access_token = credentials.token

            # Google may NOT return a refresh token
            # during subsequent authorizations.
            if credentials.refresh_token:
                account.refresh_token = (
                    credentials.refresh_token
                )

            account.token_expiry = credentials.expiry

            # Store Google subject if your model supports it.
            if hasattr(account, "provider_account_id"):
                account.provider_account_id = google_subject

            account.updated_at = datetime.now(
                timezone.utc
            )

        # ====================================================
        # 16. Create new account
        # ====================================================

        else:

            if not credentials.refresh_token:
                raise HTTPException(
                    status_code=400,
                    detail=(
                        "Google did not return a refresh token. "
                        "Please revoke the existing Google "
                        "permission and connect again."
                    ),
                )

            account = ConnectedAccount(
                user_id=prospectiq_user_id,
                provider="google",
                email=google_email,
                access_token=credentials.token,
                refresh_token=credentials.refresh_token,
                token_expiry=credentials.expiry,
            )

            if hasattr(account, "provider_account_id"):
                account.provider_account_id = google_subject

            db.add(account)

        # ====================================================
        # 17. Save account
        # ====================================================

        db.commit()
        db.refresh(account)

       # ====================================================
        # 18. Success — redirect back into the frontend app
        # ====================================================

        return RedirectResponse(
            url=f"{settings.FRONTEND_URL}/queue?gmail_connected=true"
        )

    except HTTPException as e:

        return RedirectResponse(
            url=(
                f"{settings.FRONTEND_URL}/queue"
                f"?gmail_error={e.detail}"
            )
        )

    except Exception as e:

        db.rollback()

        print(
            "\n========== GOOGLE OAUTH ERROR =========="
        )
        print(str(e))
        print(
            "========================================\n"
        )

        return RedirectResponse(
            url=(
                f"{settings.FRONTEND_URL}/queue"
                f"?gmail_error=connection_failed"
            )
        )

# ============================================================
# Gmail Status
# ============================================================


@router.get("/google/status")
def google_status(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Check whether the current ProspectIQ user
    has connected a Google account.
    """

    account = (
        db.query(ConnectedAccount)
        .filter(
            ConnectedAccount.user_id
            == current_user.id,
            ConnectedAccount.provider
            == "google",
        )
        .first()
    )

    if not account:
        return {
            "connected": False,
            "email": None,
        }

    return {
        "connected": True,
        "email": account.email,
    }


# ============================================================
# Gmail Disconnect
# ============================================================


@router.post("/google/disconnect")
def google_disconnect(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Disconnect Google/Gmail account from ProspectIQ.
    """

    account = (
        db.query(ConnectedAccount)
        .filter(
            ConnectedAccount.user_id
            == current_user.id,
            ConnectedAccount.provider
            == "google",
        )
        .first()
    )

    if account is None:
        return {
            "connected": False,
            "email": None,
        }

    db.delete(account)
    db.commit()

    return {
        "connected": False,
        "email": None,
    }


# ============================================================
# Existing Google Login
# ============================================================


@router.post("/google-auth")
def google_auth(
    user: GoogleLogin,
    db: Session = Depends(get_db),
):
    """
    Existing Google authentication endpoint.

    This is kept separate from /google/connect because
    /google-auth is for ProspectIQ login while
    /google/connect is for connecting Gmail.
    """

    return service.google_login(
        db,
        user,
    )