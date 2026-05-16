import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Role IDs for creator types
const CREATOR_ROLE_MAP: Record<string, string> = {
  youtuber: "1487635111686967548",
  streamer: "1487635065570857041",
  media: "1487635165155950782",
  tiktoker: "1505308238768377947",
};

const CREATOR_TYPE_LABEL: Record<string, string> = {
  youtuber: "YouTuber",
  streamer: "Streamer",
  tiktoker: "TikToker",
  media: "Media",
};

// Default (staff) accept message — used for minecraft & discord
const STAFF_ACCEPT_MESSAGE = (username: string) => `Estimado/a ${username}:

Nos complace informarle que ha sido seleccionado/a para participar en la segunda fase del proceso de postulaciones de SolvianMC Network.

A partir de este momento, se le ha asignado el rol de **Postulante** dentro de nuestro servidor oficial de Discord, otorgándole acceso a nuevos canales y apartados exclusivos correspondientes a esta etapa del proceso.

Durante esta fase, deberá coordinar una entrevista con uno de nuestros entrevistadores autorizados. La misma será realizada mediante chat de voz y tendrá como finalidad evaluar distintos aspectos relacionados con su postulación.

Agradecemos sinceramente su interés, disposición y tiempo dedicado al proceso de selección. Le deseamos muchos éxitos en esta nueva etapa.

Atentamente,
Equipo Administrativo de SolvianMC Network`;

const CREATOR_ACCEPT_MESSAGE = (username: string, tipo: string) => `¡Tu postulación ha sido aprobada! 🎉

Estimado/a ${username},

Nos complace informarte que, tras revisar detalladamente tu postulación y analizar tu contenido, has sido formalmente aceptado/a como creador oficial en nuestro servidor de Minecraft RP bajo la categoría de ${tipo}.

Tu dedicación, estilo y la calidad de tu trabajo encajan perfectamente con la comunidad que estamos construyendo. Como muestra de nuestra confianza, ya se te ha asignado el rango de ${tipo} tanto en el juego como en nuestro servidor de Discord.

A partir de este momento, tienes acceso a los canales exclusivos para creadores, donde podrás coordinar dinámicas, enterarte de eventos antes que nadie y reportar cualquier eventualidad. Te invitamos a leer la normativa específica de creadores que se encuentra fijada en dichos canales.

Estamos muy emocionados de ver la historia y el contenido que crearás dentro del servidor. ¡Mucho éxito en esta nueva etapa y bienvenido/a al equipo!

Atentamente, La Administración de SolvianMC`;

const CREATOR_REJECT_MESSAGE = (username: string, tipo: string) => `Actualización sobre tu postulación de Creador de Contenido

Estimado/a ${username},

Agradecemos sinceramente el tiempo y el interés que dedicaste al completar tu formulario para formar parte del equipo de creadores de nuestro servidor de Minecraft RP.

Lamentamos informarte que, en esta ocasión, tu postulación para la categoría de ${tipo} no ha sido seleccionada. Recibimos una gran cantidad de solicitudes y, debido a los cupos limitados y a los enfoques actuales del proyecto, nos vemos en la necesidad de ser muy estrictos con los perfiles seleccionados.

Queremos dejar en claro que esto no es un reflejo de la calidad de tu trabajo, y te animamos a seguir desarrollando tu contenido, mejorando tu constancia y haciendo crecer tu comunidad dentro del servidor.

Nuestras convocatorias abren de manera periódica, por lo que te invitamos a postularte nuevamente en el futuro cuando tu canal o proyecto haya evolucionado. Mientras tanto, eres más que bienvenido/a a seguir disfrutando de la experiencia de rol como jugador de la comunidad.

Te deseamos el mayor de los éxitos con tus proyectos y plataformas de contenido.

Atentamente, La Administración de SolvianMC`;

