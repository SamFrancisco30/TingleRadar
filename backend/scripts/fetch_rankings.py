"""YouTube-based ranking ingestion for TingleRadar."""

import argparse
import logging
from collections import OrderedDict
from datetime import datetime, timezone
from typing import Any, Dict, Iterable, List, NamedTuple, Optional

import requests
from isodate import parse_duration

from app.core.config import Settings
from app.db.session import SessionLocal
from app.models import RankingItem, RankingList, Video


YOUTUBE_SEARCH_URL = "https://www.googleapis.com/youtube/v3/search"
YOUTUBE_VIDEOS_URL = "https://www.googleapis.com/youtube/v3/videos"
DEFAULT_QUERIES = [
    "ASMR whisper",
    "ASMR no talking",
    "ASMR binaural",
    "ASMR roleplay",
    "ASMR ear to ear",
]
BLACKLIST_KEYWORDS = [
    "mukbang",
    "magnetic ball",
    "marble",
    "eating",
    "grinding",
    "politics",
]
BLACKLIST_CHANNELS = set()

logger = logging.getLogger("fetch_rankings")
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")


class RankingPayload(NamedTuple):
    items: List[Dict[str, Any]]
    generated_at: datetime
    queries: List[str]


def parse_arguments() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Generate an ASMR ranking list and store it in Supabase."
    )
    parser.add_argument(
        "--queries",
        "-q",
        nargs="+",
        default=DEFAULT_QUERIES,
        help="Query strings to pass to YouTube search.",
    )
    parser.add_argument(
        "--per-query",
        type=int,
        default=20,
        help="How many videos to grab per YouTube search query (max 50).",
    )
    parser.add_argument(
        "--top",
        type=int,
        default=60,
        help="How many videos to keep in the final ranking list.",
    )
    parser.add_argument(
        "--name",
        default=None,
        help="Optional list name—defaults to a weekly label.",
    )
    parser.add_argument(
        "--description",
        default=None,
        help="Optional description stored alongside the list.",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Build the list but don't commit it to the database.",
    )
    parser.add_argument(
        "--api-key",
        default=None,
        help="Override the YouTube API key (falls back to YOUTUBE_API_KEY in env).",
    )
    return parser.parse_args()


def youtube_request(url: str, api_key: str, **params: Any) -> Dict[str, Any]:
    params["key"] = api_key
    response = requests.get(url, params=params, timeout=10)
    response.raise_for_status()
    return response.json()


def fetch_search_ids(api_key: str, query: str, max_results: int) -> List[str]:
    logger.info("Querying YouTube for %s", query)
    params = {
        "part": "snippet",
        "type": "video",
        "maxResults": min(max_results, 50),
        "order": "viewCount",
        "q": query,
    }
    payload = youtube_request(YOUTUBE_SEARCH_URL, api_key, **params)
    return [
        item["id"]["videoId"]
        for item in payload.get("items", [])
        if "videoId" in item.get("id", {})
    ]


def chunked(iterable: Iterable[Any], size: int) -> Iterable[List[Any]]:
    iterator = iter(iterable)
    while True:
        chunk = []
        for _ in range(size):
            try:
                chunk.append(next(iterator))
            except StopIteration:
                break
        if not chunk:
            break
        yield chunk


def fetch_video_details(api_key: str, video_ids: List[str]) -> List[Dict[str, Any]]:
    details = []
    for batch in chunked(video_ids, 50):
        payload = youtube_request(
            YOUTUBE_VIDEOS_URL,
            api_key,
            part="snippet,statistics,contentDetails",
            id=",".join(batch),
        )
        details.extend(payload.get("items", []))
    return details


def filter_video(snippet: Dict[str, Any]) -> bool:
    if not snippet:
        return False
    if snippet.get("channelId") in BLACKLIST_CHANNELS:
        return False
    text = " ".join(
        filter(None, [snippet.get("title"), snippet.get("description"), snippet.get("channelTitle")])
    ).lower()
    return not any(keyword in text for keyword in BLACKLIST_KEYWORDS)


