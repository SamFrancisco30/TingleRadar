# Frontend UI Redesign Design

**Date:** 2026-03-19

## Goal

Redesign the TingleRadar frontend around a calmer, eye-friendly ASMR mood while making filtering faster to use, especially on mobile.

## Direction

The chosen direction is `Calm Editorial` with a light `Ambient` treatment:

- Non-white, non-pure-black surfaces
- Low-glare contrast and softer accent colors
- Filter-first information architecture
- Mobile-first layout with desktop scaling up cleanly
- More deliberate typography and card spacing

## Visual System

### Color

- Background: deep blue-gray and moss-tinted charcoal rather than flat black
- Surface: layered translucent panels with subtle borders
- Accent: muted mist green for active states, pale silver-blue for supportive highlights
- Text: warm off-white for headings, softened slate for metadata

### Typography

- Headings should feel editorial, not dashboard-heavy
- Uppercase micro-labels remain, but with softer spacing and less neon contrast
- Metadata should read quieter than titles and not compete with thumbnails

### Motion and Atmosphere

- Small transitions for chips, cards, and hover states
- No flashy animations or glowing effects
- Background should use soft radial gradients to imply an ambient listening environment

## Layout

### Global Shell

- Keep a sticky top navigation
- Redesign the nav into a calmer glass panel with a stronger brand wordmark and clearer active state
- Use a shared page shell so home and browse feel like one product

### Home Page

- Replace the current large empty intro with a compact editorial intro block
- Put the filter module near the top of the page
- Keep the weekly ranking list as the primary result area
- Add a compact “results context” row for playlist size and actions

### Browse Page

- Match the same shell and visual language as the home page
- Keep filtering at the top and preserve current functionality
- Make filter controls easier to scan on mobile by grouping sections into softer content blocks

## Components

### Filter Header and Panel

- Turn the filter container into a higher-value control surface
- Improve the hierarchy between section labels, chip groups, and utility actions
- Make the collapsed state feel intentional on mobile, with active-count visibility preserved

### Video Cards

- Increase polish with larger radius, softer shadows, and quieter metadata
- Make the active/playing state visible without harsh saturation
- Improve chip styling so tags feel calm and tactile instead of generic pills

### Playlist and Utility Actions

- Group actions more clearly and align them with the filter-first workflow
- On mobile, keep action controls compact and easy to tap

## Mobile Priorities

- Mobile is the stricter target
- The filter panel must remain usable without taking over the entire page
- Cards should avoid cramped metadata lines and maintain readable tap targets
- Sticky/inline player behavior should still feel anchored and not visually clash with the redesigned surfaces

## Risks

- Shared components are used by both home and browse; visual changes must not reduce clarity on either page
- A stronger visual system can expose places where inline styles are duplicated and inconsistent
- Build verification may be noisy because the worktree currently has an environment issue with `next` command resolution

## Testing Expectations

- Verify the frontend still builds or document the pre-existing environment issue clearly
- Validate mobile layout behavior for filter collapse, card stacking, and sticky player placement
- Confirm home and browse both preserve existing filtering behavior
