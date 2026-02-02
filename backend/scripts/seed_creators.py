"""Seed initial ASMR creator watchlist entries.

Run with:

    PYTHONPATH=backend python -m backend.scripts.seed_creators
"""

from app.db.session import SessionLocal
from app.models import CreatorWatchlist


SEED_CREATORS = [
    {
        "channel_id": "UCE6acMV3m35znLcf0JGNn7Q",
        "channel_title": "Gibi ASMR",
        "note": "EN · top-tier whisper / roleplay",
        "priority": 2,
    },
    {
        "channel_id": "UClqNSqnWeOOUVkzcJFj4rBw",
        "channel_title": "Tingting ASMR",
        "note": "CN/EN · spa / roleplay",
        "priority": 2,
    },
    {
        "channel_id": "UC6gLlIAnzg7eJ8VuXDCZ_vg",
        "channel_title": "Gentle Whispering",
        "note": "EN · classic pioneer",
        "priority": 2,
    },
    {
        "channel_id": "UCFmL725KKPx2URVPvH3Gp8w",
        "channel_title": "ASMR Glow",
        "note": "EN · makeup / soft spoken",
        "priority": 1,
    },
    {
        "channel_id": "UCzGEGjOCbgv9z9SF71QyI7g",
        "channel_title": "ASMR Zeitgeist",
        "note": "DE/EN · high-production experimental",
        "priority": 2,
    },
    {
        "channel_id": "UCikebqFWoT3QC9axUbXCPYw",
        "channel_title": "ASMR Darling",
        "note": "EN · early big channel",
        "priority": 1,
    },
    {
        "channel_id": "UCQe2Y7V-C9bNMAcCJCBvzQQ",
        "channel_title": "Latte ASMR",
        "note": "KR · nurse / haircut roleplays",
        "priority": 2,
    },
    {
        "channel_id": "UC2nyigZS5YNDrCu_pih809w",
        "channel_title": "WhispersRed ASMR",
        "note": "EN · UK-based, sound therapy background",
        "priority": 1,
    },
]


def main() -> None:
    session = SessionLocal()
    try:
        for payload in SEED_CREATORS:
            existing = (
                session.query(CreatorWatchlist)
                .filter(CreatorWatchlist.channel_id == payload["channel_id"])
                .first()
            )
            if existing:
                # Keep any manual edits, just ensure it's active.
                existing.is_active = True
                existing.priority = payload.get("priority", existing.priority)
            else:
                session.add(CreatorWatchlist(is_active=True, **payload))
        session.commit()
    finally:
        session.close()


if __name__ == "__main__":  # pragma: no cover
    main()
