import "dotenv/config";
import express from "express";
import { getAvailableSlots, bookSlot } from "./lib/calcom.js";
import { logCallEvent } from "./lib/supabase.js";

const app = express();
app.use(express.json());

/**
 * ============================================================
 * 1. FUNCTION-CALL WEBHOOK
 * Retell hits this endpoint whenever the agent invokes a custom
 * function defined in agent-config/functions.json
 * ============================================================
 */
app.post("/functions/check-availability", async (req, res) => {
  try {
    const call = req.body.call;
    const args = req.body.args || req.body; // handles both "args only" and full payload formats

    const slots = await getAvailableSlots({ daysAhead: 5 });

    if (slots.length === 0) {
      await logCallEvent({
        callId: call?.call_id,
        outcome: "no_slots_available",
        callerPhone: call?.from_number,
        transcriptSnippet: "Checked availability, none found in next 5 days",
      });
      return res.json({
        result: "No slots available in the next 5 days. Offer to have the office call the patient back.",
      });
    }

    const readable = slots
      .map((s, i) => `Option ${i + 1}: ${new Date(s.iso).toLocaleString("en-US", {
        weekday: "long", month: "long", day: "numeric", hour: "numeric", minute: "2-digit",
        timeZone: "America/Chicago", // change to the practice's real timezone
      })}`)
      .join(". ");

    res.json({ result: readable, raw_slots: slots });
  } catch (err) {
    console.error(err);
    res.status(500).json({ result: "Availability check failed, apologize and offer a callback." });
  }
});

app.post("/functions/book-appointment", async (req, res) => {
  try {
    const call = req.body.call;
    const args = req.body.args || req.body;

    const booking = await bookSlot({
      isoStartTime: args.selected_time,
      patient: {
        name: args.full_name,
        phone: args.phone_number || call?.from_number,
        email: args.email,
        notes: args.visit_type,
      },
    });

    await logCallEvent({
      callId: call?.call_id,
      outcome: "booked",
      callerPhone: call?.from_number,
      transcriptSnippet: `Booked appointment for ${args.full_name}`,
      bookingId: booking.id || booking.uid,
    });

    res.json({
      result: `Booking confirmed for ${args.full_name} at ${args.selected_time}. Confirmation will be sent by SMS/email.`,
    });
  } catch (err) {
    console.error(err);
    await logCallEvent({
      callId: req.body?.call?.call_id,
      outcome: "booking_failed",
      callerPhone: req.body?.call?.from_number,
      transcriptSnippet: `Booking attempt failed: ${err.message}`,
    });
    res.status(500).json({ result: "Booking failed. Apologize and offer to transfer to the front desk." });
  }
});
/**
 * ============================================================
 * 2. CALL-EVENT WEBHOOK
 * Retell sends call_started / call_ended / call_analyzed events here.
 * This is your safety net — every call gets logged even if no
 * function was ever called (pure FAQ calls, hang-ups, etc.)
 * ============================================================
 */
app.post("/webhook/retell-events", async (req, res) => {
  const { event, call } = req.body;

  if (event === "call_ended") {
    await logCallEvent({
      callId: call.call_id,
      outcome: call.call_analysis?.custom_analysis_data?.outcome || "completed_no_booking",
      callerPhone: call.from_number,
      transcriptSnippet: (call.transcript || "").slice(-300), // last 300 chars is usually enough context
      metadata: { duration_seconds: call.duration_ms ? call.duration_ms / 1000 : null },
    });
  }

  res.sendStatus(200);
});

app.get("/health", (req, res) => res.json({ status: "ok" }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Voice agent backend running on port ${PORT}`));
