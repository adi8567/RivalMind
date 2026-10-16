"""Text processing, URL validation, and metric scoring utility helpers."""

import re
from typing import List, Optional
from urllib.parse import urlparse


def is_valid_url(url: str) -> bool:
    """Validate whether a string is a well-formed HTTP/HTTPS URL."""
    if not url or not isinstance(url, str):
        return False
    try:
        parsed = urlparse(url.strip())
        return parsed.scheme in ("http", "https") and bool(parsed.netloc)
    except Exception:
        return False


def normalize_domain(url: str) -> str:
    """Extract clean domain name from URL."""
    if not is_valid_url(url):
        return ""
    try:
        netloc = urlparse(url.strip()).netloc.lower()
        if netloc.startswith("www."):
            netloc = netloc[4:]
        return netloc
    except Exception:
        return ""


def clean_text(text: Optional[str]) -> str:
    """Normalize whitespace and strip leading/trailing control characters."""
    if not text:
        return ""
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def truncate_words(text: str, max_words: int = 50, ellipsis: str = "...") -> str:
    """Truncate text to specified word count."""
    if not text:
        return ""
    words = text.split()
    if len(words) <= max_words:
        return text
    return " ".join(words[:max_words]) + ellipsis


def format_currency(amount: float, currency_symbol: str = "$") -> str:
    """Format float into standard currency string."""
    return f"{currency_symbol}{amount:,.2f}"


def calculate_threat_score(
    product_changes_count: int,
    price_undercut: bool,
    market_momentum_sentiment: float,  # -1.0 to 1.0
    filing_growth_rate: float,  # e.g., 0.15 for 15%
) -> float:
    """Heuristic threat score calculation between 1.0 and 10.0."""
    base = 5.0

    # High product release velocity adds up to +2.0
    base += min(product_changes_count * 0.4, 2.0)

    # Price aggressiveness adds +1.5
    if price_undercut:
        base += 1.5

    # Sentiment adjustment (-1.0 to +1.0)
    base += market_momentum_sentiment * 1.0

    # Cloud / Segment expansion
    if filing_growth_rate > 0.20:
        base += 1.0
    elif filing_growth_rate > 0.10:
        base += 0.5

    return round(max(1.0, min(10.0, base)), 1)
