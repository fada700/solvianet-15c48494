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
            Necesitas iniciar sesión con Google para enviar tu solicitud.
          </p>
          <button
            onClick={handleGoogleSignIn}
            disabled={signingIn}
            className="w-full py-3 bg-card border-2 border-border rounded-lg font-heading font-bold flex items-center justify-center gap-3 hover:border-primary/50 transition-all disabled:opacity-50"
          >
            {signingIn ? (
              <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <svg width="20" height="20" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Continuar con Google
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
