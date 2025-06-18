-- Current Database Schema (Read-Only Analysis)
-- This file documents the existing structure for comparison

-- Profiles Table
CREATE TABLE profiles (
  id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email text NOT NULL,
  full_name text,
  avatar_url text,
  subscription_plan text DEFAULT 'free' CHECK (subscription_plan IN ('free', 'pro')),
  custom_domain text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Journal Entries Table
CREATE TABLE journal_entries (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  date text NOT NULL,
  mood integer NOT NULL CHECK (mood >= 1 AND mood <= 5),
  mood_emoji text NOT NULL DEFAULT '😐',
  decision text NOT NULL DEFAULT '',
  habits jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT journal_entries_user_date_unique UNIQUE (user_id, date)
);

-- Indexes
CREATE INDEX journal_entries_user_id_idx ON journal_entries(user_id);
CREATE INDEX journal_entries_date_idx ON journal_entries(date);
CREATE INDEX journal_entries_created_at_idx ON journal_entries(created_at DESC);

-- Current Issues Identified:
-- 1. Habits stored as JSONB - difficult to query and analyze
-- 2. Date stored as both text and timestamp - inconsistent
-- 3. No dedicated tables for goals, categories, or analytics
-- 4. Limited scalability for complex queries
-- 5. No audit trail or versioning