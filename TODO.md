# TingleRadar TODO

> High-level tasks and next steps, beyond the already-implemented tag feedback + inline player UX.

## 1. Filter & Tag System (see TODO_FILTER_REFACTOR.md)
- [ ] Implement remaining parts of the filter refactor in `RankingExplorer`:
  - [ ] Talking Style filter block (whisper / soft spoken / no talking) with multi-select state.
  - [ ] Trigger Type multi-select using `triggerFilters: string[]`.
  - [ ] Language multi-select (`languageFilters: string[]`).
  - [ ] Roleplay scenes sub-filter when `roleplay` is selected (`roleplayScenes: string[]`).
  - [ ] Ensure the overall filtering is AND-of-ORs: duration ∧ triggers ∧ talking style ∧ language ∧ roleplay scenes.
- [ ] Keep `TODO_FILTER_REFACTOR.md` in sync as the refactor lands.

## 2. Tag Feedback & Votes
- [x] Card-level tag feedback menu + batch downvote via "Done".
- [ ] Extend feedback to also support positive / upvote flows in UI (not just downvotes).
- [ ] Add minimal in-UI affordance for "feedback recorded" (e.g., very subtle flash / toast) without being noisy.

## 3. Video Detail & Playback UX
- [x] Explicit inline play trigger (`▶` icon) instead of whole-card click.
- [ ] Consider a dedicated video detail view or drawer (more metadata, tag history, votes) instead of relying only on the list card.
- [ ] Explore keyboard navigation for inline playlist (next / prev, focus handling).

## 4. Backend: Tag Votes & Rankings
- [x] `POST /videos/{video_id}/tags/{tag}/vote` endpoint wired to store anonymous per-fingerprint votes.
- [ ] Add aggregation views / queries to surface tag-quality metrics into the ranking logic.
- [ ] Feed tag vote signals back into future weekly rankings (e.g., demote videos with consistently bad tags for many users).

## 5. Observability / Admin
- [ ] Add a very basic admin/debug page showing:
  - Latest weekly ranking payloads.
  - Recent tag votes (aggregated, anonymized).
  - Basic health info (backend URL, env, last ingestion time).

## 6. Polish & Mobile UX
- [x] Move tag feedback entry to bottom-right menu, keep the top of the card clean.
- [x] Make inline player opt-in via explicit `▶` control, not whole-card click.
- [ ] Revisit font sizes / spacing on small screens once more filters are visible.

## 7. Weekly Rankings: API & Performance
- [x] Change backend `fetch_weekly_rankings` to return only the latest weekly list (keep older ones in DB for history).
- [x] Update frontend `HomePage` + `RankingExplorer` to only display the latest week (drop week selector UI).
- [x] Switch Weekly page fetch to ISR (`next: { revalidate: 300 }`) instead of `cache: "no-store"`.
- [ ] Confirm ingestion/cron uses `--top 100` (or equivalent) for weekly rankings so each board has 100 entries instead of 60.
- [ ] Add a lightweight loading or transition affordance when navigating between `Weekly` and `Browse` (e.g., subtle skeleton or shimmer) so it never feels like the nav click was ignored.
- [ ] Consider a separate internal/analytics path for exploring older weekly lists in the future (no front-page exposure).

---

This file is intentionally high-level. As tasks are implemented, check them off and, if needed, break them down into more granular TODOs in dedicated files (e.g., `TODO_FILTER_REFACTOR.md`, `backend/TODO.md`, `frontend/TODO.md`).
