import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

Deno.serve(async () => {
  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email: "solvianmc@staff.net",
    password: "solvian!MCK",
    email_confirm: true,
    user_metadata: { full_name: "SolvianMC Staff" },
  });

  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400 });

  // Assign admin role
  const { error: roleError } = await supabaseAdmin.from("user_roles").insert({
    user_id: data.user.id,
    role: "admin",
  });

  return new Response(JSON.stringify({ success: true, userId: data.user.id, roleError: roleError?.message }));
});
