# TingleRadar

TingleRadar is an ASMR-focused discovery platform that curates weekly rankings, multilingual filters, and community signals around whisper, binaural, and no-talking content. The goal is to build on existing data sources (YouTube API, user tags) and create a web-native experience plus social automations (X bot, playlists).

## Architecture

- **Backend**: FastAPI + SQLAlchemy + Alembic, connecting to a Supabase (Postgres) database. Schemas cover videos, ranking lists, and user tags, while services expose ranking data for the frontend and automation scripts.
- **Database**: Supabase provides the Postgres instance + service role key that the backend uses for migrations and data ingestion.
- **Frontend**: Next.js receives ranking payloads from `/api/rankings/weekly`, renders leaderboard cards, and provides download/playlists export helpers.

See the individual `backend` and `frontend` README files for setup details.

## Environments

The project is designed to run in two modes:

- `product`: production /线上环境
- `test`: local development with both backend and frontend running on `localhost`

Environment selection is controlled via frontend environment variables and backend `.env`:

- Frontend (Next.js): see `frontend/README.md` for `NEXT_PUBLIC_TINGLE_ENV`, `NEXT_PUBLIC_BACKEND_URL`, and `NEXT_PUBLIC_BACKEND_URL_TEST`.
- Backend (FastAPI): configure database and API keys in `backend/.env` as described in `backend/README.md`.
