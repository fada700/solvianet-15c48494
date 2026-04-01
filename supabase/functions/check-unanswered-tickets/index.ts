import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Find open tickets older than 10 minutes with no staff messages
    const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();

    const { data: tickets } = await supabase
      .from("tickets")
      .select("id, user_id, created_at")
      .in("status", ["open", "waiting_response"])
      .lt("created_at", tenMinAgo);

    if (!tickets || tickets.length === 0) {
      return new Response(JSON.stringify({ message: "No unanswered tickets" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const results = [];

    for (const ticket of tickets) {
      // Check if there's any staff (non-AI, non-owner) message OR if AI already responded as followup
      const { data: msgs } = await supabase
        .from("ticket_messages")
        .select("user_id, is_ai, created_at")
        .eq("ticket_id", ticket.id)
        .order("created_at", { ascending: false })
        .limit(5);

      // Check if last message is from AI (followup already sent)
      const lastMsg = msgs?.[0];
      if (lastMsg?.is_ai) continue; // AI already responded last, skip

      // Check if any staff has responded (non-owner, non-AI message)
      const hasStaffReply = msgs?.some(m => m.user_id !== ticket.user_id && !m.is_ai);
      
      // Check if the last non-AI message is older than 10 min
      const lastNonAiMsg = msgs?.find(m => !m.is_ai);
      if (lastNonAiMsg) {
        const msgAge = Date.now() - new Date(lastNonAiMsg.created_at).getTime();
        if (msgAge < 10 * 60 * 1000) continue; // Too recent
      }

      // If no staff has replied, or staff hasn't replied in 10 min, send AI followup
      if (!hasStaffReply || true) {
        // Call ticket-ai-respond function
        const response = await fetch(`${SUPABASE_URL}/functions/v1/ticket-ai-respond`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          },
          body: JSON.stringify({ ticket_id: ticket.id, mode: "followup" }),
        });

        const result = await response.json();
        results.push({ ticket_id: ticket.id, result });
      }
    }

    return new Response(JSON.stringify({ processed: results.length, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
