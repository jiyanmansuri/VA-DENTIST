-- Run this in Supabase SQL Editor to create the calls log table.
-- This is your proof-of-value dashboard data: "here are the patients
-- booked this week you would've missed."

create table if not exists calls (
  id uuid primary key default gen_random_uuid(),
  call_id text unique not null,
  outcome text, -- 'booked' | 'transferred' | 'faq_only' | 'no_slots_available' | 'booking_failed' | 'completed_no_booking'
  caller_phone text,
  transcript_snippet text,
  booking_id text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_calls_outcome on calls(outcome);
create index if not exists idx_calls_created_at on calls(created_at desc);
