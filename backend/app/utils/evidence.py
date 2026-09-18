"""
Preserves ResearchAgentV2's real, tool-found sources (search results,
official website, news articles) into the structured `knowledge.sources`
field.

Why this exists:
    ResearchAgentV2 finds real URLs (search results, the official
    website, news articles) and folds them into a single free-text
    "evidence" string that gets fed into KnowledgeExtractionAgent as
    plain text. That text only contains each source's title/content —
    never its URL (see research_v2.py's `search_text` builder) — so the
    downstream LLM has no URL to put in `knowledge["sources"]` and
    reliably returns it empty, even though ResearchAgentV2 genuinely
    found real, citable sources a moment earlier.

    Everything downstream (Guardrail, the workspace stakeholder/
    pain-point/buying-signal/graph endpoints) reads `knowledge["sources"]`
    as the evidence trail, so an empty list there silently breaks the
    evidence chain even though research itself succeeded.

This function does not invent anything: it only re-attaches the exact
URLs/titles ResearchAgentV2 already retrieved via real tool calls.
"""


def merge_research_sources(research: dict | None, knowledge: dict) -> dict:
    """
    Mutates and returns `knowledge`, filling `knowledge["sources"]` with
    the real sources ResearchAgentV2 found (search results, official
    website, news), deduplicated by URL. If ResearchAgentV2 wasn't used,
    found nothing, or the LLM extraction already produced real sources,
    this is a no-op / additive merge — nothing fabricated, nothing
    overwritten with guesses.
    """

    if not research or not isinstance(research, dict):
        return knowledge

    seen_urls = set()
    real_sources = []

    # Existing sources the extraction LLM may have legitimately found
    # (e.g. if the raw input text already contained citations).
    for existing in knowledge.get("sources") or []:
        url = existing.get("url") if isinstance(existing, dict) else None
        if url and url not in seen_urls:
            seen_urls.add(url)
            real_sources.append(existing)

    for item in research.get("sources") or []:
        url = item.get("url")
        if url and url not in seen_urls:
            seen_urls.add(url)
            real_sources.append(
                {
                    "title": item.get("title", ""),
                    "url": url,
                }
            )

    website = research.get("website")
    if website and website.get("success") and website.get("url"):
        url = website["url"]
        if url not in seen_urls:
            seen_urls.add(url)
            real_sources.append(
                {
                    "title": "Official Website",
                    "url": url,
                }
            )

    news = research.get("news")
    if news and news.get("success"):
        for article in news.get("results") or []:
            url = article.get("url")
            if url and url not in seen_urls:
                seen_urls.add(url)
                real_sources.append(
                    {
                        "title": article.get("title", ""),
                        "url": url,
                    }
                )

    if real_sources:
        knowledge["sources"] = real_sources

    return knowledge
