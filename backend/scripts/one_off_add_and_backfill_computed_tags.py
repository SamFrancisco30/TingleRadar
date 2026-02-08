"""One-off helper to add computed_tags column and backfill it.

This bypasses Alembic by:
1) Executing a raw ALTER TABLE ... ADD COLUMN IF NOT EXISTS.
2) Using the existing tagging rules to populate Video.computed_tags where NULL.

Safe to run multiple times; the ALTER uses IF NOT EXISTS and backfill only
updates rows with NULL computed_tags.
"""

import sys
from pathlib import Path

from sqlalchemy import create_engine, text

# Ensure `app` package is importable when running this script directly
ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from app.core.config import Settings  # type: ignore  # noqa: E402
from app.db.session import SessionLocal  # type: ignore  # noqa: E402
from app.models.video import Video  # type: ignore  # noqa: E402
from app.services.tagging import compute_tags_for_video  # type: ignore  # noqa: E402


def ensure_column() -> None:
    settings = Settings()
    engine = create_engine(settings.database_url)
    ddl = text("ALTER TABLE videos ADD COLUMN IF NOT EXISTS computed_tags JSON")
    with engine.begin() as conn:
        conn.execute(ddl)
    print("Ensured videos.computed_tags column exists")


def backfill() -> None:
    db = SessionLocal()
    try:
        videos = db.query(Video).filter(Video.computed_tags.is_(None)).all()
        print(f"Found {len(videos)} videos without computed_tags")
        for video in videos:
            tags = compute_tags_for_video(video)
            video.computed_tags = tags
            db.add(video)
        db.commit()
        print("Backfill complete")
    finally:
        db.close()


def main() -> None:
    ensure_column()
    backfill()


if __name__ == "__main__":
    main()
