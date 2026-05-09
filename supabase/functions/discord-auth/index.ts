// Custom Discord OAuth2 flow for Lovable Cloud
// Flow:
//  1. GET ?action=start&final=<url>  -> 302 to Discord authorize
//  2. GET ?code=...&state=...        -> exchanges code, creates/updates user, redirects to magic link
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const CLIENT_ID = Deno.env.get("DISCORD_CLIENT_ID")!;
const CLIENT_SECRET = Deno.env.get("DISCORD_CLIENT_SECRET")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const REDIRECT_URI = `${SUPABASE_URL}/functions/v1/discord-auth`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get("action");
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");

    // STEP 1: redirect to Discord
    if (action === "start") {
      const final = url.searchParams.get("final") || `${url.origin}/aplicaciones`;
      const stateB64 = btoa(JSON.stringify({ final }));
      const params = new URLSearchParams({
        client_id: CLIENT_ID,
        redirect_uri: REDIRECT_URI,
        response_type: "code",
        scope: "identify email",
        state: stateB64,
        prompt: "consent",
      });
      return Response.redirect(`https://discord.com/api/oauth2/authorize?${params}`, 302);
    }

    // STEP 2: callback from Discord
    if (code && state) {
      const { final } = JSON.parse(atob(state));

      // Exchange code for token
      const tokenRes = await fetch("https://discord.com/api/oauth2/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: CLIENT_ID,
          client_secret: CLIENT_SECRET,
          grant_type: "authorization_code",
          code,
          redirect_uri: REDIRECT_URI,
        }),
      });
      if (!tokenRes.ok) {
        const t = await tokenRes.text();
        return new Response(`Discord token exchange failed: ${t}`, { status: 400 });
      }
      const { access_token } = await tokenRes.json();

      // Fetch Discord user
      const userRes = await fetch("https://discord.com/api/users/@me", {
        headers: { Authorization: `Bearer ${access_token}` },
      });
      if (!userRes.ok) {
        return new Response("Failed to fetch Discord user", { status: 400 });
      }
      const dUser = await userRes.json();
      const email: string | undefined = dUser.email;
      if (!email) {
        return new Response("Discord account has no email", { status: 400 });
      }
      const discordId: string = dUser.id;
      const username: string = dUser.global_name || dUser.username;
      const avatar = dUser.avatar
        ? `https://cdn.discordapp.com/avatars/${discordId}/${dUser.avatar}.png`
        : null;

      const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
        auth: { autoRefreshToken: false, persistSession: false },
      });

      // Find or create user by email
      let userId: string | null = null;
      const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
      const existing = list?.users?.find((u) => u.email?.toLowerCase() === email.toLowerCase());
      if (existing) {
        userId = existing.id;
        await admin.auth.admin.updateUserById(userId, {
          user_metadata: {
            ...existing.user_metadata,
            provider: "discord",
            discord_id: discordId,
            full_name: username,
            avatar_url: avatar,
          },
        });
      } else {
        const { data: created, error: cErr } = await admin.auth.admin.createUser({
          email,
          email_confirm: true,
          user_metadata: {
            provider: "discord",
            discord_id: discordId,
            full_name: username,
            avatar_url: avatar,
          },
        });
        if (cErr || !created.user) {
          return new Response(`Failed to create user: ${cErr?.message}`, { status: 500 });
        }
        userId = created.user.id;
      }

      // Upsert profile with discord_id
      await admin.from("profiles").upsert({
        id: userId!,
        email,
        display_name: username,
        avatar_url: avatar,
        discord_id: discordId,
      });

      // Generate magic link and redirect the browser to the action_link
      const { data: link, error: lErr } = await admin.auth.admin.generateLink({
        type: "magiclink",
        email,
        options: { redirectTo: final },
      });
      if (lErr || !link?.properties?.action_link) {
        return new Response(`Failed to generate session: ${lErr?.message}`, { status: 500 });
      }
      return Response.redirect(link.properties.action_link, 302);
    }

    return new Response("Invalid request", { status: 400 });
  } catch (e) {
    console.error("discord-auth error:", e);
    return new Response(`Error: ${e instanceof Error ? e.message : String(e)}`, { status: 500 });
  }
});
