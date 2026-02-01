# Backend (FastAPI + Supabase)

## Setup

1. Create a `.env` file (not tracked) with:
   ```
   DATABASE_URL=postgresql://postgres.ttejnvtklcmbgnetciej:<password>@aws-1-ca-central-1.pooler.supabase.com:5432/postgres
   SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
   YOUTUBE_API_KEY=<youtube-data-api-key>
   YOUTUBE_CLIENT_ID=<youtube-oauth-client-id>
   YOUTUBE_CLIENT_SECRET=<youtube-oauth-client-secret>
   YOUTUBE_OAUTH_REDIRECT=<your-app-url>/api/auth/youtube/callback
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
- Runs multiple search queries (`--queries`) limited to the last `RECENT_DAYS` (default 7) and excludes any video shorter than two minutes, so the ranking focuses on recent, fuller ASMR uploads; future playlist columns can relax those constraints if you want to highlight shorts or archive hits.
- Normalizes each video by title/tag/channel, filters out noisy keywords (mukbang, magnetic ball, etc.), deduplicates, and stores both raw video metadata + the generated ranking list. Score is still recorded as the view count for historical continuity, but the front-end now displays raw Views/Likes, so you don’t need to interpret a separate score value.
- Writes to Supabase via the same SQLAlchemy models (videos, ranking_lists, ranking_items) so the frontend can see fresh data.

Run it with something like:

```bash
PYTHONPATH=. python3 -m backend.scripts.fetch_rankings --dry-run
```

Remove `--dry-run` when you want to actually commit a new list. You can override defaults with `--per-query`, `--top`, `--name`, and `--description` to control how many videos are fetched and how the list is labeled.
