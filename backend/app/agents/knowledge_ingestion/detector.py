from pathlib import Path


class FileDetector:
    """
    Detects the type of incoming input.
    """

    @staticmethod
    def detect(file_name: str | None = None, text: str | None = None) -> str:
        # User typed directly in chat
        if text and not file_name:
            return "chat"

        if not file_name:
            return "unknown"

        extension = Path(file_name).suffix.lower()

        mapping = {
            ".csv": "crm",
            ".xlsx": "crm",
            ".xls": "crm",
            ".pdf": "pdf",
            ".docx": "docx",
            ".txt": "text",
            ".eml": "email",
            ".html": "website",
            ".htm": "website",
            ".json": "json",
        }

        return mapping.get(extension, "unknown")