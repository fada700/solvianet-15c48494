// Verifies a 6-digit code submitted by the user.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { code } = await req.json().catch(() => ({ code: "" }));
    if (!/^\d{6}$/.test(String(code || ""))) {
      return new Response(JSON.stringify({ error: "Invalid code format" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: uErr } = await userClient.auth.getUser();
    if (uErr || !userData.user) {
      return new Response(JSON.stringify({ error: "Invalid session" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const user = userData.user;
    const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data: row } = await admin
      .from("admin_verification_codes").select("*")
      .eq("user_id", user.id).maybeSingle();
    if (!row) {
      return new Response(JSON.stringify({ error: "no_code" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (row.locked_until && new Date(row.locked_until) > new Date()) {
      return new Response(JSON.stringify({ error: "locked", locked_until: row.locked_until }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (new Date(row.expires_at) < new Date()) {
      await admin.from("admin_verification_codes").delete().eq("user_id", user.id);
      return new Response(JSON.stringify({ error: "expired" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (String(code) !== row.code) {
      const newAttempts = (row.attempts || 0) + 1;
      const lock = newAttempts >= 3
        ? new Date(Date.now() + 15 * 60 * 1000).toISOString()
        : null;
      await admin.from("admin_verification_codes")
        .update({ attempts: newAttempts, locked_until: lock })
        .eq("user_id", user.id);
      return new Response(JSON.stringify({
        error: lock ? "locked" : "wrong",
        attempts_left: Math.max(0, 3 - newAttempts),
        locked_until: lock,
      }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    await admin.from("admin_verification_codes").delete().eq("user_id", user.id);
    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("admin-verify-code error:", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
