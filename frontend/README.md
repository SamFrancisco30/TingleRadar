# Frontend (Next.js)

The frontend is built with Next.js (app router) and consumes the FastAPI backend via `/api/rankings/weekly`. It renders leaderboard cards and links to the sourced YouTube videos.

## Setup

1. Copy `.env.example` to `.env.local` and provide the API endpoint + Supabase anonymous keys as needed.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the dev server:
   ```bash
   npm run dev
   ```
