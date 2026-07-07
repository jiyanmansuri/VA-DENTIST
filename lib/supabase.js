import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Logs a call event. Called on every function invocation and on call end,
 * so you always have a record even if the call ends mid-booking.
 */
export async function logCallEvent({
  callId,
  outcome,       // "booked" | "transferred" | "faq_only" | "no_answer" | "in_progress"
  callerPhone,
  transcriptSnippet,
  bookingId = null,
  metadata = {},
}) {
  const { error } = await supabase.from("calls").upsert(
    {
      call_id: callId,
      outcome,
      caller_phone: callerPhone,
      transcript_snippet: transcriptSnippet,
      booking_id: bookingId,
      metadata,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "call_id" }
  );

  if (error) {
    console.error("Supabase log error:", error.message);
  }
}
