import fitz  # PyMuPDF
import pandas as pd
from docx import Document
from pathlib import Path


class DocumentParser:

    @staticmethod
    def parse(file_path: str) -> str:

        extension = Path(file_path).suffix.lower()

        if extension == ".txt":
            return DocumentParser._parse_txt(file_path)

        elif extension == ".pdf":
            return DocumentParser._parse_pdf(file_path)

        elif extension == ".docx":
            return DocumentParser._parse_docx(file_path)

        elif extension == ".csv":
            return DocumentParser._parse_csv(file_path)

        else:
            raise ValueError(f"Unsupported file type: {extension}")

    @staticmethod
    def _parse_txt(file_path: str):

        with open(file_path, "r", encoding="utf-8") as f:
            return f.read()

    @staticmethod
    def _parse_pdf(file_path: str):

        text = ""

        pdf = fitz.open(file_path)

        for page in pdf:
            text += page.get_text()

        pdf.close()

        return text

    @staticmethod
    def _parse_docx(file_path: str):

        document = Document(file_path)

        return "\n".join(
            paragraph.text
            for paragraph in document.paragraphs
        )

    @staticmethod
    def _parse_csv(file_path: str):

        df = pd.read_csv(file_path)

        return df.to_string(index=False)