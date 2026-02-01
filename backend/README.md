# Backend (FastAPI + Supabase)

## Setup

1. Create a `.env` file (not tracked) with:
   ```
   DATABASE_URL=postgresql://postgres.ttejnvtklcmbgnetciej:<password>@aws-1-ca-central-1.pooler.supabase.com:5432/postgres
   SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
   ```
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Initialize the database (after creating `.env`):
   ```bash
   alembic upgrade head
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
