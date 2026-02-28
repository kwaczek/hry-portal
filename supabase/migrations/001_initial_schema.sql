-- hry-portal: Initial database schema
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor → New query)

-- ============================================================
-- TABLES
-- ============================================================

CREATE TABLE profiles (
  id           uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username     text UNIQUE NOT NULL,
  display_name text,
  avatar_url   text,
  is_guest     boolean DEFAULT false,
  created_at   timestamptz DEFAULT now()
);

CREATE TABLE ratings (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid REFERENCES profiles(id) ON DELETE CASCADE,
  game_type    text NOT NULL,
  elo          int DEFAULT 1000,
  games_played int DEFAULT 0,
  wins         int DEFAULT 0,
  losses       int DEFAULT 0,
  win_streak   int DEFAULT 0,
  best_streak  int DEFAULT 0,
  updated_at   timestamptz DEFAULT now(),
  UNIQUE(user_id, game_type)
);

CREATE TABLE game_results (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_type     text NOT NULL,
  room_id       text NOT NULL,
  players       jsonb NOT NULL,
  rule_variant  text,
  duration_sec  int,
  played_at     timestamptz DEFAULT now()
);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX idx_ratings_game_elo ON ratings(game_type, elo DESC);
CREATE INDEX idx_ratings_user ON ratings(user_id);
CREATE INDEX idx_game_results_played ON game_results(played_at DESC);
CREATE INDEX idx_game_results_type ON game_results(game_type, played_at DESC);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_results ENABLE ROW LEVEL SECURITY;

-- profiles: Anyone can read. Users can update their own.
CREATE POLICY "profiles_select" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "profiles_insert" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update" ON profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ratings: Anyone can read. Only server (service role) can insert/update.
CREATE POLICY "ratings_select" ON ratings
  FOR SELECT USING (true);

CREATE POLICY "ratings_insert" ON ratings
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "ratings_update" ON ratings
  FOR UPDATE USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- game_results: Anyone can read. Only server (service role) can insert.
CREATE POLICY "game_results_select" ON game_results
  FOR SELECT USING (true);

CREATE POLICY "game_results_insert" ON game_results
  FOR INSERT WITH CHECK (auth.role() = 'service_role');