def parse_published_at(value: str) -> datetime:
    if value.endswith("Z"):
        value = value[:-1]
    if "." in value:
        value = value.split(".")[0]
    return datetime.strptime(value, "%Y-%m-%dT%H:%M:%S").replace(tzinfo=timezone.utc)


def parse_duration_seconds(value: Optional[str]) -> Optional[int]:
    if not value:
        return None
    try:
        return int(parse_duration(value).total_seconds())
    except Exception:
        return None


def normalize_video_payload(detail: Dict[str, Any]) -> Dict[str, Any]:
    snippet = detail.get("snippet", {})
    stats = detail.get("statistics", {})
    content = detail.get("contentDetails", {})
    thumbnail_url = None
    for key in ("standard", "high", "medium", "default"):
        candidate = snippet.get("thumbnails", {}).get(key)
        if candidate:
            thumbnail_url = candidate.get("url")
            break

    published_raw = snippet.get("publishedAt")
    published_at = (
        parse_published_at(published_raw)
        if published_raw
        else datetime.now(timezone.utc)
    )

    return {
        "youtube_id": detail.get("id"),
        "title": snippet.get("title", ""),
        "description": snippet.get("description"),
        "channel_title": snippet.get("channelTitle", ""),
        "channel_id": snippet.get("channelId", ""),
        "published_at": published_at,
        "view_count": int(stats.get("viewCount", 0)),
        "like_count": int(stats.get("likeCount", 0)),
        "duration": parse_duration_seconds(content.get("duration")),
        "tags": snippet.get("tags", []),
        "thumbnail_url": thumbnail_url,
    }


def extract_view_count(detail: Dict[str, Any]) -> int:
    stats = detail.get("statistics", {})
    try:
        return int(stats.get("viewCount", 0))
    except (TypeError, ValueError):
        return 0


def persist_ranking(
    session,
    payload: RankingPayload,
    list_name: str,
    description: str,
    top_n: int,
    dry_run: bool,
) -> None:
    logger.info("Building ranking list %s with %s candidates", list_name, len(payload.items))
    sorted_items = sorted(payload.items, key=extract_view_count, reverse=True)
    filtered = [item for item in sorted_items if filter_video(item.get("snippet", {}))]
    truncated = filtered[:top_n]

    if not truncated:
        logger.warning("No items survived filtering—nothing to persist.")
        return

    ranking = RankingList(name=list_name, description=description)
    session.add(ranking)
    session.flush()

    for idx, item in enumerate(truncated, start=1):
        video_payload = normalize_video_payload(item)
        session.merge(Video(**video_payload))
        session.add(
            RankingItem(
                ranking_list_id=ranking.id,
                video_id=video_payload["youtube_id"],
                position=idx,
                score=video_payload["view_count"],
            )
        )

    if dry_run:
        session.rollback()
        logger.info("Dry run enabled—rolled back transaction.")
    else:
        session.commit()
        logger.info("Persisted ranking list %s with %s entries", list_name, len(truncated))


def main() -> None:
    args = parse_arguments()
    settings = Settings()
    api_key = args.api_key or settings.youtube_api_key
    if not api_key:
        raise RuntimeError("YouTube API key is required—set YOUTUBE_API_KEY in the .env file")

    session = SessionLocal()
    try:
        aggregated: "OrderedDict[str, None]" = OrderedDict()
        for query in args.queries:
            for video_id in fetch_search_ids(api_key, query, args.per_query):
                aggregated.setdefault(video_id, None)

        payload = RankingPayload(
            items=fetch_video_details(api_key, list(aggregated.keys())),
            generated_at=datetime.now(timezone.utc),
            queries=args.queries,
        )
        list_name = args.name or f"ASMR Weekly Pulse {payload.generated_at:%Y-%m-%d}"
        description = args.description or f"Queries: {', '.join(payload.queries)}"
        persist_ranking(session, payload, list_name, description, args.top, args.dry_run)
    finally:
        session.close()


if __name__ == "__main__":
    main()
