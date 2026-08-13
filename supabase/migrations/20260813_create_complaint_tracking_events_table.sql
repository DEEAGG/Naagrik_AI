-- Naagrik AI - Supabase Complaint Tracking Events Migration & Row Level Security (RLS)
-- Enables persistent citizen-controlled complaint tracking events and timeline history across devices.

CREATE TABLE IF NOT EXISTS public.complaint_tracking_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_id UUID NOT NULL REFERENCES public.complaints(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  status TEXT,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_tracking_events_complaint_id ON public.complaint_tracking_events(complaint_id);
CREATE INDEX IF NOT EXISTS idx_tracking_events_user_id ON public.complaint_tracking_events(user_id);
CREATE INDEX IF NOT EXISTS idx_tracking_events_created_at ON public.complaint_tracking_events(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE public.complaint_tracking_events ENABLE ROW LEVEL SECURITY;

-- RLS Policy 1: Authenticated user can SELECT only their own complaint tracking events
CREATE POLICY "Users can view their own tracking events"
  ON public.complaint_tracking_events
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policy 2: Authenticated user can INSERT only tracking events for themselves
CREATE POLICY "Users can insert their own tracking events"
  ON public.complaint_tracking_events
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- RLS Policy 3: Authenticated user can UPDATE only their own tracking events
CREATE POLICY "Users can update their own tracking events"
  ON public.complaint_tracking_events
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policy 4: Authenticated user can DELETE only their own tracking events
CREATE POLICY "Users can delete their own tracking events"
  ON public.complaint_tracking_events
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
