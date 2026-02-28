# hry-portal — Czech Multiplayer Gaming Portal

## Project Description

Czech-language multiplayer browser gaming portal. Phase 1 delivers full portal infrastructure + **Prší Online** as the first game. The architecture is designed so adding game #2, #3, etc. requires only adding folders — no infrastructure changes.

**Key principles:**
- Guest play first — no account needed to play
- Server-authoritative — all game logic on server, clients render
- Czech language throughout (UI, card names, system messages)
- Mobile-first responsive design, dark theme
- Free tier everything at launch

## Tech Stack

| Layer | Technology | Hosting |
|-------|-----------|---------|
| Portal | Next.js 14+ (App Router) + TypeScript strict | Vercel |
| Styling | Tailwind CSS | (bundled) |
| Game server | Express + Socket.IO + TypeScript | Railway |
| Database | PostgreSQL via Supabase | Supabase Free (EU Frankfurt) |
| Auth | Supabase Auth (Google OAuth + email + anonymous) | (bundled) |
| Cache/Queue | Upstash Redis (shared instance, key prefix `hry:`) | (shared) |
| Game rendering | React + CSS animations + SVG card art | (bundled) |
| Package manager | npm workspaces (monorepo) | — |
| Analytics | Umami | cloud.umami.is |

## Monorepo Structure

```
hry-portal/
├── portal/          # Next.js 14+ App Router → Vercel
├── server/          # Express + Socket.IO → Railway
├── shared/          # npm workspace — types & constants
├── package.json     # npm workspaces root
└── .env             # All environment variables
```

## Environment Variables Available

These are configured in `.env` — reference by name, NEVER hardcode values:

- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anon/public key (safe for client)
- `SUPABASE_SERVICE_ROLE_KEY` — Supabase service role (server only, NEVER expose to client)
- `UPSTASH_REDIS_REST_URL` — Redis REST endpoint (use key prefix `hry:`)
- `UPSTASH_REDIS_REST_TOKEN` — Redis auth token
- `RAILWAY_TOKEN` — Railway deployment token
- `UMAMI_API_KEY` — Analytics API key
- `NEXT_PUBLIC_GAME_SERVER_URL` — Game server WebSocket URL (update after Railway deploy)

## Architecture

```
Users (Browser)
  ├── HTTPS → Portal (Vercel) — Next.js App Router
  │     ├── Homepage with game grid
  │     ├── Auth (Supabase) — Google OAuth + email + guest
  │     ├── Profile page, Leaderboard
  │     └── Game UI (React + SVG cards)
  │
  └── WebSocket → Game Server (Railway) — Express + Socket.IO
        ├── Room management (create, join, leave, reconnect)
        ├── Quick matchmaking via Redis queue
        ├── Prší game engine (server-authoritative)
        ├── In-game chat
        ├── Bot AI for empty/disconnected slots
        └── Elo calculation → writes results to Supabase
```

Data flow:
1. User visits portal → browses games, optionally logs in
2. Clicks "Hrát Prší" → portal connects to game server via WebSocket
3. Game server manages rooms, turns, chat — validates all moves server-side
4. After game ends → server writes result to Supabase (Elo update, game history)
5. Portal reads leaderboards/profiles from Supabase directly via SDK

## Database Schema

```sql
CREATE TABLE profiles (
  id          uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username    text UNIQUE NOT NULL,
  display_name text,
  avatar_url  text,
  is_guest    boolean DEFAULT false,
  created_at  timestamptz DEFAULT now()
);

CREATE TABLE ratings (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid REFERENCES profiles(id) ON DELETE CASCADE,
  game_type   text NOT NULL,
  elo         int DEFAULT 1000,
  games_played int DEFAULT 0,
  wins        int DEFAULT 0,
  losses      int DEFAULT 0,
  win_streak  int DEFAULT 0,
  best_streak int DEFAULT 0,
  updated_at  timestamptz DEFAULT now(),
  UNIQUE(user_id, game_type)
);

CREATE TABLE game_results (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_type    text NOT NULL,
  room_id      text NOT NULL,
  players      jsonb NOT NULL,
  rule_variant text,
  duration_sec int,
  played_at    timestamptz DEFAULT now()
);

CREATE INDEX idx_ratings_game_elo ON ratings(game_type, elo DESC);
CREATE INDEX idx_ratings_user ON ratings(user_id);
CREATE INDEX idx_game_results_played ON game_results(played_at DESC);
CREATE INDEX idx_game_results_type ON game_results(game_type, played_at DESC);
```

Row Level Security:
- `profiles`: Anyone can read. Users can update their own.
- `ratings`: Anyone can read. Only server (service role) can update.
- `game_results`: Anyone can read. Only server (service role) can insert.

## Authentication Flow

