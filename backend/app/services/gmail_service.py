import base64

from email.mime.text import MIMEText

from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build

from app.core.config import settings


class GmailService:

    def send_email(
        self,
        account,
        recipient,
        subject,
        body,
    ):

        credentials = Credentials(
            token=account.access_token,
            refresh_token=account.refresh_token,
            token_uri="https://oauth2.googleapis.com/token",
            client_id=settings.GOOGLE_CLIENT_ID,
            client_secret=settings.GOOGLE_CLIENT_SECRET,
        )

        service = build(
            "gmail",
            "v1",
            credentials=credentials,
        )

        message = MIMEText(body)

        message["to"] = recipient
        message["from"] = account.email
        message["subject"] = subject

        raw_message = (
            base64.urlsafe_b64encode(
                message.as_bytes()
            )
            .decode()
        )

        service.users().messages().send(
            userId="me",
            body={
                "raw": raw_message,
            },
        ).execute()