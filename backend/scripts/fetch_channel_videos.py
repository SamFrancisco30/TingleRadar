"""Channel-based YouTube ingestion for TingleRadar.

This script complements the ranking-based ingestion by crawling videos from a
curated list of ASMR creators (CreatorWatchlist). The goal is to gradually
populate the `videos` table with a richer catalog (e.g. last N days of uploads
for high-priority channels), so that we can support "browse all" and more
advanced discovery features.

Usage examples:

    PYTHONPATH=backend python -m backend.scripts.fetch_channel_videos \
        --days 365 --per-channel 20

    # Debug a single channel
    PYTHONPATH=backend python -m backend.scripts.fetch_channel_videos \
        --channel-id UCxxxx --days 365 --per-channel 50 --dry-run
"""

import argparse
import logging
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Iterable, List, Optional

import requests

from app.core.config import Settings
from app.db.session import SessionLocal
from app.models import CreatorWatchlist, Video
from backend.scripts.fetch_rankings import (
    YOUTUBE_VIDEOS_URL,
    chunked,
    normalize_video_payload,
    youtube_request,
)

logger = logging.getLogger("fetch_channel_videos")
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")


YOUTUBE_SEARCH_URL = "https://www.googleapis.com/youtube/v3/search"


def parse_arguments() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Ingest videos for tracked ASMR creators into the videos table.",
    )
    parser.add_argument(
        "--days",
        type=int,
        default=365,
        help="Only ingest videos published within the last N days.",
    )
    parser.add_argument(
        "--per-channel",
        type=int,
        default=20,
        help="Maximum number of videos to fetch per channel (within the window).",
    )
    parser.add_argument(
        "--channel-id",
        default=None,
        help="If provided, only ingest for this specific YouTube channel ID.",
    )
    parser.add_argument(
        "--api-key",
        default=None,
        help="Override the YouTube API key (falls back to YOUTUBE_API_KEY in env).",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Fetch and log candidate videos but do not commit to the database.",
    )
    return parser.parse_args()


def fetch_channel_video_ids(
    api_key: str,
    channel_id: str,
    published_after: str,
    max_results: int,
) -> List[str]:
    """Fetch recent video IDs for a channel using the Search API.

    We filter by `channelId` and `publishedAfter`, ordered by date.
    """

    logger.info(
        "Querying YouTube for channel %s videos since %s (limit=%s)",
        channel_id,
        published_after,
        max_results,
    )
    params: Dict[str, Any] = {
        "part": "id",
        "type": "video",
        "channelId": channel_id,
        "maxResults": min(max_results, 50),
        "order": "date",
        "publishedAfter": published_after,
    }
    payload = youtube_request(YOUTUBE_SEARCH_URL, api_key, **params)
    return [
        item["id"]["videoId"]
        for item in payload.get("items", [])
        if "videoId" in item.get("id", {})
    ]


def fetch_video_details(api_key: str, video_ids: List[str]) -> List[Dict[str, Any]]:
    details: List[Dict[str, Any]] = []
    for batch in chunked(video_ids, 50):
        payload = youtube_request(
            YOUTUBE_VIDEOS_URL,
            api_key,
            part="snippet,statistics,contentDetails",
            id=",".join(batch),
        )
        details.extend(payload.get("items", []))
    return details


def main() -> None:
    args = parse_arguments()
    settings = Settings()
    api_key = args.api_key or settings.youtube_api_key
    if not api_key:
        raise RuntimeError(
            "YouTube API key is required—set YOUTUBE_API_KEY in the .env file",
        )

    session = SessionLocal()
    try:
        # Determine which creators to crawl.
        query = session.query(CreatorWatchlist).filter(CreatorWatchlist.is_active.is_(True))
        if args.channel_id:
            query = query.filter(CreatorWatchlist.channel_id == args.channel_id)

        creators = query.order_by(CreatorWatchlist.priority.desc(), CreatorWatchlist.id).all()
        if not creators:
            logger.info("No active creators found in watchlist; nothing to do.")
            return

        window_start = datetime.now(timezone.utc) - timedelta(days=args.days)
        published_after = window_start.strftime("%Y-%m-%dT%H:%M:%SZ")

        logger.info(
            "Ingesting videos for %s creators (window=%s days, per-channel=%s)",
            len(creators),
            args.days,
            args.per_channel,
        )

        total_videos = 0
        for creator in creators:
            video_ids = fetch_channel_video_ids(
                api_key,
                channel_id=creator.channel_id,
                published_after=published_after,
                max_results=args.per_channel,
            )
            if not video_ids:
                logger.info("Channel %s: no videos found in window.", creator.channel_title)
                continue

            details = fetch_video_details(api_key, video_ids)
            if not details:
                logger.info(
                    "Channel %s: no details returned for %s video IDs.",
                    creator.channel_title,
                    len(video_ids),
                )
                continue

            logger.info(
                "Channel %s: ingesting %s videos.",
                creator.channel_title,
                len(details),
            )

            for detail in details:
                payload = normalize_video_payload(detail)
                # We rely on normalize_video_payload to set published_at, tags, etc.
                if payload["published_at"] < window_start:
                    # Defensive: ignore videos outside the window.
                    continue
                session.merge(Video(**payload))
                total_videos += 1

        if args.dry_run:
            session.rollback()
            logger.info("Dry run enabled—rolled back transaction (total_videos=%s).", total_videos)
        else:
            session.commit()
            logger.info("Committed %s videos from %s creators.", total_videos, len(creators))

    finally:
        session.close()


if __name__ == "__main__":  # pragma: no cover
    main()
