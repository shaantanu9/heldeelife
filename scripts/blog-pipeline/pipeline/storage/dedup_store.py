"""SQLite-based URL deduplication tracker."""

import sqlite3
from datetime import datetime, timezone
from pathlib import Path

from pipeline.settings import DATA_DIR


DB_PATH = DATA_DIR / "dedup.sqlite"


def _get_conn() -> sqlite3.Connection:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(DB_PATH))
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS seen_urls (
            url TEXT PRIMARY KEY,
            source TEXT,
            scraped_at TEXT,
            published BOOLEAN DEFAULT FALSE
        )
        """
    )
    conn.commit()
    return conn


def is_seen(url: str) -> bool:
    """Check if a URL has already been scraped."""
    conn = _get_conn()
    try:
        row = conn.execute("SELECT 1 FROM seen_urls WHERE url = ?", (url,)).fetchone()
        return row is not None
    finally:
        conn.close()


def mark_seen(url: str, source: str) -> None:
    """Record a URL as scraped."""
    conn = _get_conn()
    try:
        conn.execute(
            "INSERT OR IGNORE INTO seen_urls (url, source, scraped_at) VALUES (?, ?, ?)",
            (url, source, datetime.now(timezone.utc).isoformat()),
        )
        conn.commit()
    finally:
        conn.close()


def mark_published(url: str) -> None:
    """Mark a URL as published to Supabase."""
    conn = _get_conn()
    try:
        conn.execute("UPDATE seen_urls SET published = TRUE WHERE url = ?", (url,))
        conn.commit()
    finally:
        conn.close()


def get_stats() -> dict:
    """Return dedup stats."""
    conn = _get_conn()
    try:
        total = conn.execute("SELECT COUNT(*) FROM seen_urls").fetchone()[0]
        published = conn.execute(
            "SELECT COUNT(*) FROM seen_urls WHERE published = TRUE"
        ).fetchone()[0]
        return {"total_scraped": total, "published": published, "pending": total - published}
    finally:
        conn.close()
