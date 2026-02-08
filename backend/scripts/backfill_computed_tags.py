"""Backfill computed_tags for existing videos.

This script computes computed_tags for any Video rows where the
computed_tags column is NULL, using the same rules engine as the
weekly rankings and browse endpoints.

Usage:
  poetry run python backend/scripts/backfill_computed_tags.py
  # 或者在已激活的虚拟环境中：
  cd backend && python scripts/backfill_computed_tags.py
"""

from app.db.session import SessionLocal
from app.models.video import Video
from app.services.tagging import compute_tags_for_video


def main() -> None:
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


if __name__ == "__main__":
    main()
