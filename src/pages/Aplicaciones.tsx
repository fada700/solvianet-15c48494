import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import AnimatedSection from "@/components/AnimatedSection";
import { supabase } from "@/integrations/supabase/client";

import { useAuth } from "@/hooks/useAuth";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Gamepad2, MessageCircle, Send, CheckCircle2, LogIn, Lock } from "lucide-react";
import { toast } from "sonner";
import logo from "@/assets/solvianmc.png";

type FormType = "minecraft" | "discord";

const MINECRAFT_QUESTIONS = [
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

const DISCORD_QUESTIONS = [
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

const Aplicaciones = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [formSettings, setFormSettings] = useState<{ minecraft: boolean; discord: boolean }>({ minecraft: false, discord: false });
  const [selectedForm, setSelectedForm] = useState<FormType | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
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
        setFormSettings({ minecraft: mc?.is_active ?? false, discord: dc?.is_active ?? false });
      }
      setLoadingSettings(false);
    };
    fetchSettings();
  }, []);

  const handleDiscordSignIn = async () => {
    setSigningIn(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "discord",
      options: { redirectTo: window.location.origin + "/aplicaciones", scopes: "identify email" },
    });
    if (error) {
      toast.error("Error al iniciar sesión con Discord");
      setSigningIn(false);
    }
  };

  const questions = selectedForm === "minecraft" ? MINECRAFT_QUESTIONS : DISCORD_QUESTIONS;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedForm || submitting) return;

    // Validate required
    const missing = questions.filter((q) => q.required && !answers[q.id]?.trim());
    if (missing.length > 0) {
      toast.error("Por favor, completa todas las preguntas obligatorias.");
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.from("staff_applications").insert({
      user_id: user.id,
      form_type: selectedForm,
      answers,
      user_email: user.email,
      user_name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split("@")[0],
      user_avatar: user.user_metadata?.avatar_url || user.user_metadata?.picture,
    });

    if (error) {
      toast.error("Error al enviar la solicitud. Intenta de nuevo.");
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

  const noFormsActive = !formSettings.minecraft && !formSettings.discord;

  if (noFormsActive) {
    return (
      <Layout>
        <AnimatedSection className="container mx-auto px-4 py-16 max-w-2xl text-center">
          <Lock className="mx-auto text-muted-foreground mb-4" size={48} />
          <h1 className="font-heading text-2xl font-bold mb-2">Formularios Cerrados</h1>
          <p className="text-muted-foreground font-body">
            En este momento no estamos aceptando solicitudes de staff. ¡Vuelve pronto!
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

  // If no form selected, show selector
  if (!selectedForm) {
    return (
      <Layout>
        <AnimatedSection className="container mx-auto px-4 py-16 max-w-3xl">
          <div className="text-center mb-10">
            <img src={logo} alt="SolvianMC" className="w-16 h-16 rounded-full mx-auto mb-3 border-2 border-primary" />
            <h1 className="font-heading text-3xl font-bold text-gradient-gold mb-2">Staff Applys</h1>
            <p className="text-muted-foreground font-body">
              SolvianMC Network está buscando staffs. ¡Selecciona el formulario que deseas completar!
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {formSettings.minecraft && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedForm("minecraft")}
                className="card-medieval p-8 text-left hover:border-primary/50 transition-all group"
              >
                <Gamepad2 className="text-primary mb-3" size={32} />
                <h2 className="font-heading text-xl font-bold mb-2">Minecraft</h2>
                <p className="text-muted-foreground font-body text-sm mb-4">
                  Aplica para ser staff dentro del servidor de Minecraft.
                </p>
                <div className="text-xs text-muted-foreground font-body space-y-1">
                  <p>🛡️ <strong>Rangos:</strong> Helper, Trial Mod, Moderador</p>
                  <p>📋 <strong>Requisitos:</strong> +14 años, micrófono, sin sanciones recientes</p>
                </div>
              </motion.button>
            )}

            {formSettings.discord && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedForm("discord")}
                className="card-medieval p-8 text-left hover:border-primary/50 transition-all group"
              >
                <MessageCircle className="text-accent mb-3" size={32} />
                <h2 className="font-heading text-xl font-bold mb-2">Discord</h2>
                <p className="text-muted-foreground font-body text-sm mb-4">
                  Aplica para ser staff en el servidor de Discord.
                </p>
                <div className="text-xs text-muted-foreground font-body space-y-1">
                  <p>📋 <strong>Requisitos:</strong> +13 años, micrófono obligatorio, sin sanciones</p>
                </div>
              </motion.button>
            )}
          </div>
        </AnimatedSection>
      </Layout>
    );
  }

  // If not logged in, show Google sign-in
  if (!user) {
    return (
      <Layout>
        <AnimatedSection className="container mx-auto px-4 py-16 max-w-md text-center">
          <img src={logo} alt="SolvianMC" className="w-16 h-16 rounded-full mx-auto mb-4 border-2 border-primary" />
          <h1 className="font-heading text-2xl font-bold mb-2">Inicia Sesión</h1>
          <p className="text-muted-foreground font-body mb-6">
            Necesitas iniciar sesión con Discord para enviar tu solicitud.
          </p>
          <button
            onClick={handleDiscordSignIn}
            disabled={signingIn}
            className="w-full py-3 bg-[#5865F2] text-white border-2 border-[#5865F2] rounded-lg font-heading font-bold flex items-center justify-center gap-3 hover:opacity-90 transition-all disabled:opacity-50"
          >
            {signingIn ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.37a19.79 19.79 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/></svg>
                Continuar con Discord
              </>
            )}
          </button>
        </AnimatedSection>
      </Layout>
    );
  }

  // Form view
  const formTitle = selectedForm === "minecraft" ? "Staff Applys SolvianMC (Minecraft)" : "Staff Applys SolvianMC (Discord)";
  const formDescription = selectedForm === "minecraft"
    ? "SolvianMC Network está buscando staffs, no hace falta tener experiencia previa."
    : "SolvianMC Network está buscando staffs, no hace falta tener experiencia previa.";

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <AnimatedSection>
          {/* Header */}
          <div className="card-medieval p-6 mb-6">
            <button onClick={() => { setSelectedForm(null); setAnswers({}); }} className="text-sm text-muted-foreground font-body hover:text-foreground transition mb-4 block">
              ← Volver a selección
            </button>
            <div className="flex items-center gap-3 mb-3">
              {selectedForm === "minecraft" ? <Gamepad2 className="text-primary" size={28} /> : <MessageCircle className="text-accent" size={28} />}
              <h1 className="font-heading text-xl font-bold">{formTitle}</h1>
            </div>
            <p className="text-muted-foreground font-body text-sm mb-4">{formDescription}</p>

            {/* User info */}
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <img
                src={user.user_metadata?.avatar_url || user.user_metadata?.picture || "/placeholder.svg"}
                alt=""
                className="w-10 h-10 rounded-full border border-border"
              />
              <div>
                <p className="font-heading font-bold text-sm">{user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split("@")[0]}</p>
                <p className="text-xs text-muted-foreground font-body">{user.email}</p>
              </div>
            </div>

            {selectedForm === "minecraft" && (
              <div className="mt-4 p-3 bg-primary/10 rounded-lg border border-primary/20">
                <p className="text-sm font-heading font-semibold mb-1">🛡️ Rangos disponibles:</p>
                <ul className="text-xs text-muted-foreground font-body space-y-1 ml-4 list-disc">
                  <li><strong>Helper:</strong> Asiste a los jugadores y resuelve dudas básicas.</li>
                  <li><strong>Trial Mod:</strong> Moderador en período de prueba, con funciones limitadas.</li>
                  <li><strong>Moderador:</strong> Encargado de la moderación activa y el control del servidor.</li>
                </ul>
                <p className="text-xs text-muted-foreground font-body mt-2"><strong>Requisitos:</strong> +14 años, actitud responsable, conocer el servidor, sin sanciones recientes, micrófono obligatorio.</p>
              </div>
            )}

            {selectedForm === "discord" && (
              <div className="mt-4 p-3 bg-accent/10 rounded-lg border border-accent/20">
                <p className="text-xs text-muted-foreground font-body">
                  <strong>Requisitos:</strong> +13 años, actitud respetuosa, conocimientos básicos del servidor, sin sanciones recientes, micrófono obligatorio.
                </p>
              </div>
            )}

            <p className="text-xs text-destructive mt-3 font-body">* Indica que la pregunta es obligatoria</p>
          </div>

          {/* Questions */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {questions.map((q, i) => (
              <motion.div
                key={q.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="card-medieval p-5"
              >
                <label className="font-heading font-semibold text-sm mb-3 block">
                  {q.label} {q.required && <span className="text-destructive">*</span>}
                </label>

                {q.type === "text" && (
                  <input
                    type="text"
                    value={answers[q.id] || ""}
                    onChange={(e) => setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-lg bg-background border border-border font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                    placeholder="Tu respuesta"
                  />
                )}

                {q.type === "textarea" && (
                  <textarea
                    value={answers[q.id] || ""}
                    onChange={(e) => setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))}
                    rows={3}
                    className="w-full px-4 py-2.5 rounded-lg bg-background border border-border font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all resize-none"
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
                        <input
                          type="radio"
                          name={q.id}
                          value={opt}
                          checked={answers[q.id] === opt}
                          onChange={() => setAnswers((prev) => ({ ...prev, [q.id]: opt }))}
                          className="sr-only"
                        />
                      </label>
                    ))}
                  </div>
                )}
              </motion.div>
            ))}

            <div className="pt-4">
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 bg-primary text-primary-foreground font-heading font-bold rounded-lg flex items-center justify-center gap-2 hover:opacity-90 transition disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send size={18} />
                    Enviar Solicitud
                  </>
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
