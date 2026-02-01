# Backend (FastAPI + Supabase)

## Setup

1. Create a `.env` file (not tracked) with:
   ```
   DATABASE_URL=postgresql://postgres.ttejnvtklcmbgnetciej:<password>@aws-1-ca-central-1.pooler.supabase.com:5432/postgres
   SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
   YOUTUBE_API_KEY=<youtube-data-api-key>
   ```
2. Install dependencies:
   ```bash
   python3 -m pip install --user -r requirements.txt
   ```

3. Initialize the database (after creating `.env`):
   ```bash
   PYTHONPATH=. python3 -m alembic upgrade head
   ```

4. Run the app:
   ```bash
   uvicorn app.main:app --reload
   ```

## Structure

- `app/core/config.py`: loads settings from `.env`.
- `app/models/`: SQLAlchemy models for videos, ranking lists, ranking items, and community tags.
- `app/schemas/`: Pydantic schemas for API responses.
- `app/services/rankings.py`: queries the latest lists and transforms them into API payloads.
- `alembic/`: migrations; run `alembic revision --autogenerate -m "msg"`

## Data ingestion script

The file `backend/scripts/fetch_rankings.py` is the entry point for the weekly YouTube harvest that feeds the leaderboard:

- Reads the YouTube Data API key from `YOUTUBE_API_KEY` (fall back option: pass `--api-key`).
- Runs multiple search queries (`--queries`) and normalizes every returned video by title/tag/channel.
- Filters out noisy keywords (mukbang, magnetic ball, etc.), deduplicates, and stores both raw video metadata + the generated ranking list.
- Writes to Supabase via the same SQLAlchemy models (videos, ranking_lists, ranking_items) so the frontend can see fresh data.

Run it with something like:

```bash
PYTHONPATH=. python3 -m backend.scripts.fetch_rankings --dry-run
```

Remove `--dry-run` when you want to actually commit a new list. You can override defaults with `--per-query`, `--top`, `--name`, and `--description` to control how many videos are fetched and how the list is labeled.
