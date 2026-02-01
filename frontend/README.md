# Frontend (Next.js)

This is the UI that displays TingleRadar's weekly leaderboards. It runs fully on the static side and reads directly from Supabase, so you only need to deploy the frontend (e.g., Vercel) while the backend ingestion script continues to write data into Supabase.

## Setup

1. Copy `.env.example` to `.env.local` and provide the following values:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
   ```
   You can also leave `NEXT_PUBLIC_API_URL` empty since the UI now reads Supabase directly.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the dev server:
   ```bash
   npm run dev
   ```

## Deployment

- Point Vercel's root directory to the `frontend` folder. Set the build command to `npm run build` and output directory to `.next`.
- Configure environment variables on Vercel as described above. Once the build completes, the site will fetch the latest rankings from Supabase.
