"""YouTube-based ranking ingestion for TingleRadar."""

import argparse
import logging
import os
from collections import OrderedDict
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Iterable, List, NamedTuple, Optional

import requests
from dotenv import load_dotenv
from isodate import parse_duration


YOUTUBE_SEARCH_URL = "https://www.googleapis.com/youtube/v3/search"
YOUTUBE_VIDEOS_URL = "https://www.googleapis.com/youtube/v3/videos"
DEFAULT_QUERIES = [
    "ASMR whisper",
    "ASMR no talking",
    "ASMR binaural",
    "ASMR roleplay",
    "ASMR ear to ear",
]
RECENT_DAYS = 7
FALLBACK_DAYS = 14
STRICT_MIN_DURATION_SECONDS = 120
RELAXED_MIN_DURATION_SECONDS = 60
MIN_WEEKLY_RESULTS = 60
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


class SupabaseRestClient:
    def __init__(self, supabase_url: str, service_role_key: str) -> None:
        self.base_url = f"{supabase_url.rstrip('/')}/rest/v1"
        self.headers = {
            "apikey": service_role_key,
            "Authorization": f"Bearer {service_role_key}",
            "Content-Type": "application/json",
        }

    def _request(
        self,
        method: str,
        path: str,
        *,
        params: Optional[Dict[str, Any]] = None,
        json_payload: Optional[Any] = None,
        prefer: Optional[str] = None,
    ) -> Any:
        headers = dict(self.headers)
        if prefer:
            headers["Prefer"] = prefer

        response = requests.request(
            method,
            f"{self.base_url}/{path.lstrip('/')}",
            params=params,
            json=json_payload,
            headers=headers,
            timeout=20,
        )
        if not response.ok:
            raise RuntimeError(
                f"Supabase REST {method} {path} failed: {response.status_code} {response.text}"
            )

        if not response.text:
            return None
        try:
            return response.json()
        except ValueError:
            return response.text

    def upsert_videos(self, videos: List[Dict[str, Any]]) -> None:
        if not videos:
            return

        batch_size = 200
        for i in range(0, len(videos), batch_size):
            batch = videos[i : i + batch_size]
            self._request(
                "POST",
                "videos",
                params={"on_conflict": "youtube_id"},
                json_payload=batch,
                prefer="resolution=merge-duplicates,return=minimal",
            )

    def insert_ranking_list(self, name: str, description: str) -> int:
        rows = self._request(
            "POST",
            "ranking_lists",
            json_payload=[{"name": name, "description": description}],
            prefer="return=representation",
        )
        if not rows or not isinstance(rows, list) or "id" not in rows[0]:
            raise RuntimeError("Failed to insert ranking list or read generated id")
        return int(rows[0]["id"])

    def insert_ranking_items(self, items: List[Dict[str, Any]]) -> None:
        if not items:
            return
        self._request(
            "POST",
            "ranking_items",
            json_payload=items,
            prefer="return=minimal",
        )


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
        default=100,
        help="How many videos to keep in the final ranking list.",
    )
    parser.add_argument(
        "--name",
        default=None,
        help="Optional list name; defaults to a weekly label.",
    )
    parser.add_argument(
        "--description",
        default=None,
        help="Optional description stored alongside the list.",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Build the list but do not write to Supabase.",
    )
    parser.add_argument(
        "--api-key",
        default=None,
        help="Override the YouTube API key (falls back to YOUTUBE_API_KEY in env).",
    )
    parser.add_argument(
        "--days-offset",
        type=int,
        default=0,
        help=(
            "Shift the 7-day window back by N days. "
            "For example, --days-offset 7 approximates the previous week."
        ),
    )
    return parser.parse_args()


def youtube_request(url: str, api_key: str, **params: Any) -> Dict[str, Any]:
    params["key"] = api_key
    response = requests.get(url, params=params, timeout=10)
    response.raise_for_status()
    return response.json()


