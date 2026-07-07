# Dental Voice Agent — Demo Scaffold

Backend for a Retell AI voice agent that checks availability, books appointments via Cal.com, and logs every call to Supabase. Built to get your first demo call recorded fast.

## What's in here

```
server.js                    Express server, 3 endpoints Retell talks to
lib/calcom.js                Availability + booking against Cal.com API
lib/supabase.js              Call logging
agent-config/system-prompt.md   Paste into Retell's agent prompt
agent-config/functions.json     Custom function schema, paste into Retell
agent-config/supabase-schema.sql  Run once in Supabase SQL editor
.env.example                 Copy to .env and fill in
```

## Setup — 30-45 min total

### 1. Cal.com (10 min)
- Create a free account at cal.com
- Create one "Event Type" (e.g. "New Patient Consult", 30 min)
- Settings → Developer → API Keys → generate a key → put in `CALCOM_API_KEY`
- Grab the event type ID from the URL when editing it → `CALCOM_EVENT_TYPE_ID`

### 2. Supabase (5 min)
- Create a free project at supabase.com
- SQL Editor → paste and run `agent-config/supabase-schema.sql`
- Settings → API → copy Project URL and `service_role` key into `.env`

### 3. Deploy the backend (10 min)
Easiest path is Railway (free tier is enough for a demo):
```bash
npm install
railway login
railway init
railway up
```
Set your `.env` values as Railway environment variables in the dashboard. Note the public URL Railway gives you (e.g. `https://your-app.up.railway.app`).

### 4. Retell AI setup (10 min)
- Create account at retellai.com, buy/connect a Twilio number (or use their number for the demo)
- Create a new agent
- Paste `agent-config/system-prompt.md` content into the General Prompt, filling in the practice details
- Add both custom functions from `agent-config/functions.json` — replace `YOUR-DEPLOYED-URL` with your Railway URL in each function's `url` field
- Set voice to an ElevenLabs voice (Flash v2.5 recommended for latency)
- Test the agent using Retell's web-based test call before going live

### 5. Record your demo (5 min)
- Call the Twilio number yourself, run through a booking flow
- Screen-record or use Retell's call recording (auto-saved per call)
- Trim to ~60 seconds: greeting → one FAQ → booking a slot → confirmation
- This is the video you attach to cold outreach emails

## Extending for a real client
- Swap the FAQ section in the system prompt for their actual details
- Point Cal.com event type at their real calendar (or swap for Google Calendar API if they don't use Cal.com)
- Add a warm-transfer number in Retell's transfer settings for emergencies/escalations
- Query the `calls` table in Supabase to build their weekly "here's what we caught" report — this is what justifies the retainer renewal