const STAFF_REJECT_MESSAGE = (username: string) => `Estimado/a ${username},

Lamentamos informarte que, tras revisar tu postulación, no has sido seleccionado/a para continuar con el proceso de staff de SolvianMC Network en esta convocatoria.

Agradecemos sinceramente tu interés y el tiempo dedicado. Te animamos a seguir activo en la comunidad y postularte en futuras convocatorias.

Atentamente,
Equipo Administrativo de SolvianMC Network`;

async function sendDM(botToken: string, discordId: string, content: string) {
  const dmResp = await fetch("https://discord.com/api/v10/users/@me/channels", {
    method: "POST",
    headers: { Authorization: `Bot ${botToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({ recipient_id: discordId }),
  });
  if (!dmResp.ok) {
    const t = await dmResp.text();
    throw new Error(`No se pudo crear DM (${dmResp.status}): ${t}`);
  }
  const dm = await dmResp.json();
  const msgResp = await fetch(`https://discord.com/api/v10/channels/${dm.id}/messages`, {
    method: "POST",
    headers: { Authorization: `Bot ${botToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({ content }),
  });
  if (!msgResp.ok) {
    const t = await msgResp.text();
    console.error("DM send failed", t);
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const BOT_TOKEN = Deno.env.get("DISCORD_BOT_TOKEN");
    const GUILD_ID = Deno.env.get("DISCORD_GUILD_ID");
    const POSTULANTE_ROLE_ID = Deno.env.get("DISCORD_POSTULANTE_ROLE_ID");
    if (!BOT_TOKEN || !GUILD_ID) throw new Error("Discord secrets not configured");

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

    const body = await req.json();
    const appId: string = body.appId;
    const action: "accept" | "reject" = body.action || "accept";
    if (!appId) throw new Error("appId required");

    const { data: app, error: appErr } = await admin.from("staff_applications").select("*").eq("id", appId).maybeSingle();
    if (appErr || !app) throw new Error("Application not found");

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

    const isCreator = app.form_type === "creador";
    const creatorType: string | undefined = (app.answers as any)?.creator_type;
    const creatorLabel = creatorType ? (CREATOR_TYPE_LABEL[creatorType] || creatorType) : "Creador";

    // Choose role + message
    let roleId: string | undefined;
    let message: string;

    if (action === "accept") {
      if (isCreator) {
        if (!creatorType || !CREATOR_ROLE_MAP[creatorType]) {
          throw new Error(`Tipo de creador inválido: ${creatorType}`);
        }
        roleId = CREATOR_ROLE_MAP[creatorType];
        message = CREATOR_ACCEPT_MESSAGE(username, creatorLabel);
      } else {
        roleId = POSTULANTE_ROLE_ID || undefined;
        if (!roleId) throw new Error("DISCORD_POSTULANTE_ROLE_ID no configurado");
        message = STAFF_ACCEPT_MESSAGE(username);
      }

      // Assign role
      const roleResp = await fetch(`https://discord.com/api/v10/guilds/${GUILD_ID}/members/${discordId}/roles/${roleId}`, {
        method: "PUT",
        headers: { Authorization: `Bot ${BOT_TOKEN}` },
      });
      if (!roleResp.ok && roleResp.status !== 204) {
        const t = await roleResp.text();
        console.error("Role assign failed", roleResp.status, t);
        throw new Error(`No se pudo asignar el rol (${roleResp.status}). ¿El usuario está en el servidor?`);
      }

      await sendDM(BOT_TOKEN, discordId, message);
      await admin.from("staff_applications").update({ status: "accepted" }).eq("id", appId);
    } else {
      // reject — DM only, no role
      message = isCreator ? CREATOR_REJECT_MESSAGE(username, creatorLabel) : STAFF_REJECT_MESSAGE(username);
      await sendDM(BOT_TOKEN, discordId, message);
      await admin.from("staff_applications").update({ status: "rejected" }).eq("id", appId);
    }

    return new Response(JSON.stringify({ success: true, username, action }), {
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
