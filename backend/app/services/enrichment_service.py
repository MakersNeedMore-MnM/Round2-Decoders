import time

import requests

from app.core.config import settings
from app.core.logger import logger


class EnrichmentAPIError(Exception):
    """Raised when the AppConnector (GrowthToolkit) API returns an error."""

    def __init__(self, code: str | None, message: str, status_code: int = 400):
        self.code = code
        self.message = message
        self.status_code = status_code
        super().__init__(message)


class EnrichmentService:
    """
    Thin client around GrowthToolkit's AppConnector API
    (https://api.appconnector.pro).

    Covers:
      - Email Finder      -> find_email()
      - Email Verifier    -> verify_email()
      - Email Enrichment  -> enrich_by_email()
      - Phone Enrichment  -> enrich_by_phone()
      - LinkedIn Enrichment -> enrich_by_linkedin()
      - Task polling for async responses -> _poll_task()
    """

    def __init__(self):
        self.base_url = settings.APPCONNECTOR_BASE_URL.rstrip("/")
        self.api_key = settings.APPCONNECTOR_API_KEY

    # ============================================================
    # Internal helpers
    # ============================================================

    def _headers(self) -> dict:
        return {
            "x-api-key": self.api_key,
            "Content-Type": "application/json",
        }

    def _request(
        self,
        method: str,
        path: str,
        params: dict | None = None,
        json: dict | None = None,
    ) -> dict:
        url = f"{self.base_url}{path}"

        response = requests.request(
            method,
            url,
            headers=self._headers(),
            params=params,
            json=json,
            timeout=30,
        )

        # Per docs: backend returns 200 even on most logical errors,
        # non-200 means a real server-side/auth/rate-limit problem.
        if response.status_code != 200:
            self._raise_for_status(response)

        body = response.json()

        if not body.get("success", False):
            raise EnrichmentAPIError(
                code=body.get("code"),
                message=body.get("code", "Unknown error from enrichment API"),
                status_code=response.status_code,
            )

        data = body.get("data")

        # Async flow: {"success": true, "data": {"task_id": "..."}}
        if isinstance(data, dict) and "task_id" in data and len(data) == 1:
            return self._poll_task(data["task_id"])

        return data

    def _raise_for_status(self, response: requests.Response):
        try:
            body = response.json()
        except ValueError:
            body = {}

        code = body.get("code")

        message_map = {
            400: "Bad request - check your parameters",
            401: "Invalid AppConnector API key",
            402: "Credits exhausted on AppConnector plan",
            404: "Resource not found",
            406: "Low wallet balance to auto-recharge credits",
            407: "Low credits - top up required",
            409: "Current plan does not support API keys",
            417: "Invalid input received",
            428: "Upgrade plan to add credits in this feature",
            429: "Too many requests - slow down",
            500: "AppConnector internal server error",
        }

        message = message_map.get(
            response.status_code,
            f"AppConnector request failed with status {response.status_code}",
        )

        logger.error(
            f"AppConnector API error [{response.status_code}] {code}: {message}"
        )

        raise EnrichmentAPIError(
            code=code,
            message=message,
            status_code=response.status_code,
        )

    def _poll_task(
        self,
        task_id: str,
        interval_seconds: float = 3.0,
        max_attempts: int = 10,
    ) -> dict:
        for _ in range(max_attempts):
            time.sleep(interval_seconds)

            status_response = requests.get(
                f"{self.base_url}/tasks/status/{task_id}/",
                headers=self._headers(),
                timeout=30,
            )

            if status_response.status_code != 200:
                self._raise_for_status(status_response)

            body = status_response.json()
            task_data = body.get("data", {})

            if task_data.get("status") == "finished":
                return task_data.get("result")

        raise EnrichmentAPIError(
            code="task_timeout",
            message="Enrichment task did not finish in time",
            status_code=408,
        )

    # ============================================================
    # Public API
    # ============================================================

    def find_email(
        self,
        first_name: str,
        last_name: str,
        domain: str,
        list_id: int | None = None,
    ) -> dict | None:
        """
        Find a person's work email from name + company domain.
        Returns None if no email was found (instead of raising).
        """
        params = {
            "first_name": first_name,
            "last_name": last_name,
            "domain": domain,
        }

        if list_id is not None:
            params["list_id"] = list_id

        try:
            return self._request("GET", "/email-finder/", params=params)
        except EnrichmentAPIError as e:
            if e.code == "resource_not_found":
                return None
            raise

    def verify_email(
        self,
        email: str,
        list_id: int | None = None,
    ) -> dict:
        params = {"email": email}

        if list_id is not None:
            params["list_id"] = list_id

        return self._request("GET", "/email-verifier/", params=params)

    def enrich_by_email(
        self,
        email: str,
        list_id: int | None = None,
    ) -> dict:
        params = {"email": email}

        if list_id is not None:
            params["list_id"] = list_id

        return self._request("GET", "/enrichment/email/", params=params)

    def enrich_by_phone(
        self,
        phone_number: str,
        list_id: int | None = None,
    ) -> dict:
        params = {"phone_number": phone_number}

        if list_id is not None:
            params["list_id"] = list_id

        return self._request("GET", "/enrichment/phone/", params=params)

    def enrich_by_linkedin(
        self,
        url: str,
        unlock_emails: bool = False,
        unlock_phone: bool = False,
        list_id: int | None = None,
    ) -> dict:
        payload = {
            "url": url,
            "unlock_emails": 1 if unlock_emails else 0,
            "unlock_phone": 1 if unlock_phone else 0,
        }

        if list_id is not None:
            payload["list_id"] = list_id

        return self._request("POST", "/enrichment/linkedin/", json=payload)

    def find_and_verify_email(
        self,
        first_name: str,
        last_name: str,
        domain: str,
        list_id: int | None = None,
    ) -> dict | None:
        """
        Convenience method: finds a person's email, then immediately
        verifies it. Returns None if no email was found at all.

        Returns:
            {
                "email": "...",
                "found_id": 123,
                "is_valid": true/false,
                "mx_domain": "...",
            }
            or None if no email could be found.
        """
        found = self.find_email(
            first_name=first_name,
            last_name=last_name,
            domain=domain,
            list_id=list_id,
        )

        if found is None:
            return None

        email = found.get("email")

        verification = self.verify_email(email=email, list_id=list_id)

        return {
            "email": email,
            "found_id": found.get("id"),
            "is_valid": verification.get("is_valid", False),
            "mx_domain": verification.get("mx_domain"),
        }