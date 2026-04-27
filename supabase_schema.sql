-- ============================================================
-- Kano Feature Prioritization System - Supabase SQL Schema
-- ECB Architecture: Entity Layer
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- UserEntity
-- ============================================================
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('stakeholder', 'product_manager', 'dev_team')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- Registration (auth credentials linked to UserEntity)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.registrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- FeatureRequestEntity
-- ============================================================
CREATE TABLE IF NOT EXISTS public.feature_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'to_do'
    CHECK (status IN ('to_do', 'in_progress', 'testing', 'completed')),
  submitted_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  assigned_to UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- FeedbackEntity
-- ============================================================
CREATE TABLE IF NOT EXISTS public.feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id UUID NOT NULL REFERENCES public.feature_requests(id) ON DELETE CASCADE,
  stakeholder_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  kano_category TEXT NOT NULL
    CHECK (kano_category IN ('must_be', 'one_dimensional', 'attractive', 'indifferent', 'reverse')),
  functional_rating INT NOT NULL CHECK (functional_rating BETWEEN 1 AND 5),
  dysfunctional_rating INT NOT NULL CHECK (dysfunctional_rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(request_id, stakeholder_id)
);

-- ============================================================
-- BacklogEntity
-- ============================================================
CREATE TABLE IF NOT EXISTS public.backlog (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id UUID UNIQUE NOT NULL REFERENCES public.feature_requests(id) ON DELETE CASCADE,
  priority_score NUMERIC(5,2) NOT NULL DEFAULT 0,
  kano_category TEXT NOT NULL DEFAULT 'indifferent'
    CHECK (kano_category IN ('must_be', 'one_dimensional', 'attractive', 'indifferent', 'reverse')),
  feedback_count INT NOT NULL DEFAULT 0,
  calculated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- Indexes
-- ============================================================
CREATE INDEX idx_feature_requests_status ON public.feature_requests(status);
CREATE INDEX idx_feature_requests_assigned ON public.feature_requests(assigned_to);
CREATE INDEX idx_feedback_request ON public.feedback(request_id);
CREATE INDEX idx_feedback_stakeholder ON public.feedback(stakeholder_id);
CREATE INDEX idx_backlog_score ON public.backlog(priority_score DESC);

-- ============================================================
-- Updated_at trigger
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER feature_requests_updated_at
  BEFORE UPDATE ON public.feature_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- Kano Priority Score Function (BacklogControl logic in DB)
-- Weights: Must-be=100, One-dimensional=75, Attractive=50, Indifferent=10, Reverse=0
-- ============================================================
CREATE OR REPLACE FUNCTION calculate_kano_score(
  p_request_id UUID
) RETURNS NUMERIC AS $$
DECLARE
  v_score NUMERIC := 0;
  v_count INT;
  v_must_be INT;
  v_one_dim INT;
  v_attractive INT;
  v_indifferent INT;
  v_reverse INT;
  v_avg_func NUMERIC;
  v_dominant_category TEXT;
BEGIN
  SELECT
    COUNT(*),
    SUM(CASE WHEN kano_category = 'must_be' THEN 1 ELSE 0 END),
    SUM(CASE WHEN kano_category = 'one_dimensional' THEN 1 ELSE 0 END),
    SUM(CASE WHEN kano_category = 'attractive' THEN 1 ELSE 0 END),
    SUM(CASE WHEN kano_category = 'indifferent' THEN 1 ELSE 0 END),
    SUM(CASE WHEN kano_category = 'reverse' THEN 1 ELSE 0 END),
    AVG(functional_rating)
  INTO v_count, v_must_be, v_one_dim, v_attractive, v_indifferent, v_reverse, v_avg_func
  FROM public.feedback
  WHERE request_id = p_request_id;

  IF v_count = 0 THEN RETURN 0; END IF;

  -- Weighted score based on category distribution
  v_score := (
    (v_must_be * 100) +
    (v_one_dim * 75) +
    (v_attractive * 50) +
    (v_indifferent * 10) +
    (v_reverse * 0)
  )::NUMERIC / v_count;

  -- Boost by average functional rating (1-5 scale, max 20% boost)
  v_score := v_score * (1 + (COALESCE(v_avg_func, 3) - 3) * 0.04);

  -- Determine dominant category
  SELECT kano_category INTO v_dominant_category
  FROM (
    VALUES ('must_be', v_must_be), ('one_dimensional', v_one_dim),
           ('attractive', v_attractive), ('indifferent', v_indifferent), ('reverse', v_reverse)
  ) AS cats(cat, cnt)
  ORDER BY cnt DESC LIMIT 1;

  -- Upsert into backlog
  INSERT INTO public.backlog (request_id, priority_score, kano_category, feedback_count, calculated_at)
  VALUES (p_request_id, ROUND(v_score, 2), COALESCE(v_dominant_category, 'indifferent'), v_count, NOW())
  ON CONFLICT (request_id)
  DO UPDATE SET
    priority_score = ROUND(v_score, 2),
    kano_category = COALESCE(v_dominant_category, 'indifferent'),
    feedback_count = v_count,
    calculated_at = NOW();

  RETURN ROUND(v_score, 2);
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- Row Level Security (basic - expand per your auth strategy)
-- ============================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.backlog ENABLE ROW LEVEL SECURITY;

-- Public read for demo (tighten with Supabase Auth JWT in production)
CREATE POLICY "allow_all_authenticated" ON public.users FOR ALL USING (true);
CREATE POLICY "allow_all_authenticated" ON public.feature_requests FOR ALL USING (true);
CREATE POLICY "allow_all_authenticated" ON public.feedback FOR ALL USING (true);
CREATE POLICY "allow_all_authenticated" ON public.backlog FOR ALL USING (true);

-- ============================================================
-- Seed Data (Demo Users - passwords: "password123")
-- ============================================================
INSERT INTO public.users (id, name, email, role) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Alice PM', 'pm@demo.com', 'product_manager'),
  ('22222222-2222-2222-2222-222222222222', 'Bob Dev', 'dev@demo.com', 'dev_team'),
  ('33333333-3333-3333-3333-333333333333', 'Carol Stake', 'stakeholder@demo.com', 'stakeholder')
ON CONFLICT DO NOTHING;

-- Note: In production use Supabase Auth. These are demo credentials.
INSERT INTO public.registrations (username, password_hash, user_id) VALUES
  ('pm@demo.com', 'demo_hashed_password', '11111111-1111-1111-1111-111111111111'),
  ('dev@demo.com', 'demo_hashed_password', '22222222-2222-2222-2222-222222222222'),
  ('stakeholder@demo.com', 'demo_hashed_password', '33333333-3333-3333-3333-333333333333')
ON CONFLICT DO NOTHING;

-- Seed Feature Requests
INSERT INTO public.feature_requests (id, title, description, status, submitted_by) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'User Authentication System', 'Implement secure login and registration with OAuth support', 'in_progress', '33333333-3333-3333-3333-333333333333'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Advanced Search Filters', 'Add multi-criteria search with saved filter presets', 'to_do', '33333333-3333-3333-3333-333333333333'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Real-time Notifications', 'Push notifications for important updates and alerts', 'to_do', '33333333-3333-3333-3333-333333333333'),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'Data Export Functionality', 'Export data in CSV, Excel, and PDF formats', 'testing', '33333333-3333-3333-3333-333333333333'),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'Dark Mode Theme', 'Implement dark mode with user preference saving', 'completed', '33333333-3333-3333-3333-333333333333'),
  ('ffffffff-ffff-ffff-ffff-ffffffffffff', 'Mobile App Integration', 'Native mobile app with offline support', 'completed', '33333333-3333-3333-3333-333333333333')
ON CONFLICT DO NOTHING;
