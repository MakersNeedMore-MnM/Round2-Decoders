from app.utils.url import get_domain


BLACKLIST = {
    "linkedin.com",
    "wikipedia.org",
    "facebook.com",
    "twitter.com",
    "x.com",
    "youtube.com",
    "instagram.com",
    "bloomberg.com",
    "reuters.com",
    "crunchbase.com",
    "glassdoor.com",
    "indeed.com",
    "finance.yahoo.com",
}


def find_official_website(results):

    for item in results:

        url = item.get("url", "")

        domain = get_domain(url)

        if domain.startswith("www."):
            domain = domain[4:]

        blocked = False

        for bad in BLACKLIST:

            if bad in domain:
                blocked = True
                break

        if blocked:
            continue

        return url

    return None