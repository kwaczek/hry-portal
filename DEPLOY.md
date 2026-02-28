# Deployment Guide — hry-portal

## Prerequisites

- GitHub repo: `github.com/kwaczek/hry-portal`
- Supabase project with schema applied (see `CLAUDE.md`)
- Upstash Redis instance with `hry:` key prefix
- Railway account
- Vercel account

## Step 1: Deploy Game Server to Railway

1. Go to [Railway](https://railway.app) → New Project → Deploy from GitHub repo
2. Select `kwaczek/hry-portal` repository
3. Railway will detect `railway.toml` — build/start commands are preconfigured
4. Set environment variables in Railway dashboard:

   | Variable | Value |
   |----------|-------|
   | `SUPABASE_SERVICE_ROLE_KEY` | From Supabase dashboard |
   | `NEXT_PUBLIC_SUPABASE_URL` | From Supabase dashboard |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | From Supabase dashboard |
   | `UPSTASH_REDIS_REST_URL` | From Upstash dashboard |
   | `UPSTASH_REDIS_REST_TOKEN` | From Upstash dashboard |
   | `PORTAL_URL` | Vercel production URL (update after Step 2) |
   | `PORT` | Railway sets this automatically |

5. Deploy → wait for health check at `/health` to pass
6. Copy the Railway public URL (e.g., `https://hry-portal-production.up.railway.app`)

## Step 2: Deploy Portal to Vercel

1. Go to [Vercel](https://vercel.com) → Import Git Repository → `kwaczek/hry-portal`
2. Vercel will detect `vercel.json` — build commands are preconfigured
3. Set environment variables in Vercel dashboard:

   | Variable | Value |
   |----------|-------|
   | `NEXT_PUBLIC_SUPABASE_URL` | From Supabase dashboard |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | From Supabase dashboard |
   | `NEXT_PUBLIC_GAME_SERVER_URL` | Railway URL from Step 1 |
   | `NEXT_PUBLIC_SITE_URL` | Vercel production URL |
   | `NEXT_PUBLIC_UMAMI_WEBSITE_ID` | From Umami dashboard (optional) |

4. Deploy → wait for build to succeed
5. Copy the Vercel production URL

## Step 3: Update CORS

1. Go back to Railway dashboard
2. Update `PORTAL_URL` to the Vercel production URL
3. Redeploy the Railway service

## Step 4: Smoke Test Checklist

After both services are deployed, verify these flows:

### Auth
- [ ] Visit portal → anonymous session created automatically
- [ ] Click "Přihlásit se" → login page loads
- [ ] Google OAuth login works → redirects back
- [ ] Email signup works → profile created
- [ ] Logout → returns to guest session

### Game Flow
- [ ] Click "Hrát Prší" → `/prsi` page loads
- [ ] Click "Rychlá hra" → matchmaking starts, finds game or fills with bot
- [ ] Click "Vytvořit místnost" → room created, room code displayed
- [ ] Copy room code → open in new tab → join works
- [ ] Player list shows both players
- [ ] "Jsem připraven" → ready status toggles
- [ ] Host clicks "Začít hru" → game starts
- [ ] Play a full game → cards deal, turns work, timer ticks
- [ ] Game ends → results screen shows placements

### Elo & Stats
- [ ] After game (logged-in) → Elo change shown in results
- [ ] Visit `/profil/[username]` → stats updated
- [ ] Visit `/zebricek` → leaderboard loads (after 5+ games)

### Chat
- [ ] Open chat during game → panel opens
- [ ] Send text message (logged-in) → appears for all players
- [ ] Send reaction → appears for all players
- [ ] Guest cannot type → "Pro psaní zpráv se přihlas" shown

### Error Handling
- [ ] Visit `/prsi/INVALID` → redirects to `/prsi`
- [ ] Disconnect internet briefly → reconnection UI appears
- [ ] Refresh during game → reconnects to room

### Mobile
- [ ] All above flows work on mobile viewport
- [ ] Cards are tap-to-select, tap-again-to-play
- [ ] Hamburger menu works

## Troubleshooting

**WebSocket connection fails:**
- Check Railway `PORTAL_URL` matches Vercel domain exactly
- Ensure Railway supports WebSocket (it does by default)
- Check browser console for CORS errors

**Auth callback fails:**
- Add Vercel URL to Supabase Auth → URL Configuration → Redirect URLs

**Build fails on Vercel:**
- Ensure all `NEXT_PUBLIC_*` vars are set in Vercel dashboard
- The build needs `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
