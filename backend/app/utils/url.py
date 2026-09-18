from urllib.parse import urlparse


def get_domain(url: str) -> str:
    """
    Extract domain from URL.
    """

    try:

        return urlparse(url).netloc.lower()

    except Exception:

        return ""