def fetch_search_ids(api_key: str, query: str, max_results: int, published_after: str) -> List[str]:
    logger.info("Querying YouTube for %s since %s", query, published_after)
    params = {
        "part": "snippet",
        "type": "video",
        "maxResults": min(max_results, 50),
        "order": "viewCount",
        "q": query,
        "publishedAfter": published_after,
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
    published_at = parse_published_at(published_raw) if published_raw else datetime.now(timezone.utc)

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


def is_long_video(video_payload: Dict[str, Any]) -> bool:
    duration = video_payload.get("duration")
    return duration is not None and duration >= STRICT_MIN_DURATION_SECONDS


def has_min_duration(video_payload: Dict[str, Any], min_seconds: int) -> bool:
    duration = video_payload.get("duration")
    return duration is not None and duration >= min_seconds


def _serialize_video(video_payload: Dict[str, Any]) -> Dict[str, Any]:
    row = dict(video_payload)
    published_at = row.get("published_at")
    if isinstance(published_at, datetime):
        row["published_at"] = published_at.isoformat()
    return row


def _extend_unique_videos(
    selected: List[Dict[str, Any]],
    candidates: List[Dict[str, Any]],
    predicate,
    limit: int,
) -> int:
    existing_ids = {video["youtube_id"] for video in selected}
    added = 0
    for video in candidates:
        if len(selected) >= limit:
            break
        video_id = video["youtube_id"]
        if video_id in existing_ids or not predicate(video):
            continue
        selected.append(video)
        existing_ids.add(video_id)
        added += 1
    return added


def persist_ranking(
    supabase_client: SupabaseRestClient,
    payload: RankingPayload,
    list_name: str,
    description: str,
    top_n: int,
    dry_run: bool,
    recent_threshold: datetime,
) -> None:
    logger.info("Building ranking list %s with %s candidates", list_name, len(payload.items))
    sorted_items = sorted(payload.items, key=extract_view_count, reverse=True)
    filtered = [item for item in sorted_items if filter_video(item.get("snippet", {}))]
    normalized_candidates = [normalize_video_payload(item) for item in filtered]

    fallback_threshold = recent_threshold - timedelta(days=FALLBACK_DAYS - RECENT_DAYS)
    target_count = min(top_n, MIN_WEEKLY_RESULTS)

    selected_candidates: List[Dict[str, Any]] = []
    stage_counts = {
        "strict_recent_long": _extend_unique_videos(
            selected_candidates,
            normalized_candidates,
            lambda video: video["published_at"] >= recent_threshold
            and has_min_duration(video, STRICT_MIN_DURATION_SECONDS),
            top_n,
        )
    }

    if len(selected_candidates) < target_count:
        stage_counts["recent_short_fill"] = _extend_unique_videos(
            selected_candidates,
            normalized_candidates,
            lambda video: video["published_at"] >= recent_threshold
            and has_min_duration(video, RELAXED_MIN_DURATION_SECONDS),
            top_n,
        )

    if len(selected_candidates) < target_count:
        stage_counts["fallback_long_fill"] = _extend_unique_videos(
            selected_candidates,
            normalized_candidates,
            lambda video: video["published_at"] >= fallback_threshold
            and has_min_duration(video, STRICT_MIN_DURATION_SECONDS),
            top_n,
        )

    if len(selected_candidates) < target_count:
        stage_counts["fallback_short_fill"] = _extend_unique_videos(
            selected_candidates,
            normalized_candidates,
            lambda video: video["published_at"] >= fallback_threshold
            and has_min_duration(video, RELAXED_MIN_DURATION_SECONDS),
            top_n,
        )

    truncated = selected_candidates[:top_n]

    if not truncated:
        logger.warning("No recent items survived filtering, nothing to persist.")
        return

    logger.info(
        "Selected %s videos (target=%s, strict=%s, recent_short=%s, fallback_long=%s, fallback_short=%s)",
        len(truncated),
        target_count,
        stage_counts.get("strict_recent_long", 0),
        stage_counts.get("recent_short_fill", 0),
        stage_counts.get("fallback_long_fill", 0),
        stage_counts.get("fallback_short_fill", 0),
    )

    preview_count = min(5, len(truncated))
    logger.info("Top %s preview (title | channel | views):", preview_count)
    for idx, preview_payload in enumerate(truncated[:preview_count], start=1):
        logger.info(
            "#%s %s | %s | %s views",
            idx,
            preview_payload["title"],
            preview_payload["channel_title"],
            preview_payload["view_count"],
        )

    if dry_run:
        logger.info("Dry run enabled, skipping Supabase writes.")
        return

    serialized_videos = [_serialize_video(v) for v in truncated]
    supabase_client.upsert_videos(serialized_videos)
    ranking_list_id = supabase_client.insert_ranking_list(list_name, description)

    ranking_items = [
        {
            "ranking_list_id": ranking_list_id,
            "video_id": video_payload["youtube_id"],
            "position": idx,
            "score": video_payload["view_count"],
        }
        for idx, video_payload in enumerate(truncated, start=1)
    ]
    supabase_client.insert_ranking_items(ranking_items)

    logger.info("Persisted ranking list %s with %s entries", list_name, len(truncated))


def main() -> None:
    load_dotenv()
    args = parse_arguments()

    api_key = args.api_key or os.getenv("YOUTUBE_API_KEY")
    supabase_url = os.getenv("SUPABASE_URL")
    service_role_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

    if not api_key:
        raise RuntimeError("YouTube API key is required. Set YOUTUBE_API_KEY.")
    if not supabase_url:
        raise RuntimeError("SUPABASE_URL is required for Supabase REST writes.")
    if not service_role_key:
        raise RuntimeError("SUPABASE_SERVICE_ROLE_KEY is required for Supabase REST writes.")

    supabase_client = SupabaseRestClient(supabase_url, service_role_key)

    anchor = datetime.now(timezone.utc) - timedelta(days=args.days_offset)
    recent_threshold = anchor - timedelta(days=RECENT_DAYS)
    published_after = recent_threshold.strftime("%Y-%m-%dT%H:%M:%SZ")

    aggregated: "OrderedDict[str, None]" = OrderedDict()
    for query in args.queries:
        for video_id in fetch_search_ids(api_key, query, args.per_query, published_after):
            aggregated.setdefault(video_id, None)

    payload = RankingPayload(
        items=fetch_video_details(api_key, list(aggregated.keys())),
        generated_at=datetime.now(timezone.utc),
        queries=args.queries,
    )

    default_label_date = anchor.date()
    list_name = args.name or f"ASMR Weekly Pulse {default_label_date:%Y-%m-%d}"
    description = args.description or ""

    persist_ranking(
        supabase_client,
        payload,
        list_name,
        description,
        args.top,
        args.dry_run,
        recent_threshold,
    )


if __name__ == "__main__":
    main()
