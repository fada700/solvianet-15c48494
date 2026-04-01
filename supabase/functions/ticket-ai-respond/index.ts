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
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { ticket_id, mode } = await req.json();
    // mode: "initial" (when ticket created) or "followup" (after 10 min no staff response)

    // Get ticket details
    const { data: ticket, error: ticketError } = await supabase
      .from("tickets")
      .select("*")
      .eq("id", ticket_id)
      .single();

    if (ticketError || !ticket) {
      return new Response(JSON.stringify({ error: "Ticket not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (ticket.status === "closed") {
      return new Response(JSON.stringify({ error: "Ticket is closed" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get existing messages
    const { data: messages } = await supabase
      .from("ticket_messages")
      .select("*")
      .eq("ticket_id", ticket_id)
      .order("created_at", { ascending: true });

    const categoryLabels: Record<string, string> = {
      reportar_jugador: "Reportar Jugador",
      problema_tecnico: "Problema Técnico",
      dudas_compra: "Dudas de Compra",
      apelacion_sancion: "Apelación de Sanción",
    };

    let systemPrompt: string;
    if (mode === "initial") {
      systemPrompt = `Eres un asistente de soporte automatizado para un servidor de Minecraft llamado Solvian MC. 
El usuario acaba de crear un ticket. Tu trabajo es:
1. Confirmar que recibiste su ticket
2. Analizar brevemente su problema según la categoría y descripción
3. Dar una respuesta inicial útil o hacer preguntas clarificadoras
4. Informar que un miembro del staff revisará su caso pronto

Sé amable, profesional y conciso. Responde en español. No uses markdown excesivo, solo texto plano con emojis cuando sea apropiado.`;
    } else {
      systemPrompt = `Eres un asistente de soporte automatizado para un servidor de Minecraft llamado Solvian MC.
Han pasado más de 10 minutos sin que un staff responda al ticket. Tu trabajo es:
1. Intentar ayudar al usuario basándote en la información del ticket y mensajes previos
2. Proponer posibles soluciones según la categoría del problema
3. Si no puedes resolver, asegurar al usuario que el staff lo atenderá pronto

Para "reportar_jugador": Pide evidencia si no la tiene, explica el proceso de revisión
Para "problema_tecnico": Sugiere soluciones comunes (reiniciar, verificar conexión, versión del juego)
Para "dudas_compra": Explica donde encontrar info de la tienda o precios
Para "apelacion_sancion": Explica el proceso de apelación

Sé amable, profesional y conciso. Responde en español.`;
    }

    const userContent = `Ticket #${ticket.ticket_number}
Categoría: ${categoryLabels[ticket.category] || ticket.category}
Asunto: ${ticket.subject}
Descripción: ${ticket.description}
${ticket.evidence_url ? `Evidencia: ${ticket.evidence_url}` : "Sin evidencia adjunta"}
${messages && messages.length > 0 ? `\nMensajes previos:\n${messages.map((m: any) => `[${m.is_ai ? 'IA' : 'Usuario'}]: ${m.message}`).join('\n')}` : ""}`;

    // Call Lovable AI
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userContent },
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errText);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    const aiMessage = aiData.choices?.[0]?.message?.content;

    if (!aiMessage) {
      return new Response(JSON.stringify({ error: "No AI response" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Insert AI message - use ticket's user_id but mark as AI
    const { error: insertError } = await supabase
      .from("ticket_messages")
      .insert({
        ticket_id: ticket_id,
        user_id: ticket.user_id, // Use ticket owner's ID for RLS compatibility
        message: aiMessage,
        is_ai: true,
      });

    if (insertError) {
      console.error("Insert error:", insertError);
      return new Response(JSON.stringify({ error: "Failed to save AI message" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, message: aiMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
