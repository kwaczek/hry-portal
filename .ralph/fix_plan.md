# hry-portal — Implementation Plan

## Phase 1: Project Scaffolding & Monorepo Setup

- [x] **1.1** Initialize npm workspaces monorepo — root `package.json` with `workspaces: ["portal", "server", "shared"]`, root `tsconfig.json` with strict mode, shared path aliases
- [x] **1.2** Scaffold `shared/` workspace — `package.json`, `tsconfig.json`, `types.ts` (Card, Suit, Rank, GameState, PrsiPlayer, SocketEvents, RoomConfig, ChatMessage types), `constants.ts` (suits, ranks, Elo K-factor, turn timer, limits)
- [x] **1.3** Scaffold `portal/` workspace — `npx create-next-app@latest` with App Router, TypeScript strict, Tailwind CSS, ESLint. Wire up shared workspace dependency. Create folder structure: `app/`, `components/ui/`, `components/layout/`, `components/auth/`, `components/game/`, `games/prsi/`, `lib/`, `hooks/`
- [x] **1.4** Scaffold `server/` workspace — Express + Socket.IO + TypeScript setup. `package.json` with dev/build scripts (tsx for dev, tsc for build). Create folder structure: `src/index.ts`, `src/rooms/`, `src/services/`, `src/middleware/`. Wire up shared workspace dependency
- [x] **1.5** Create `.env.example` in project root with all variable names (no values). Add root-level `npm run dev` script that runs portal + server concurrently
- [x] **1.6** Verify monorepo builds — run `npm install` from root, ensure `npm run build` succeeds for all workspaces, commit

## Phase 2: Database & Auth Foundation

- [x] **2.1** Create Supabase schema migration — write SQL file with `profiles`, `ratings`, `game_results` tables, indexes, and RLS policies as specified in PROMPT.md. Execute via Supabase SQL editor instructions in a comment, or use Supabase CLI if available
- [x] **2.2** Set up Supabase client in portal — `lib/supabase/client.ts` (browser client using NEXT_PUBLIC vars), `lib/supabase/server.ts` (server-side client for API routes). Install `@supabase/supabase-js` and `@supabase/ssr`
- [x] **2.3** Set up Supabase service client in game server — `server/src/services/supabase.ts` using `SUPABASE_SERVICE_ROLE_KEY` for writing game results and updating ratings. NEVER expose service role key to clients
- [x] **2.4** Implement auth provider in portal — `components/auth/AuthProvider.tsx` wrapping the app with Supabase session management. `hooks/useAuth.ts` returning user, session, loading state, login/logout functions
- [x] **2.5** Implement login page `/prihlaseni` — Google OAuth button + email/password form using Supabase Auth UI. Redirect back to previous page after login. Czech labels throughout
- [x] **2.6** Implement anonymous session — auto-create Supabase anonymous session on first visit if not logged in. Create guest profile row. `is_guest: true`
- [x] **2.7** Implement guest-to-permanent upgrade flow — after first game, show prompt "Chceš si uložit svůj pokrok? Zaregistruj se!" Use `linkIdentity()` to upgrade anonymous → permanent account. Verify game history stays linked (same user_id)
- [x] **2.8** Add auth middleware on game server — `server/src/middleware/auth.ts` that verifies Supabase JWT from Socket.IO handshake. Extract user_id and is_guest flag. Allow anonymous tokens for guest play

## Phase 3: Shared Types & Game Engine

- [x] **3.1** Define complete Prší types in `shared/types.ts` — Card, Suit, Rank, PrsiGameState, PrsiPlayer, PrsiAction (play/draw), PrsiRuleVariant, GamePhase (waiting/playing/finished), all Socket.IO event types (client→server, server→client), RoomConfig, ChatMessage, GameResult, EloChange
- [x] **3.2** Define constants in `shared/constants.ts` — full Czech deck (32 cards), suit names in Czech, rank names in Czech, ELO_K_FACTOR=32, TURN_TIMER_SECONDS=30, MAX_PLAYERS=4, MIN_PLAYERS=2, RECONNECT_GRACE_SECONDS=60, ROOM_CODE_LENGTH=6, CHAT_RATE_LIMIT_MS=2000, CHAT_MAX_LENGTH=200, QUICK_REACTIONS array
- [x] **3.3** Implement `server/src/rooms/prsi/PrsiEngine.ts` — pure game logic class (no Socket.IO dependency). Methods: `createGame()`, `dealCards()`, `playCard(playerId, card)`, `drawCard(playerId)`, `validateMove(card)`, `checkWin()`, `getPlayerView(playerId)` (hides other hands), `nextTurn()`. Handle special cards: 7 (draw 2), Eso (skip), Svršek (suit change). Handle both Classic and Stacking variants
- [x] **3.4** Write unit tests for PrsiEngine — test: valid/invalid moves, special card effects, stacking 7s, suit override from Svršek, win condition (empty hand), deck reshuffling when draw pile empty, turn rotation, 2/3/4 player games
- [x] **3.5** Implement `server/src/rooms/prsi/PrsiBot.ts` — simple AI: prioritize special cards when advantageous, then matching cards (prefer cards that limit next player), then draw. Must work with PrsiEngine's public API

