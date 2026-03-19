# Frontend UI Redesign Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the TingleRadar frontend into a calmer, mobile-first ASMR browsing experience without changing existing filtering behavior.

**Architecture:** Keep the current Next.js app structure and existing data flow, but centralize the new visual language in global CSS and shared utility classes. Update shared UI surfaces first, then re-theme home and browse around the same filter-first shell.

**Tech Stack:** Next.js 14, React 18, TypeScript, global CSS, existing inline-style-heavy components

---

## Chunk 1: Shared Visual Foundation

### Task 1: Add the design tokens and shell styles

**Files:**
- Modify: `frontend/src/app/globals.css`
- Modify: `frontend/src/app/layout.tsx`
- Modify: `frontend/src/app/NavBar.tsx`

- [ ] Step 1: Write a minimal verification target by choosing a visible shell change
- [ ] Step 2: Update global CSS with color tokens, background layers, shared shell classes, and responsive helpers
- [ ] Step 3: Rework layout and nav to use the shared shell instead of one-off inline page chrome
- [ ] Step 4: Verify the nav remains sticky and readable on mobile and desktop

## Chunk 2: Filter Surfaces and Shared Cards

### Task 2: Re-theme shared filter controls

**Files:**
- Modify: `frontend/src/components/FilterHeader.tsx`
- Modify: `frontend/src/components/FilterPanel.tsx`
- Modify: `frontend/src/app/browse/BrowseFilterClient.tsx`

- [ ] Step 1: Identify one concrete mobile-first filter behavior to preserve while changing visuals
- [ ] Step 2: Update filter header actions, section spacing, and chip appearance to fit the new calm-editorial system
- [ ] Step 3: Apply the same visual language to browse-specific filter wrappers and action buttons
- [ ] Step 4: Verify collapsed state, active counts, and apply/clear flows still work

### Task 3: Re-theme ranking cards

**Files:**
- Modify: `frontend/src/components/VideoCard.tsx`

- [ ] Step 1: Define the card-level states to preserve: default, active, editable, mobile-stacked
- [ ] Step 2: Update the card layout, text hierarchy, and action styling without changing data behavior
- [ ] Step 3: Verify the active inline-player state remains visible and readable

## Chunk 3: Page-Level Composition

### Task 4: Redesign the home page shell

**Files:**
- Modify: `frontend/src/app/page.tsx`
- Modify: `frontend/src/components/RankingExplorer.tsx`

- [ ] Step 1: Keep current fetch behavior and isolate visual restructuring to the rendered shell
- [ ] Step 2: Introduce a compact intro block and filter-first results composition
- [ ] Step 3: Rework playlist stats/actions into a cleaner summary row
- [ ] Step 4: Verify the home page still renders the latest ranking and player actions

### Task 5: Redesign the browse page shell

**Files:**
- Modify: `frontend/src/app/browse/page.tsx`

- [ ] Step 1: Reuse the same shell language as the home page
- [ ] Step 2: Recompose browse intro, filter surface, and pagination chrome
- [ ] Step 3: Verify browse keeps page navigation and result counts intact

## Chunk 4: Verification

### Task 6: Validate and document results

**Files:**
- No code files required unless fixes are needed

- [ ] Step 1: Run lint and build verification commands from `frontend/`
- [ ] Step 2: If build still fails because of the pre-existing environment issue, capture the exact failure and separate it from redesign work
- [ ] Step 3: Review the changed pages for mobile-first fit and consistent visual language
- [ ] Step 4: Commit the redesign work on the feature branch
