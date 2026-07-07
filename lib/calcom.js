import fetch from "node-fetch";

const CALCOM_BASE = "https://api.cal.com/v2";

function authHeaders() {
  return {
    "Authorization": `Bearer ${process.env.CALCOM_API_KEY}`,
    "Content-Type": "application/json",
    "cal-api-version": "2024-09-04",
  };
}

/**
 * Get available slots for the next N days.
 * Returns a simplified list of { date, time, iso } the agent can read out loud.
 */
export async function getAvailableSlots({ daysAhead = 5 } = {}) {
  const start = new Date();
  const end = new Date();
  end.setDate(end.getDate() + daysAhead);

  const params = new URLSearchParams({
    eventTypeId: process.env.CALCOM_EVENT_TYPE_ID,
    start: start.toISOString(),
    end: end.toISOString(),
  });

  const res = await fetch(`${CALCOM_BASE}/slots?${params.toString()}`, {
    headers: authHeaders(),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Cal.com slots error: ${res.status} ${errText}`);
  }

  const data = await res.json();

  // Cal.com returns slots grouped by date: { "2026-07-10": [{ start: "..." }, ...] }
  const slotsByDate = data.data || {};
  const flatSlots = [];

  for (const [date, slots] of Object.entries(slotsByDate)) {
    for (const slot of slots) {
      flatSlots.push({ date, iso: slot.start });
    }
  }

  // Return only the first 5 upcoming slots — enough for the agent to offer choices
  // without overwhelming the caller on a voice call.
  return flatSlots.slice(0, 5);
}

/**
 * Book a specific slot.
 * patient = { name, phone, email, notes }
 */
export async function bookSlot({ isoStartTime, patient }) {
  const body = {
    eventTypeId: Number(process.env.CALCOM_EVENT_TYPE_ID),
    start: isoStartTime,
    attendee: {
      name: patient.name,
      email: patient.email || `${patient.phone}@no-email-provided.com`,
      phoneNumber: patient.phone,
      timeZone: patient.timeZone || "Asia/Kolkata",
    },
    metadata: {
      source: "voice-agent",
      notes: patient.notes || "",
    },
  };

  const res = await fetch(`${CALCOM_BASE}/bookings`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Cal.com booking error: ${res.status} ${errText}`);
  }

  const data = await res.json();
  return data.data; // includes booking id, confirmed time, etc.
}