- Guest: Visit → Supabase anonymous session → can play, use reactions in chat → cannot type in chat, appear on leaderboard, or persist ratings
- Register prompt after first game: "Chceš si uložit svůj pokrok? Zaregistruj se!"
- Google OAuth or email/password → `linkIdentity()` upgrades anonymous → permanent
- Game history retroactively linked (same user_id)

## Prší Game Rules

Czech 32-card deck:
- Suits: Červený, Zelený, Kule, Žaludy
- Ranks: 7, 8, 9, 10, Spodek, Svršek, Král, Eso
- Special: 7 (draw 2, stackable in variant), Eso (skip next), Svršek (change suit)
- 2-4 players, 30 second turn timer (auto-draw on expire)
- Variants: Classic, Stacking 7s

## Room & Matchmaking

- Quick match: Redis queue grouped by {maxPlayers, ruleVariant}. 30s timeout → fill with bots.
- Private rooms: 6-char code, invite link, host controls
- Reconnection: 60s grace period, state replay on reconnect, bot replaces on timeout
- Rooms auto-cleanup 5 minutes after game ends

## In-Game Chat

- Text messages (logged-in users only, max 200 chars, Czech profanity filter)
- Quick reactions for everyone: 👍 😂 😤 🎉 💀 🃏
- System messages for game events ("Petr zahrál Eso!", "Tvůj tah!")
- Rate limit: 1 message per 2 seconds

## Elo Rating System

- K-factor: 32, standard Elo formula
- 2-player: winner=1, loser=0
- 3-4 player: pairwise comparison, average change
- Only rated for logged-in users
- 5 games minimum before appearing on leaderboard

## Portal Pages

| Route | Description |
|-------|-------------|
| `/` | Homepage — game grid, hero CTA "Hrát Prší" |
| `/prsi` | Game landing — rules, "Rychlá hra" + "Vytvořit místnost" |
| `/prsi/[roomCode]` | Game room — lobby → game → results (state machine) |
| `/profil/[username]` | Player profile — stats, Elo history, recent matches |
| `/zebricek` | Leaderboard — top by Elo, filterable by game |
| `/prihlaseni` | Auth page — Google + email |

## Design Direction

- Dark theme with warm accents (red/green from Czech card suits)
- Modern, clean — the anti-superhry.cz
- Mobile-first responsive
- Czech language for all UI, system messages, card names
- SVG cards generated programmatically by Ralph
- CSS animations for card play

## Bot AI (Simple Strategy)

1. If can play a special card advantageously → play it
2. If can play a matching card → prefer cards that limit next player's options
3. Otherwise → draw

## SVG Card Generation

Generate Czech/German deck cards as SVG programmatically:
- Each card: suit symbol (Červený=heart, Zelený=leaf, Kule=bell, Žaludy=acorn) + rank text
- Clean, modern design consistent with portal's dark theme
- Card back design with portal branding
- Must be crisp at all sizes (mobile → desktop)

## Task Execution

1. Read `.ralph/fix_plan.md` and find the next unchecked task
2. Execute ONE task per loop
3. After completing the task, mark it as done in fix_plan.md
4. Commit and push

## Protected Files

