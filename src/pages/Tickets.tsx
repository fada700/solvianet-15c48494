import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import AnimatedSection from "@/components/AnimatedSection";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { lovable } from "@/integrations/lovable/index";
import { motion, AnimatePresence } from "framer-motion";
import {
  Ticket, Send, Clock, CheckCircle2, MessageSquare, AlertTriangle,
  ShieldCheck, HelpCircle, Gavel, UserCheck, LogIn, Plus,
  ExternalLink, Loader2
} from "lucide-react";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";

const CATEGORIES = [
  { id: "reportar_jugador", label: "Reportar Jugador", icon: AlertTriangle, color: "text-destructive" },
  { id: "problema_tecnico", label: "Problema Técnico", icon: HelpCircle, color: "text-accent" },
  { id: "dudas_compra", label: "Dudas de Compra", icon: ShieldCheck, color: "text-secondary" },
  { id: "apelacion_sancion", label: "Apelación de Sanción", icon: Gavel, color: "text-primary" },
] as const;

const STATUS_LABELS: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  open: { label: "Abierto", color: "text-secondary", icon: Clock },
  in_review: { label: "En Revisión", color: "text-accent", icon: UserCheck },
  waiting_response: { label: "Esperando Respuesta", color: "text-primary", icon: MessageSquare },
  closed: { label: "Cerrado", color: "text-muted-foreground", icon: CheckCircle2 },
};

const STATUS_STEPS = ["open", "in_review", "waiting_response", "closed"];

interface TicketData {
  id: string;
  ticket_number: number;
  category: string;
  subject: string;
  description: string;
  evidence_url: string | null;
  status: string;
  assigned_staff_id: string | null;
  created_at: string;
  closed_at: string | null;
  user_id: string;
}

interface Message {
  id: string;
  ticket_id: string;
  user_id: string;
  message: string;
  created_at: string;
  is_ai?: boolean;
}

interface Profile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  email: string | null;
}

