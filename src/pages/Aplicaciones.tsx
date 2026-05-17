import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import AnimatedSection from "@/components/AnimatedSection";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { motion } from "framer-motion";
import { Gamepad2, MessageCircle, Video, Send, CheckCircle2, Lock, Twitch, Youtube, Music2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import logo from "@/assets/solvianmc.png";

type FormType = "minecraft" | "discord" | "creador";
type CreatorType = "streamer" | "youtuber" | "tiktoker" | "media";

type Question = {
  id: string;
  label: string;
  type: "text" | "textarea" | "radio" | "url" | "number" | "checkbox";
  required: boolean;
  options?: string[];
};

const MINECRAFT_QUESTIONS: Question[] = [
  { id: "mc_nick", label: "¿Cuál es tu nick de Minecraft? (Ejemplo: SoyNulled)", type: "text", required: true },
  { id: "dc_nick", label: "¿Cuál es tu nick de Discord? (Ejemplo: soynulled)", type: "text", required: true },
  { id: "premium", label: "¿Eres premium o no premium?", type: "radio", required: true, options: ["Premium", "No premium"] },
  { id: "edad", label: "¿Cuántos años tienes?", type: "text", required: true },
  { id: "por_que", label: "¿Por qué quieres ser staff en SolvianMC Network?", type: "textarea", required: true },
  { id: "experiencia", label: "¿Tienes experiencia previa como staff? Si es así, ¿en qué servidores y hasta qué rango llegaste?", type: "textarea", required: true },
  { id: "reglas", label: "¿Conoces y respetas las reglas del servidor?", type: "radio", required: true, options: ["Sí, conozco y respeto las reglas del servidor", "No, no conozco y no respeto las reglas del servidor"] },
  { id: "discusion", label: "¿Cómo actuarías ante una discusión entre jugadores?", type: "textarea", required: true },
  { id: "procedimiento", label: "¿Qué procedimiento seguirías antes de sancionar a alguien?", type: "textarea", required: true },
  { id: "priorizar", label: "¿Cómo priorizas problemas cuando estás solo?", type: "textarea", required: true },
  { id: "abuso_rango", label: "¿Qué harías si un compañero staff abusa de su rango?", type: "textarea", required: true },
  { id: "conflicto_staff", label: "¿Cómo manejarías un conflicto dentro del staff?", type: "textarea", required: true },
  { id: "mala_sancion", label: "¿Qué harías si aplicas mal una sanción?", type: "textarea", required: true },
  { id: "solo_equipo", label: "¿Prefieres trabajar solo o en equipo? ¿Por qué?", type: "textarea", required: true },
  { id: "respeto", label: "¿Qué harías si no te respetan? Si a ti te respetan, pero a tu compañero no, ¿qué harías? ¿Por qué?", type: "textarea", required: true },
  { id: "comandos", label: "¿Conoces comandos básicos de moderación? Nómbralos y explícalos brevemente cada uno", type: "textarea", required: true },
  { id: "horas", label: "¿Cuántas horas le podrías dedicar al staff diario?", type: "radio", required: true, options: ["1 hora", "3 horas", "Más de 4 horas"] },
  { id: "ideas", label: "¿Qué ideas tienes para mejorar SolvianMC?", type: "textarea", required: false },
];

const DISCORD_QUESTIONS: Question[] = [
  { id: "dc_nick", label: "¿Cuál es tu nick de Discord? (Ejemplo: soynulled)", type: "text", required: true },
  { id: "dc_id", label: "¿Cuál es tu ID de Discord?", type: "text", required: true },
  { id: "edad", label: "¿Cuántos años tienes?", type: "text", required: true },
  { id: "experiencia_dc", label: "¿Tienes experiencia previa gestionando servidores de Discord?", type: "textarea", required: true },
  { id: "incumplimiento", label: "¿Qué harías si un usuario está incumpliendo las normas?", type: "textarea", required: true },
  { id: "bots", label: "¿Qué bots de moderación y automatización conoces?", type: "textarea", required: true },
  { id: "por_que", label: "¿Por qué quieres ser staff de Discord en SolvianMC?", type: "textarea", required: true },
  { id: "reglas", label: "¿Conoces y respetas las reglas del servidor?", type: "radio", required: true, options: ["Sí", "No"] },
  { id: "sanciones", label: "¿Qué tipos de sanciones conoces? Nombra y explica brevemente cada una", type: "textarea", required: true },
  { id: "raid", label: "¿Cómo actuarías ante una raid en el servidor?", type: "textarea", required: true },
  { id: "ticket", label: "¿Cómo gestionarías un ticket de ayuda?", type: "textarea", required: true },
  { id: "solo_equipo", label: "¿Prefieres trabajar solo o en equipo? ¿Por qué?", type: "textarea", required: true },
  { id: "tiempo", label: "¿Cuánto tiempo puedes dedicar semanalmente al Discord?", type: "text", required: false },
];

const CREATOR_TYPES: { id: CreatorType; label: string; description: string; icon: any }[] = [
  { id: "streamer", label: "Streamer (Twitch / Kick)", description: "Haces directos jugando Minecraft", icon: Twitch },
  { id: "youtuber", label: "YouTuber", description: "Creas videos para YouTube", icon: Youtube },
  { id: "tiktoker", label: "TikToker", description: "Creas clips cortos para TikTok", icon: Music2 },
  { id: "media", label: "Media (Creadores pequeños / En crecimiento)", description: "Estás creciendo en cualquier plataforma", icon: Sparkles },
];

const CREATOR_QUESTIONS: Record<CreatorType, Question[]> = {
  streamer: [
    { id: "canal", label: "Enlace a tu canal", type: "url", required: true },
    { id: "viewers", label: "¿Cuál es tu media de viewers cuando streameas Minecraft?", type: "number", required: true },
    { id: "entretener", label: "El rol en Minecraft a veces implica farmear o construir. ¿Cómo mantienes a tu chat entretenido durante esos momentos más \"lentos\"?", type: "textarea", required: true },
    { id: "shaders", label: "¿Tu PC soporta jugar con Shaders en directo para que el stream tenga buena calidad visual?", type: "radio", required: true, options: ["Sí", "No"] },
    { id: "lore_o_desmadre", label: "¿Qué prefieres en directo: enfocarte en desarrollar la historia de tu personaje (Lore) o interactuar y hacer desmadre con otros usuarios?", type: "textarea", required: true },
  ],
  youtuber: [
    { id: "canal", label: "Enlace a tu canal", type: "url", required: true },
    { id: "tipo_contenido", label: "Para tu contenido en el server, ¿planeas hacer una serie episódica (tipo película/historia) o videos de momentos divertidos/clips?", type: "textarea", required: true },
    { id: "replay_mod", label: "¿Sabes utilizar el Replay Mod o herramientas de cámara libre para grabar cinemáticas de Minecraft?", type: "radio", required: true, options: ["Sí", "No", "Estoy aprendiendo"] },
    { id: "video_orgulloso", label: "Deja el link del video de Minecraft del que te sientas más orgulloso (por edición, historia o vistas)", type: "url", required: true },
    { id: "frecuencia", label: "¿Cada cuánto subirías un video del servidor?", type: "text", required: true },
  ],
  tiktoker: [
    { id: "canal", label: "Enlace a tu cuenta de TikTok", type: "url", required: true },
    { id: "tipo_videos", label: "El contenido de Minecraft en TikTok tiene que ser rápido. ¿Qué tipo de videos harías? (ej. Resumen del Lore, momentos graciosos, tours de construcciones)", type: "textarea", required: true },
    { id: "ip_visible", label: "¿Tus videos suelen tener la IP o el nombre del servidor visible para ayudar a traer gente nueva?", type: "radio", required: true, options: ["Sí", "No"] },
    { id: "shaders_packs", label: "¿Usas Shaders o Texture Packs llamativos para grabar tus clips?", type: "radio", required: true, options: ["Sí", "No"] },
    { id: "promedio_vistas", label: "¿Cuál es el promedio de vistas de tus últimos 5 TikToks de Minecraft?", type: "number", required: true },
  ],
  media: [
    { id: "canal", label: "Enlace a tu canal principal (YouTube, Twitch, TikTok, etc.)", type: "url", required: true },
    { id: "metas", label: "Sabemos que estás en crecimiento. ¿Cuáles son tus metas principales para tu canal en los próximos meses?", type: "textarea", required: true },
    { id: "por_que_server", label: "¿Por qué elegiste este servidor en específico para crear contenido y crecer tu comunidad?", type: "textarea", required: true },
    { id: "constancia", label: "Para crecer, la constancia es clave. ¿Cada cuánto tiempo te comprometes a subir un video o hacer directo jugando en el servidor?", type: "text", required: true },
    { id: "video_orgulloso", label: "Deja el link del video o clip de Minecraft del que más te sientas orgulloso hasta ahora (no importa las vistas, nos interesa ver las ganas y la calidad)", type: "url", required: true },
    { id: "vibra", label: "¿Qué tipo de vibra le quieres dar a tu contenido en el server? (Ej. Historias serias de tu personaje, series con amigos, construir y farmear, etc.)", type: "textarea", required: true },
  ],
};

const CREATOR_COMMON_QUESTIONS: Question[] = [
  { id: "tiempo_minecraft", label: "¿Cuánto tiempo llevas jugando Minecraft y qué tipo de contenido sueles hacer?", type: "textarea", required: true },
  { id: "sanciones_previas", label: "¿Has sido sancionado o baneado por toxicidad en otros servidores de la comunidad? Si es así, explica brevemente qué pasó.", type: "textarea", required: true },
  { id: "acepta_normas", label: "¿Entiendes que el rango de Creador/Media no te exime de cumplir las normas del servidor y que hacer hate o problemas en tus redes hacia el servidor causará la baja inmediata de tu rango?", type: "checkbox", required: true },
];

const Aplicaciones = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [formSettings, setFormSettings] = useState<{ minecraft: boolean; discord: boolean; creador: boolean }>({ minecraft: false, discord: false, creador: false });
  const [selectedForm, setSelectedForm] = useState<FormType | null>(null);
  const [creatorType, setCreatorType] = useState<CreatorType | null>(null);
  const [answers, setAnswers] = useState<Record<string, string | boolean>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [signingIn, setSigningIn] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      const { data } = await supabase.from("form_settings").select("*");
      if (data) {
        const mc = data.find((s: any) => s.form_type === "minecraft");
        const dc = data.find((s: any) => s.form_type === "discord");
        const cr = data.find((s: any) => s.form_type === "creador");
        setFormSettings({ minecraft: mc?.is_active ?? false, discord: dc?.is_active ?? false, creador: cr?.is_active ?? false });
      }
      setLoadingSettings(false);
    };
    fetchSettings();
  }, []);

  const handleDiscordSignIn = () => {
    setSigningIn(true);
    const final = window.location.origin + "/aplicaciones";
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    window.location.href = `${supabaseUrl}/functions/v1/discord-auth?action=start&final=${encodeURIComponent(final)}`;
  };

  const getQuestions = (): Question[] => {
    if (selectedForm === "minecraft") return MINECRAFT_QUESTIONS;
    if (selectedForm === "discord") return DISCORD_QUESTIONS;
    if (selectedForm === "creador" && creatorType) {
      return [...CREATOR_QUESTIONS[creatorType], ...CREATOR_COMMON_QUESTIONS];
    }
    return [];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedForm || submitting) return;
    const questions = getQuestions();

    const missing = questions.filter((q) => {
      if (!q.required) return false;
      const v = answers[q.id];
      if (q.type === "checkbox") return v !== true;
      return !v || (typeof v === "string" && !v.trim());
    });
    if (missing.length > 0) {
      toast.error("Por favor, completa todas las preguntas obligatorias.");
      return;
    }

    setSubmitting(true);
    const finalAnswers: Record<string, any> = { ...answers };
    if (selectedForm === "creador") finalAnswers.creator_type = creatorType;

    const { error } = await supabase.from("staff_applications").insert({
      user_id: user.id,
      form_type: selectedForm,
      answers: finalAnswers,
      user_email: user.email,
      user_name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split("@")[0],
      user_avatar: user.user_metadata?.avatar_url || user.user_metadata?.picture,
    });

    if (error) {
      console.error("[Aplicaciones] insert error:", error, { form_type: selectedForm, finalAnswers });
      toast.error(`Error al enviar: ${error.message}`);
    } else {
      setSubmitted(true);
      toast.success("¡Solicitud enviada correctamente!");
    }
    setSubmitting(false);
  };

  if (loadingSettings || authLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="ml-3 font-body text-muted-foreground">Cargando...</span>
        </div>
      </Layout>
    );
  }

  const noFormsActive = !formSettings.minecraft && !formSettings.discord && !formSettings.creador;

  if (noFormsActive) {
    return (
      <Layout>
        <AnimatedSection className="container mx-auto px-4 py-16 max-w-2xl text-center">
          <Lock className="mx-auto text-muted-foreground mb-4" size={48} />
          <h1 className="font-heading text-2xl font-bold mb-2">Formularios Cerrados</h1>
          <p className="text-muted-foreground font-body">
            En este momento no estamos aceptando solicitudes. ¡Vuelve pronto!
          </p>
        </AnimatedSection>
      </Layout>
    );
  }

  if (submitted) {
    return (
      <Layout>
        <AnimatedSection className="container mx-auto px-4 py-16 max-w-2xl text-center">
          <CheckCircle2 className="mx-auto text-secondary mb-4" size={48} />
          <h1 className="font-heading text-2xl font-bold mb-2">¡Solicitud Enviada!</h1>
          <p className="text-muted-foreground font-body mb-6">
            Tu solicitud ha sido enviada correctamente. El equipo la revisará lo antes posible.
          </p>
          <button
            onClick={() => navigate("/")}
            className="px-6 py-2.5 bg-primary text-primary-foreground font-heading font-bold rounded-lg hover:opacity-90 transition"
          >
            Volver al inicio
          </button>
        </AnimatedSection>
      </Layout>
    );
  }

  // No form selected — show selector
  if (!selectedForm) {
    return (
      <Layout>
        <AnimatedSection className="container mx-auto px-4 py-16 max-w-5xl">
          <div className="text-center mb-10">
            <img src={logo} alt="SolvianMC" className="w-16 h-16 rounded-full mx-auto mb-3 border-2 border-primary" />
            <h1 className="font-heading text-3xl font-bold text-gradient-gold mb-2">Postulaciones</h1>
            <p className="text-muted-foreground font-body">
              Selecciona el formulario que deseas completar.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {formSettings.minecraft && (
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setSelectedForm("minecraft")} className="card-medieval p-8 text-left hover:border-primary/50 transition-all">
                <Gamepad2 className="text-primary mb-3" size={32} />
                <h2 className="font-heading text-xl font-bold mb-2">Moderador Minecraft</h2>
                <p className="text-muted-foreground font-body text-sm">Aplica para ser staff dentro del servidor.</p>
              </motion.button>
            )}
            {formSettings.discord && (
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setSelectedForm("discord")} className="card-medieval p-8 text-left hover:border-primary/50 transition-all">
                <MessageCircle className="text-accent mb-3" size={32} />
                <h2 className="font-heading text-xl font-bold mb-2">Moderador Discord</h2>
                <p className="text-muted-foreground font-body text-sm">Aplica para ser staff en el Discord.</p>
              </motion.button>
            )}
            {formSettings.creador && (
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setSelectedForm("creador")} className="card-medieval p-8 text-left hover:border-primary/50 transition-all">
                <Video className="text-secondary mb-3" size={32} />
                <h2 className="font-heading text-xl font-bold mb-2">Creador de Contenido</h2>
                <p className="text-muted-foreground font-body text-sm">Streamers, YouTubers, TikTokers y creadores en crecimiento.</p>
              </motion.button>
            )}
          </div>
        </AnimatedSection>
      </Layout>
    );
  }

  // Force Discord login
  const hasDiscord = !!(user?.user_metadata?.discord_id);
  if (!user || !hasDiscord) {
    return (
      <Layout>
        <AnimatedSection className="container mx-auto px-4 py-16 max-w-md text-center">
          <img src={logo} alt="SolvianMC" className="w-16 h-16 rounded-full mx-auto mb-4 border-2 border-primary" />
          <h1 className="font-heading text-2xl font-bold mb-2">Inicia Sesión con Discord</h1>
          <p className="text-muted-foreground font-body mb-6">
            {user ? "Necesitas vincular tu cuenta de Discord para enviar tu solicitud." : "Necesitas iniciar sesión con Discord para enviar tu solicitud."}
          </p>
          <button onClick={handleDiscordSignIn} disabled={signingIn} className="w-full py-3 bg-[#5865F2] text-white border-2 border-[#5865F2] rounded-lg font-heading font-bold flex items-center justify-center gap-3 hover:opacity-90 transition-all disabled:opacity-50">
            {signingIn ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              "Continuar con Discord"
            )}
          </button>
        </AnimatedSection>
      </Layout>
    );
  }

  // Creator type selector
  if (selectedForm === "creador" && !creatorType) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8 max-w-3xl">
          <AnimatedSection>
            <button onClick={() => { setSelectedForm(null); setAnswers({}); }} className="text-sm text-muted-foreground font-body hover:text-foreground transition mb-4">
              ← Volver a selección
            </button>
            <div className="text-center mb-8">
              <Video className="text-secondary mx-auto mb-3" size={40} />
              <h1 className="font-heading text-2xl font-bold mb-2">¿Qué tipo de creador eres?</h1>
              <p className="text-muted-foreground font-body text-sm">Elige el que mejor describa tu contenido para personalizar el formulario.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {CREATOR_TYPES.map((t) => {
                const Icon = t.icon;
                return (
                  <motion.button key={t.id} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setCreatorType(t.id)} className="card-medieval p-5 text-left hover:border-primary/50 transition-all flex items-start gap-3">
                    <Icon className="text-primary shrink-0 mt-1" size={28} />
                    <div>
                      <h3 className="font-heading font-bold text-base mb-1">{t.label}</h3>
                      <p className="text-muted-foreground font-body text-xs">{t.description}</p>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </AnimatedSection>
        </div>
      </Layout>
    );
  }

  // Form view
  const questions = getQuestions();
  const formTitle =
    selectedForm === "minecraft" ? "Staff Applys (Minecraft)" :
    selectedForm === "discord" ? "Staff Applys (Discord)" :
    `Creador de Contenido — ${CREATOR_TYPES.find((c) => c.id === creatorType)?.label}`;

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <AnimatedSection>
          <div className="card-medieval p-6 mb-6">
            <button onClick={() => { if (selectedForm === "creador" && creatorType) { setCreatorType(null); setAnswers({}); } else { setSelectedForm(null); setCreatorType(null); setAnswers({}); } }} className="text-sm text-muted-foreground font-body hover:text-foreground transition mb-4 block">
              ← Volver
            </button>
            <h1 className="font-heading text-xl font-bold mb-3">{formTitle}</h1>

            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <img src={user.user_metadata?.avatar_url || user.user_metadata?.picture || "/placeholder.svg"} alt="" className="w-10 h-10 rounded-full border border-border" />
              <div>
                <p className="font-heading font-bold text-sm">{user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split("@")[0]}</p>
                <p className="text-xs text-muted-foreground font-body">{user.email}</p>
              </div>
            </div>
            <p className="text-xs text-destructive mt-3 font-body">* Indica que la pregunta es obligatoria</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {questions.map((q, i) => (
              <motion.div key={q.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} className="card-medieval p-5">
                <label className="font-heading font-semibold text-sm mb-3 block">
                  {q.label} {q.required && <span className="text-destructive">*</span>}
                </label>

                {(q.type === "text" || q.type === "url" || q.type === "number") && (
                  <input
                    type={q.type === "url" ? "url" : q.type === "number" ? "number" : "text"}
                    value={(answers[q.id] as string) || ""}
                    onChange={(e) => setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-lg bg-background border border-border font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder={q.type === "url" ? "https://..." : "Tu respuesta"}
                  />
                )}

                {q.type === "textarea" && (
                  <textarea
                    value={(answers[q.id] as string) || ""}
                    onChange={(e) => setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))}
                    rows={3}
                    className="w-full px-4 py-2.5 rounded-lg bg-background border border-border font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                    placeholder="Tu respuesta"
                  />
                )}

                {q.type === "radio" && q.options && (
                  <div className="space-y-2">
                    {q.options.map((opt) => (
                      <label key={opt} className="flex items-center gap-3 cursor-pointer group">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${answers[q.id] === opt ? "border-primary bg-primary" : "border-border group-hover:border-primary/50"}`}>
                          {answers[q.id] === opt && <div className="w-2.5 h-2.5 rounded-full bg-primary-foreground" />}
                        </div>
                        <span className="font-body text-sm">{opt}</span>
                        <input type="radio" name={q.id} value={opt} checked={answers[q.id] === opt} onChange={() => setAnswers((prev) => ({ ...prev, [q.id]: opt }))} className="sr-only" />
                      </label>
                    ))}
                  </div>
                )}

                {q.type === "checkbox" && (
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors mt-0.5 shrink-0 ${answers[q.id] === true ? "border-primary bg-primary" : "border-border group-hover:border-primary/50"}`}>
                      {answers[q.id] === true && <CheckCircle2 size={14} className="text-primary-foreground" />}
                    </div>
                    <span className="font-body text-xs text-muted-foreground">Acepto y entiendo lo expuesto arriba.</span>
                    <input type="checkbox" checked={answers[q.id] === true} onChange={(e) => setAnswers((prev) => ({ ...prev, [q.id]: e.target.checked }))} className="sr-only" />
                  </label>
                )}
              </motion.div>
            ))}

            <div className="pt-4">
              <button type="submit" disabled={submitting} className="w-full py-3 bg-primary text-primary-foreground font-heading font-bold rounded-lg flex items-center justify-center gap-2 hover:opacity-90 transition disabled:opacity-50">
                {submitting ? (
                  <><div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" /> Enviando...</>
                ) : (
                  <><Send size={18} /> Enviar Solicitud</>
                )}
              </button>
            </div>
          </form>
        </AnimatedSection>
      </div>
    </Layout>
  );
};

export default Aplicaciones;