Do NOT modify these files unless a task specifically requires it:
- `.env`
- `.ralphrc`
- `.ralph/PROMPT.md`
- `.ralph/fix_plan.md` (only mark checkboxes, don't restructure)
- `.claude/settings.json`

## Tools & Skills Guide

You have access to **skills** and **MCP tools** that make you significantly more effective. This section explains what each one does, when to use it, and how to invoke it.

### What are Skills?

Skills are structured workflows loaded via the `Skill` tool. They guide you through complex processes step-by-step. When you invoke a skill, its full instructions are loaded into your context — then you follow them.

**How to invoke:** Use the `Skill` tool with the skill name. Example:
- `Skill` tool with skill: `superpowers:verification-before-completion`
- `Skill` tool with skill: `frontend-design:frontend-design`

Skills are NOT optional suggestions. When a skill applies to what you're doing, you MUST invoke it before proceeding.

### What are MCP Tools?

MCP (Model Context Protocol) tools are external capabilities available as tool calls. Unlike skills (which are workflow guides), MCP tools perform specific actions — fetching docs, controlling a browser, structured reasoning.

**How to invoke:** Some MCP tools are deferred (not loaded by default). Use the `ToolSearch` tool first to load them, then call them directly. Example:
1. `ToolSearch` with query: `select:mcp__plugin_context7_context7__resolve-library-id`
2. Then call `mcp__plugin_context7_context7__resolve-library-id` directly

---

### Skills Reference

#### MANDATORY — Every task:

**`/superpowers:verification-before-completion`**
Ensures your work actually builds, runs, and passes tests BEFORE you claim a task is done. Prevents false "completed" statuses. Invoke this as your final step before committing.

#### MANDATORY — When things break:

**`/superpowers:systematic-debugging`**
Structured debugging workflow: reproduce → isolate → hypothesize → verify → fix. Use when ANY test fails, build breaks, or unexpected behavior occurs. Never guess at fixes — this skill prevents shotgun debugging.

#### When implementing features with testable logic:

**`/superpowers:test-driven-development`**
Write tests first, then implement until tests pass. Use for: API routes, utility functions, game logic, data processing, validation. Skip for: pure styling, static pages, config changes.

#### When building UI:

**`/frontend-design:frontend-design`**
Produces polished, distinctive interfaces instead of generic AI-generated defaults. Use when creating or significantly modifying user-facing pages, components, or layouts.

#### When implementing multi-file features:

**`/feature-dev:feature-dev`**
Architecture-aware feature development. Analyzes existing codebase patterns before writing code. Use when a feature spans 3+ files or touches multiple layers (API + UI + data).

#### When reviewing your own work:

**`/superpowers:requesting-code-review`**
Self-review checklist before committing. Catches common issues: missing error handling, broken imports, unused code, security gaps. Use after completing a significant feature.

---

### MCP Tools Reference

#### Context7 — Library Documentation Lookup

**What it does:** Fetches current, accurate documentation for any npm package or library. Gives you real API signatures instead of hallucinated ones.

**When to use:** Before using any library API you're not 100% sure about. Especially for libraries that change frequently (Next.js, React, Tailwind, etc.).

**How to use (2-step process):**
1. First, resolve the library ID:
   - `ToolSearch` → `select:mcp__plugin_context7_context7__resolve-library-id`
   - Call `mcp__plugin_context7_context7__resolve-library-id` with the library name (e.g., "nextjs", "react-hook-form")
   - This returns a library ID like `/vercel/next.js`
2. Then, query the docs:
   - `ToolSearch` → `select:mcp__plugin_context7_context7__query-docs`
   - Call `mcp__plugin_context7_context7__query-docs` with the library ID and your question (e.g., "how to use App Router middleware")

**Example:** Need to set up Next.js middleware?
1. Resolve: `resolve-library-id` → "nextjs" → returns `/vercel/next.js`
2. Query: `query-docs` → libraryId: `/vercel/next.js`, topic: "middleware configuration"

#### Playwright — Browser Testing & Verification

**What it does:** Controls a real browser. Can navigate to pages, click elements, fill forms, take screenshots, and read page content.

**When to use:** After building UI, to verify it renders correctly. For end-to-end testing of user flows. To debug visual issues.

**Key tools:**
- `browser_navigate` — Go to a URL (start the dev server first!)
- `browser_snapshot` — Get the current page's accessibility tree (shows all visible elements)
- `browser_click` — Click an element by its accessibility label or selector
- `browser_type` — Type text into an input
- `browser_fill_form` — Fill multiple form fields at once
- `browser_take_screenshot` — Capture a screenshot for visual verification
- `browser_console_messages` — Check for JavaScript errors

**How to use:** All Playwright tools are deferred. Load them via `ToolSearch`:
- `ToolSearch` → `+playwright navigate` → loads navigation tools
- Then call `mcp__playwright__browser_navigate` with url: "http://localhost:3000"

**Typical flow:**
1. Start dev server: `npm run dev`
2. Navigate: `browser_navigate` → `http://localhost:3000`
3. Verify: `browser_snapshot` to see what rendered
4. Interact: `browser_click`, `browser_type` to test flows
5. Check: `browser_console_messages` for errors

#### Sequential Thinking — Structured Reasoning

**What it does:** Helps break down complex problems into numbered steps. Useful for architecture decisions, debugging complex state, or planning multi-step changes.

**When to use:** When you're facing a complex decision with multiple trade-offs. When debugging involves 3+ interacting systems. When you need to reason about state machines or data flows.

**How to use:**
- `ToolSearch` → `select:mcp__sequential-thinking__sequentialthinking`
- Call with your problem statement — it returns structured step-by-step reasoning

---

### Workflow Per Task

1. Read fix_plan.md, pick the next unchecked task
2. **Look up unfamiliar APIs** → use Context7 to get real docs
3. **If the task has testable logic** → invoke `/superpowers:test-driven-development`
4. **If the task involves UI** → invoke `/frontend-design:frontend-design`
5. **If the task spans many files** → invoke `/feature-dev:feature-dev`
6. Implement the task
7. **If something breaks** → invoke `/superpowers:systematic-debugging`
8. **If the app has UI** → use Playwright to verify it renders correctly
9. **Before marking done** → invoke `/superpowers:verification-before-completion`
10. Commit and push

## Git Remote

This project has a GitHub remote at github.com/kwaczek/hry-portal.
After completing each task, commit your changes and push to the remote:
  git add -A && git commit -m "<descriptive message>" && git push