## Phase 4: Room & Matchmaking System

- [x] **4.1** Implement `server/src/rooms/RoomManager.ts` — Room CRUD with Map<roomCode, Room>. Methods: `createRoom(config)`, `joinRoom(code, player)`, `leaveRoom(code, playerId)`, `getRoom(code)`, `listRooms()`, `cleanupStaleRooms()`. Generate 6-char alphanumeric room codes. Auto-cleanup 5 min after game ends
- [x] **4.2** Implement `server/src/rooms/prsi/PrsiRoom.ts` — Socket.IO event handlers for a Prší room. Lifecycle: LOBBY → PLAYING → FINISHED. Handle: player join/leave, ready toggle, host start game, game actions (play/draw), suit selection (after Svršek), reconnection within 60s grace, bot replacement on timeout. Emit state updates to all clients (each player gets their own view via `getPlayerView`)
- [x] **4.3** Implement matchmaking service — `server/src/services/matchmaking.ts` using Upstash Redis (key prefix `hry:match:`). Queue players by {maxPlayers, ruleVariant}. When enough players → create room, connect all. 30s timeout → create room with bots filling remaining slots. Clean up stale queue entries
- [x] **4.4** Implement turn timer — 30 second countdown per turn. Server-side timer (not client). On expire: auto-draw for current player, advance turn. Broadcast timer ticks to clients. Pause timer during reconnection grace period
- [x] **4.5** Publish active rooms to Redis — `hry:rooms:active` sorted set with room metadata. Portal can read this to show "active games" count. Update on room create/destroy
- [x] **4.6** Wire up main Socket.IO server — `server/src/index.ts` with Express + Socket.IO, CORS config for portal URL, auth middleware on connection, route socket events to RoomManager/PrsiRoom. Health check endpoint at `/health`

## Phase 5: Elo & Game Results

- [x] **5.1** Implement Elo service — `server/src/services/elo.ts`. Standard formula: Ea = 1 / (1 + 10^((Rb - Ra) / 400)), new = old + K*(S - E). K=32. For 2-player: winner S=1, loser S=0. For 3-4 player: pairwise comparison, average change. Only for logged-in (non-guest) users
- [x] **5.2** Implement game result writing — after game ends, server writes to Supabase: insert `game_results` row, update `ratings` table (elo, games_played, wins/losses, streaks). Use service role key. Transaction for atomicity
- [x] **5.3** Write unit tests for Elo calculation — test: 2-player (equal, unequal ratings), 3-4 player, guest exclusion, streak tracking

## Phase 6: In-Game Chat

- [x] **6.1** Implement chat system in PrsiRoom — handle `chat:message` and `chat:reaction` socket events. Text messages: logged-in users only, max 200 chars, rate limit 1 per 2s. Reactions: everyone, from predefined set (👍 😂 😤 🎉 💀 🃏). System messages for game events. Broadcast to room
- [x] **6.2** Implement Czech profanity filter — `server/src/services/profanity.ts`. Basic Czech word list. Simple substring/regex check. Filter text messages before broadcast. No moderation tools in Phase 1

## Phase 7: Portal UI — Layout & Navigation

