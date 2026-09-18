import os
import shutil
import tempfile
from pathlib import Path

from fastapi import UploadFile

from app.document_parser.parser import DocumentParser


class DocumentService:

    ALLOWED_EXTENSIONS = {
        ".pdf",
        ".docx",
        ".txt",
        ".csv",
    }

    def process(
        self,
        file: UploadFile,
    ) -> str:

        extension = Path(file.filename).suffix.lower()

        if extension not in self.ALLOWED_EXTENSIONS:
            raise ValueError(
                f"Unsupported file type: {extension}"
            )

        temp_dir = tempfile.mkdtemp()

        temp_path = os.path.join(
            temp_dir,
            file.filename,
        )

        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        try:

            text = DocumentParser.parse(temp_path)

        finally:

            if os.path.exists(temp_path):
                os.remove(temp_path)

            if os.path.exists(temp_dir):
                os.rmdir(temp_dir)

        return text