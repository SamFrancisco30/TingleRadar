# CI

- Vercel: auto-deploys from main.

## Weekly ranking worker (GitHub Actions)

A scheduled worker is configured at `.github/workflows/weekly-rankings.yml`.

- Schedule: every Monday at 09:00 UTC
- Manual run: Actions -> Weekly Rankings Worker -> Run workflow

Required GitHub repository secrets:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `YOUTUBE_API_KEY`

The worker runs:

```bash
cd backend
PYTHONPATH=. python -m scripts.fetch_rankings --top 100 --per-query 20
```