- [x] **7.1** Design and implement root layout — `portal/app/layout.tsx`. Dark theme (dark background, warm accents from Czech card suits — red #c41e3a, green #2d5016). Global nav: logo "Hry.cz" (or portal name), nav links (Hry, Žebříček, Profil), auth button (login/avatar). Mobile hamburger menu. Czech language meta tags. Wrap with AuthProvider
- [x] **7.2** Implement shared UI primitives — `components/ui/`: Button (primary/secondary/ghost variants), Card (container), Modal (dialog), Input, Badge, Avatar, Spinner. All using Tailwind, dark theme, consistent design language
- [x] **7.3** Implement homepage `/` — game grid showing Prší card (playable, with player count badge) + 2-3 "Připravujeme" placeholder cards for future games. Hero section with CTA "Hrát Prší". Brief portal description. Mobile-first responsive grid

## Phase 8: Portal UI — Prší Game Pages

- [x] **8.1** Generate SVG card assets — programmatic SVG generation for all 32 Czech deck cards + card back. Suits: Červený (heart shape, red), Zelený (leaf shape, green), Kule (bell shape, yellow/gold), Žaludy (acorn shape, brown). Rank text in center. Clean, modern design. Card back with portal branding pattern. Export as React components or inline SVG
- [x] **8.2** Implement `PrsiCard.tsx` component — single card display using generated SVGs. Props: card data, face up/down, selected state, playable state (glow/highlight), size variant (sm/md/lg). CSS transitions for flip, play, draw animations
- [x] **8.3** Implement `PrsiHand.tsx` component — player's hand with fan/arc layout on mobile, horizontal spread on desktop. Cards are selectable (tap to select, tap again to play). Highlight playable cards. Responsive — works from 1 card to 15+ cards
- [x] **8.4** Implement `PrsiTable.tsx` component — game table center: discard pile (top card visible + count), draw deck (click to draw + count), opponent hand areas (card backs + count, arranged around table). Current player indicator. Suit override indicator when active
- [x] **8.5** Implement `PrsiSuitPicker.tsx` — modal that appears after playing Svršek. Four large suit buttons with Czech names. Must pick before turn ends. Auto-pick random suit if timer expires during picker
- [x] **8.6** Implement `PrsiResults.tsx` — end-of-game screen: placements (1st, 2nd, etc.), Elo changes per player (if rated), game duration, "Hrát znovu" (rematch in same room) + "Zpět do lobby" buttons
- [x] **8.7** Implement `PrsiGame.tsx` — main game state machine component. States: LOBBY, PLAYING, FINISHED. Connects to game server via Socket.IO. Receives state updates, dispatches player actions. Composes PrsiTable, PrsiHand, PrsiSuitPicker, PrsiResults. Handles reconnection UI ("Připojování...")

## Phase 9: Portal UI — Lobby & Room System

- [x] **9.1** Set up Socket.IO client — `lib/socket.ts`: singleton connection manager. `hooks/useSocket.ts`: connection state, auto-reconnect. `hooks/useGame.ts`: game state from server, action dispatchers (playCard, drawCard, sendChat). Pass Supabase JWT in handshake auth
- [x] **9.2** Implement Prší landing page `/prsi` — game description + rules (Czech), how-to-play section, "Rychlá hra" button (quick match), "Vytvořit místnost" button (private room), mini leaderboard (top 5 by Elo). Responsive layout
- [x] **9.3** Implement lobby UI in `/prsi/[roomCode]` — before game starts: room code display + share/copy button, player list with ready status, room settings (maxPlayers, ruleVariant) editable by host, "Připraven" toggle button, host "Začít hru" button (enabled when all ready or can fill with bots). Invite link generation
- [x] **9.4** Implement in-game chat UI — `components/game/Chat.tsx`: message list (text + reactions + system messages), text input (logged-in only, with character counter), reaction bar (quick emoji buttons). Compact sidebar on desktop, bottom drawer on mobile. Distinguishes message types visually

## Phase 10: Portal UI — Profiles & Leaderboard

- [x] **10.1** Implement profile page `/profil/[username]` — avatar, display name, member since date. Per-game stats section: Elo rating, games played, win rate, current streak, best streak. Recent matches list (opponent, result, Elo change, date). Fetch from Supabase directly
- [x] **10.2** Implement leaderboard page `/zebricek` — top players table: rank, avatar, username, Elo, games played, win rate. Filterable by game type (only Prší for now). Paginated (25 per page). Only shows players with 5+ games. Fetch from Supabase with proper indexes
- [x] **10.3** Implement profile editing — logged-in users can edit: display name, username (unique check). Avatar from Google account or default generated avatar. Settings accessible from nav dropdown

## Phase 11: Integration & Polish

- [x] **11.1** End-to-end integration test — manually test full flow: visit portal → click Rychlá hra → matchmaking → lobby → play full Prší game with 2 browser tabs → game ends → check Elo updated → check game in history → check leaderboard. Fix any issues found
- [x] **11.2** Add Umami analytics — add Umami tracking script to portal layout. Track: page views, game starts, game completions, registrations. Website ID from environment variable
- [x] **11.3** Error handling & edge cases — handle: server disconnect during game (reconnection UI), room not found (redirect to /prsi), auth token expiry (auto-refresh), full room (show error), concurrent actions (debounce), empty matchmaking (bot fill)
- [x] **11.4** Loading states & skeletons — add loading skeletons for: profile page, leaderboard, game room (connecting...), matchmaking ("Hledám soupeře..."). Spinner for actions in progress
- [x] **11.5** SEO & meta tags — Czech language meta tags, Open Graph tags for social sharing (game screenshots), proper page titles per route, favicon

## Phase 12: Deployment

- [x] **12.1** Deploy game server to Railway — configure `server/` with build command, start command, environment variables (Supabase service key, Redis, PORT). Verify WebSocket connections work. Get Railway URL → update `NEXT_PUBLIC_GAME_SERVER_URL` in portal env
- [x] **12.2** Deploy portal to Vercel — connect GitHub repo, configure root directory to `portal/`, set environment variables. Verify build succeeds, auth flow works, Socket.IO connects to Railway server
- [x] **12.3** Smoke test production — test full flow on deployed URLs: auth, quick match, private room, gameplay, chat, results, profile, leaderboard. Verify CORS, WebSocket, and Supabase connections all work in production
- [x] **12.4** Update .env with production URLs — set `NEXT_PUBLIC_GAME_SERVER_URL` to Railway production URL. Redeploy portal if needed