const TicketTimeline = ({ status }: { status: string }) => {
  const currentIdx = STATUS_STEPS.indexOf(status);
  const progress = currentIdx >= 0 ? ((currentIdx) / (STATUS_STEPS.length - 1)) * 100 : 0;

  return (
    <div className="mb-6">
      <Progress value={progress} className="h-2 mb-3" />
      <div className="flex justify-between">
        {STATUS_STEPS.map((step, i) => {
          const info = STATUS_LABELS[step];
          const Icon = info.icon;
          const isActive = i <= currentIdx;
          return (
            <div key={step} className={`flex flex-col items-center text-xs ${isActive ? info.color : "text-muted-foreground/40"}`}>
              <Icon size={16} className="mb-1" />
              <span className="font-body hidden sm:block">{info.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const formatDateTime = (dateStr: string) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" }) +
    " — " + d.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
};

const Tickets = () => {
  const { user, loading: authLoading, isStaffUser } = useAuth();
  const [ticket, setTicket] = useState<TicketData | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [loadingTicket, setLoadingTicket] = useState(true);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [creating, setCreating] = useState(false);
  const [cooldownEnd, setCooldownEnd] = useState<number | null>(null);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [category, setCategory] = useState("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [evidenceUrl, setEvidenceUrl] = useState("");

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadTicket = useCallback(async () => {
    if (!user) { setLoadingTicket(false); return; }
    const { data } = await supabase
      .from("tickets")
      .select("*")
      .eq("user_id", user.id)
      .neq("status", "closed")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (data) {
      setTicket(data as unknown as TicketData);
      const { data: msgs } = await supabase
        .from("ticket_messages")
        .select("*")
        .eq("ticket_id", data.id)
        .order("created_at", { ascending: true });
      if (msgs) setMessages(msgs as unknown as Message[]);

      const userIds = new Set<string>([data.user_id]);
      if (data.assigned_staff_id) userIds.add(data.assigned_staff_id);
      msgs?.forEach((m: any) => userIds.add(m.user_id));

      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .in("id", Array.from(userIds));
      if (profileData) {
        const map: Record<string, Profile> = {};
        profileData.forEach((p: any) => { map[p.id] = p as Profile; });
        setProfiles(map);
      }
    } else {
      setTicket(null);
      const { data: lastClosed } = await supabase
        .from("tickets")
        .select("closed_at")
        .eq("user_id", user.id)
        .eq("status", "closed")
        .order("closed_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (lastClosed?.closed_at) {
        const closedTime = new Date(lastClosed.closed_at).getTime();
        const cooldownMs = 45 * 60 * 1000;
        const end = closedTime + cooldownMs;
        if (Date.now() < end) {
          setCooldownEnd(end);
        }
      }
    }
    setLoadingTicket(false);
  }, [user]);

  useEffect(() => { loadTicket(); }, [loadTicket]);

  useEffect(() => {
    if (!cooldownEnd) return;
    const interval = setInterval(() => {
      const remaining = cooldownEnd - Date.now();
      if (remaining <= 0) {
        setCooldownEnd(null);
        setCooldownRemaining(0);
        clearInterval(interval);
      } else {
        setCooldownRemaining(remaining);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldownEnd]);

  useEffect(() => {
    if (!ticket) return;
    const channel = supabase
      .channel(`ticket-${ticket.id}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "ticket_messages",
        filter: `ticket_id=eq.${ticket.id}`,
      }, async (payload) => {
        const newMsg = payload.new as Message;
        setMessages((prev) => [...prev, newMsg]);
        if (!profiles[newMsg.user_id]) {
          const { data: p } = await supabase.from("profiles").select("*").eq("id", newMsg.user_id).maybeSingle();
          if (p) setProfiles((prev) => ({ ...prev, [p.id]: p as Profile }));
        }
        setTimeout(scrollToBottom, 100);
      })
      .on("postgres_changes", {
        event: "UPDATE",
        schema: "public",
        table: "tickets",
        filter: `id=eq.${ticket.id}`,
      }, (payload) => {
        setTicket(payload.new as unknown as TicketData);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [ticket?.id]);

  useEffect(() => { scrollToBottom(); }, [messages]);

  // --- FUNCIÓN CORREGIDA AQUÍ ---
  const handleGoogleLogin = async () => {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) toast.error("Error al iniciar sesión con Google");
  };
  // -----------------------------

  const wordCount = (text: string) => text.trim().split(/\s+/).filter(Boolean).length;

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || creating) return;

    const words = wordCount(description);
    if (words < 30) { toast.error("La descripción debe tener al menos 30 palabras"); return; }
    if (words > 150) { toast.error("La descripción no debe superar 150 palabras"); return; }
    if (wordCount(subject) > 15) { toast.error("El asunto no debe superar 15 palabras"); return; }
    if (!subject.trim()) { toast.error("El asunto es obligatorio"); return; }
    if (!category) { toast.error("Selecciona una categoría"); return; }

    setCreating(true);
    const { data, error } = await supabase
      .from("tickets")
      .insert({
        user_id: user.id,
        category: category as any,
        subject: subject.trim(),
        description: description.trim(),
        evidence_url: evidenceUrl.trim() || null,
      })
      .select()
      .single();

    if (error) {
      toast.error("Error al crear el ticket");
      setCreating(false);
      return;
    }

    toast.success("¡Ticket creado exitosamente!");
    setTicket(data as unknown as TicketData);
    setMessages([]);
    setCategory("");
    setSubject("");
    setDescription("");
    setEvidenceUrl("");
    setCreating(false);

    try {
      await supabase.functions.invoke("ticket-ai-respond", {
        body: { ticket_id: data.id, mode: "initial" },
      });
    } catch (err) {
      console.error("AI auto-response error:", err);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !ticket || !newMessage.trim() || sending) return;
    setSending(true);
    const { error } = await supabase
      .from("ticket_messages")
      .insert({ ticket_id: ticket.id, user_id: user.id, message: newMessage.trim() });
    if (error) toast.error("Error al enviar el mensaje");
    else setNewMessage("");
    setSending(false);
  };

  if (authLoading || loadingTicket) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="ml-3 font-body text-muted-foreground">Cargando...</span>
        </div>
      </Layout>
    );
  }

  if (isStaffUser) {
    return (
      <Layout>
        <AnimatedSection className="container mx-auto px-4 py-16 max-w-2xl text-center">
          <ShieldCheck className="mx-auto text-muted-foreground mb-4" size={48} />
          <h1 className="font-heading text-3xl font-bold text-gradient-gold mb-4">Acceso Restringido</h1>
          <p className="text-muted-foreground font-body mb-4">
            Las cuentas de staff no pueden crear tickets. Inicia sesión con Google para usar el sistema de soporte.
          </p>
        </AnimatedSection>
      </Layout>
    );
  }

  if (!user) {
    return (
      <Layout>
        <AnimatedSection className="container mx-auto px-4 py-16 max-w-2xl text-center">
          <Ticket className="mx-auto text-primary mb-4" size={48} />
          <h1 className="font-heading text-3xl font-bold text-gradient-gold mb-4">Sistema de Tickets</h1>
          <p className="text-muted-foreground font-body mb-8">
            Inicia sesión con Google para crear un ticket de soporte.
          </p>
          <button
            onClick={handleGoogleLogin}
            className="inline-flex items-center gap-3 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-heading font-bold glow-gold hover:opacity-90 transition"
          >
            <LogIn size={20} />
            Iniciar Sesión con Google
          </button>
        </AnimatedSection>
      </Layout>
    );
  }

  const userProfile = profiles[user.id] || {
    display_name: user.user_metadata?.full_name || user.email?.split("@")[0],
    avatar_url: user.user_metadata?.avatar_url,
    email: user.email,
  };

  if (!ticket && cooldownEnd && cooldownRemaining > 0) {
    const mins = Math.floor(cooldownRemaining / 60000);
    const secs = Math.floor((cooldownRemaining % 60000) / 1000);
    return (
      <Layout>
        <AnimatedSection className="container mx-auto px-4 py-16 max-w-2xl text-center">
          <Clock className="mx-auto text-primary mb-4" size={48} />
          <h1 className="font-heading text-2xl font-bold text-gradient-gold mb-4">Cooldown Activo</h1>
          <p className="text-muted-foreground font-body mb-4">
            Debes esperar antes de crear otro ticket.
          </p>
          <div className="font-heading text-4xl font-bold text-primary">
            {mins}:{secs.toString().padStart(2, "0")}
          </div>
        </AnimatedSection>
      </Layout>
    );
  }

  if (!ticket) {
    return (
      <Layout>
        <AnimatedSection className="container mx-auto px-4 py-12 max-w-2xl">
          <div className="flex items-center gap-3 mb-6">
            <Ticket className="text-primary" size={28} />
            <h1 className="font-heading text-2xl font-bold text-gradient-gold">Crear Ticket</h1>
          </div>

          <div className="flex items-center gap-3 mb-6 card-medieval p-4">
            {userProfile.avatar_url && (
              <img src={userProfile.avatar_url} alt="" className="w-10 h-10 rounded-full border-2 border-primary" />
            )}
            <div>
              <p className="font-heading font-bold text-sm">{userProfile.display_name}</p>
              <p className="text-xs text-muted-foreground font-body">{userProfile.email}</p>
            </div>
          </div>

          <form onSubmit={handleCreateTicket} className="space-y-5">
            <div>
              <label className="block font-heading font-bold text-sm mb-2">Categoría</label>
              <div className="grid grid-cols-2 gap-2">
                {CATEGORIES.map((cat) => {
                  const Icon = cat.icon;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategory(cat.id)}
                      className={`flex items-center gap-2 p-3 rounded-xl border-2 font-body text-sm font-semibold transition-all ${
                        category === cat.id
                          ? "border-primary bg-primary/10 text-foreground"
                          : "border-border bg-card text-muted-foreground hover:border-primary/50"
                      }`}
                    >
                      <Icon size={16} className={cat.color} />
                      {cat.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block font-heading font-bold text-sm mb-2">
                Asunto <span className="text-muted-foreground font-body font-normal">(máx. 15 palabras)</span>
              </label>
              <input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Describe brevemente tu problema..."
                className="w-full px-4 py-3 rounded-xl border-2 border-border bg-card font-body text-sm focus:border-primary focus:outline-none transition"
              />
              <p className="text-xs text-muted-foreground mt-1 font-body">{wordCount(subject)}/15 palabras</p>
            </div>

            <div>
              <label className="block font-heading font-bold text-sm mb-2">
                Descripción del Problema <span className="text-muted-foreground font-body font-normal">(30-150 palabras)</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Explica detalladamente tu problema..."
                rows={5}
                className="w-full px-4 py-3 rounded-xl border-2 border-border bg-card font-body text-sm focus:border-primary focus:outline-none transition resize-none"
              />
              <p className={`text-xs mt-1 font-body ${wordCount(description) < 30 || wordCount(description) > 150 ? "text-destructive" : "text-muted-foreground"}`}>
                {wordCount(description)}/150 palabras (mín. 30)
              </p>
            </div>

            <div>
              <label className="block font-heading font-bold text-sm mb-2">
                Evidencia URL <span className="text-muted-foreground font-body font-normal">(opcional)</span>
              </label>
              <input
                value={evidenceUrl}
                onChange={(e) => setEvidenceUrl(e.target.value)}
                placeholder="https://imgur.com/..."
                className="w-full px-4 py-3 rounded-xl border-2 border-border bg-card font-body text-sm focus:border-primary focus:outline-none transition"
              />
            </div>

            <button
              type="submit"
              disabled={creating}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-heading font-bold glow-gold hover:opacity-90 transition disabled:opacity-50"
            >
              {creating ? <Loader2 className="animate-spin" size={18} /> : <Plus size={18} />}
              Crear Ticket
            </button>
          </form>
        </AnimatedSection>
      </Layout>
    );
  }

  const catInfo = CATEGORIES.find((c) => c.id === ticket.category);

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Ticket className="text-primary" size={24} />
            <div>
              <h1 className="font-heading text-lg font-bold">
                Ticket #{ticket.ticket_number}
              </h1>
              <p className="text-xs text-muted-foreground font-body">{ticket.subject}</p>
            </div>
          </div>
          <div className={`flex items-center gap-1 text-sm font-heading font-bold ${STATUS_LABELS[ticket.status]?.color}`}>
            {(() => { const Icon = STATUS_LABELS[ticket.status]?.icon || Clock; return <Icon size={16} />; })()}
            {STATUS_LABELS[ticket.status]?.label}
          </div>
        </div>

        <TicketTimeline status={ticket.status} />

        <div className="card-medieval p-4 mb-4">
          <div className="grid grid-cols-2 gap-3 text-sm font-body">
            <div>
              <span className="text-muted-foreground">Categoría:</span>
              <span className="ml-2 font-semibold">{catInfo?.label}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Creado:</span>
              <span className="ml-2 font-semibold">{formatDateTime(ticket.created_at)}</span>
            </div>
          </div>
          <p className="text-sm font-body mt-3 text-muted-foreground">{ticket.description}</p>
          {ticket.evidence_url && (
            <a href={ticket.evidence_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-primary mt-2 hover:underline">
              <ExternalLink size={12} /> Ver evidencia
            </a>
          )}
        </div>

        <div className="card-medieval overflow-hidden">
          <div className="p-4 border-b border-border">
            <h3 className="font-heading font-bold text-sm flex items-center gap-2">
              <MessageSquare size={16} className="text-primary" />
              Chat del Ticket
            </h3>
          </div>

          <div className="h-[350px] overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && (
              <p className="text-center text-muted-foreground text-sm font-body py-8">
                Aún no hay mensajes. Envía uno para comenzar la conversación.
              </p>
            )}
            <AnimatePresence initial={false}>
              {messages.map((msg) => {
                const isAi = msg.is_ai === true;
                const isOwner = msg.user_id === ticket.user_id && !isAi;
                const profile = profiles[msg.user_id];
                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex gap-2 ${isOwner ? "justify-end" : "justify-start"}`}
                  >
                    {!isOwner && (
                      isAi ? (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0 mt-1 text-primary-foreground text-xs font-bold">
                          🤖
                        </div>
                      ) : (
                        <img
                          src={profile?.avatar_url || "/placeholder.svg"}
                          alt=""
                          className="w-8 h-8 rounded-full border border-primary flex-shrink-0 mt-1"
                        />
                      )
                    )}
                    <div className={`max-w-[70%] rounded-xl p-3 ${
                      isAi ? "bg-accent/10 border border-accent/30" :
                      isOwner ? "bg-primary/15 border border-primary/30" : "bg-muted border border-border"
                    }`}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-heading font-bold">
                          {isAi ? "Solvian IA" : (profile?.display_name || "Usuario")}
                        </span>
                        {isAi && <span className="text-[10px] bg-accent/20 text-accent px-1.5 py-0.5 rounded font-body font-bold">IA</span>}
                        {!isOwner && !isAi && <span className="text-[10px] bg-accent/20 text-accent px-1.5 py-0.5 rounded font-body font-bold">STAFF</span>}
                      </div>
                      <p className="text-sm font-body whitespace-pre-wrap">{msg.message}</p>
                      <p className="text-[10px] text-muted-foreground mt-1 font-body">{formatDateTime(msg.created_at)}</p>
                    </div>
                    {isOwner && (
                      <img
                        src={profile?.avatar_url || userProfile.avatar_url || "/placeholder.svg"}
                        alt=""
                        className="w-8 h-8 rounded-full border border-primary flex-shrink-0 mt-1"
                      />
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>
            <div ref={messagesEndRef} />
          </div>

          {ticket.status !== "closed" && (
            <form onSubmit={handleSendMessage} className="p-3 border-t border-border flex gap-2">
              <input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Escribe un mensaje..."
                className="flex-1 px-4 py-2 rounded-xl border-2 border-border bg-background font-body text-sm focus:border-primary focus:outline-none transition"
              />
              <button
                type="submit"
                disabled={sending || !newMessage.trim()}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-xl font-heading font-bold text-sm hover:opacity-90 transition disabled:opacity-50"
              >
                {sending ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />}
              </button>
            </form>
          )}

          {ticket.status === "closed" && (
            <div className="p-4 border-t border-border text-center text-sm text-muted-foreground font-body">
              <CheckCircle2 className="inline mr-1" size={14} /> Este ticket ha sido cerrado.
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Tickets;
