from datetime import datetime


class DataNormalizer:
    """
    Converts every source into one common structure.
    """

    @staticmethod
    def normalize(
        source_type: str,
        source_name: str,
        content: str,
    ):

        return {
            "source_type": source_type,
            "source_name": source_name,
            "content": content,
            "metadata": {
                "created_at": datetime.utcnow().isoformat(),
                "processed": True,
            },
        }