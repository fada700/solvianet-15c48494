// Generates a 6-digit verification code, stores it, and emails it via Brevo.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const BREVO_API_KEY = Deno.env.get("BREVO_API_KEY"); // ✅ CHANGED from RESEND_API_KEY
const FROM_EMAIL = Deno.env.get("FROM_EMAIL") || "admin@solvianmc.net";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    if (!BREVO_API_KEY) {
      console.error("BREVO_API_KEY not configured");
      return new Response(JSON.stringify({ error: "BREVO_API_KEY not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("No Authorization header");
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: uErr } = await userClient.auth.getUser();
    if (uErr || !userData.user) {
      console.error("Invalid session:", uErr);
      return new Response(JSON.stringify({ error: "Invalid session" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const user = userData.user;
    const email = user.email!;

    const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: roleRow } = await admin
      .from("user_roles").select("id")
      .eq("user_id", user.id).eq("role", "admin").maybeSingle();
    if (!roleRow) {
      console.error("User not admin:", user.id);
      return new Response(JSON.stringify({ error: "Not authorized" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: existing } = await admin
      .from("admin_verification_codes").select("*")
      .eq("user_id", user.id).maybeSingle();
    if (existing?.locked_until && new Date(existing.locked_until) > new Date()) {
      console.warn("User locked:", user.id, existing.locked_until);
      return new Response(JSON.stringify({
        error: "locked",
        locked_until: existing.locked_until,
      }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    const { error: dbError } = await admin.from("admin_verification_codes").upsert({
      user_id: user.id,
      code: String(code),
      expires_at: expiresAt,
      attempts: 0,
      locked_until: null,
    }, { onConflict: "user_id" });

    if (dbError) {
      console.error("Database error storing code:", dbError);
      return new Response(JSON.stringify({ error: "Failed to store code", detail: dbError.message }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const html = `
      <div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:24px;background:#1c1410;color:#f5e6c8;border-radius:12px;border:1px solid #d4a017">
        <h2 style="color:#d4a017;font-family:Georgia,serif;margin:0 0 12px">SolvianMC — Panel Admin</h2>
        <p style="margin:0 0 12px">Tu código de acceso es:</p>
        <p style="font-size:36px;font-weight:bold;letter-spacing:8px;color:#d4a017;text-align:center;background:rgba(212,160,23,0.1);padding:16px;border-radius:8px;margin:16px 0">${code}</p>
        <p style="margin:12px 0 0;font-size:13px;color:#aa9477">Expira en 10 minutos. Si no fuiste tú, ignora este mensaje.</p>
      </div>
    `;

    console.log(`Sending verification code to ${email} via Brevo`);

    const r = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": BREVO_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sender: { name: "SolvianMC", email: FROM_EMAIL },
        to: [{ email }],
        subject: "Código de acceso — SolvianMC",
        htmlContent: html,
      }),
    });

    if (!r.ok) {
      const t = await r.text();
      console.error(`Brevo error (${r.status}):`, t);
      return new Response(JSON.stringify({ 
        error: "Failed to send email", 
        detail: t, 
        status: r.status 
      }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`✅ Code sent successfully to ${email}`);
    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("admin-send-code error:", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
