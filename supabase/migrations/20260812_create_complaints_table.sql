-- Naagrik AI - Supabase Complaints Table Migration & Row Level Security (RLS)
-- Enables cloud persistence for citizen complaints and official reference numbers.

CREATE TABLE IF NOT EXISTS public.complaints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  issue_title TEXT NOT NULL,
  category TEXT NOT NULL,
  authority_key TEXT,
  authority_name TEXT NOT NULL,
  location TEXT NOT NULL,
  original_complaint TEXT,
  final_complaint TEXT,
  reference_number TEXT,
  status TEXT NOT NULL DEFAULT 'in_progress',
  evidence_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_complaints_user_id ON public.complaints(user_id);
CREATE INDEX IF NOT EXISTS idx_complaints_created_at ON public.complaints(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;

-- RLS Policy 1: Authenticated user can SELECT only their own complaints
CREATE POLICY "Users can view their own complaints"
  ON public.complaints
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policy 2: Authenticated user can INSERT only records for themselves
CREATE POLICY "Users can insert their own complaints"
  ON public.complaints
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- RLS Policy 3: Authenticated user can UPDATE only their own complaints
CREATE POLICY "Users can update their own complaints"
  ON public.complaints
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policy 4: Authenticated user can DELETE only their own complaints
CREATE POLICY "Users can delete their own complaints"
  ON public.complaints
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
