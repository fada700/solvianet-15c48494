import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ACCEPT_MESSAGE = (username: string) => `Estimado/a ${username}:

Nos complace informarle que ha sido seleccionado/a para participar en la segunda fase del proceso de postulaciones de SolvianMC Network.

A partir de este momento, se le ha asignado el rol de **Postulante** dentro de nuestro servidor oficial de Discord, otorgándole acceso a nuevos canales y apartados exclusivos correspondientes a esta etapa del proceso.

Durante esta fase, deberá coordinar una entrevista con uno de nuestros entrevistadores autorizados. La misma será realizada mediante chat de voz y tendrá como finalidad evaluar distintos aspectos relacionados con su postulación.

Agradecemos sinceramente su interés, disposición y tiempo dedicado al proceso de selección. Le deseamos muchos éxitos en esta nueva etapa.

Atentamente,
Equipo Administrativo de SolvianMC Network`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const BOT_TOKEN = Deno.env.get("DISCORD_BOT_TOKEN");
    const GUILD_ID = Deno.env.get("DISCORD_GUILD_ID");
    const ROLE_ID = Deno.env.get("DISCORD_POSTULANTE_ROLE_ID");
    if (!BOT_TOKEN || !GUILD_ID || !ROLE_ID) throw new Error("Discord secrets not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const admin = createClient(supabaseUrl, serviceKey);
    const { data: roleRow } = await admin.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle();
    if (!roleRow) return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { appId } = await req.json();
    if (!appId) throw new Error("appId required");

    const { data: app, error: appErr } = await admin.from("staff_applications").select("*").eq("id", appId).maybeSingle();
    if (appErr || !app) throw new Error("Application not found");

    // Get discord_id from user metadata (custom Discord OAuth) or profiles table
    const { data: { user: applicant } } = await admin.auth.admin.getUserById(app.user_id);
    if (!applicant) throw new Error("Applicant user not found");

    let discordId: string | undefined = (applicant.user_metadata as any)?.discord_id;
    let username: string = (applicant.user_metadata as any)?.full_name || (applicant.user_metadata as any)?.name || app.user_name || "Postulante";

    if (!discordId) {
      const { data: profile } = await admin.from("profiles").select("discord_id, display_name").eq("id", app.user_id).maybeSingle();
      discordId = profile?.discord_id ?? undefined;
      if (profile?.display_name) username = profile.display_name;
    }

    if (!discordId) throw new Error("El postulante no inició sesión con Discord — no se puede contactar.");

    // 1. Assign role
    const roleResp = await fetch(`https://discord.com/api/v10/guilds/${GUILD_ID}/members/${discordId}/roles/${ROLE_ID}`, {
      method: "PUT",
      headers: { Authorization: `Bot ${BOT_TOKEN}` },
    });
    if (!roleResp.ok && roleResp.status !== 204) {
      const t = await roleResp.text();
      console.error("Role assign failed", roleResp.status, t);
      throw new Error(`No se pudo asignar el rol (${roleResp.status}). ¿El usuario está en el servidor?`);
    }

    // 2. Create DM channel
    const dmResp = await fetch("https://discord.com/api/v10/users/@me/channels", {
      method: "POST",
      headers: { Authorization: `Bot ${BOT_TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify({ recipient_id: discordId }),
    });
    if (!dmResp.ok) {
      const t = await dmResp.text();
      throw new Error(`No se pudo crear DM (${dmResp.status}): ${t}`);
    }
    const dm = await dmResp.json();

    // 3. Send DM
    const msgResp = await fetch(`https://discord.com/api/v10/channels/${dm.id}/messages`, {
      method: "POST",
      headers: { Authorization: `Bot ${BOT_TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify({ content: ACCEPT_MESSAGE(`<@${discordId}>`) }),
    });
    if (!msgResp.ok) {
      const t = await msgResp.text();
      console.error("DM send failed", t);
    }

    // 4. Update status
    await admin.from("staff_applications").update({ status: "accepted" }).eq("id", appId);

    return new Response(JSON.stringify({ success: true, username }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("accept-application error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
