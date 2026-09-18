class DataExtractor:
    """
    Version 1:
    Returns raw content.

    Later we'll add:
    - PDF parsing
    - DOCX parsing
    - CSV parsing
    - Email parsing
    """

    @staticmethod
    def extract_text(
        source_type: str,
        content: str,
    ):

        return content