import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import {
  Plus, Trash2, LogOut, Star, MessageSquare, ShieldAlert, Upload, X,
  Image as ImageIcon, Edit2, Check, XCircle, BarChart3, Users, FileText, TrendingUp,
  Clock, Wifi, WifiOff, Activity, Award, Eye, Ticket, UserCheck, Send, Search,
  ClipboardList, Gamepad2, MessageCircle, CheckCircle2, Filter, Video,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useServerStatus } from "@/hooks/useServerStatus";
import { motion, AnimatePresence } from "framer-motion";
import AdminGate from "@/components/AdminGate";

const TWO_FA_KEY = "admin_2fa_verified_at";
const TWO_FA_TTL_MS = 60 * 60 * 1000;

const GAME_CATEGORIES = [
  { id: "global", label: "Global" },
  { id: "gens", label: "Gens" },
  { id: "survival", label: "Survival" },
  { id: "arcade", label: "Arcade Games" },
];

const QUESTION_LABELS: Record<string, Record<string, string>> = {
  minecraft: {
    mc_nick: "¿Cuál es tu nick de Minecraft?",
    dc_nick: "¿Cuál es tu nick de Discord?",
    premium: "¿Eres premium o no premium?",
    edad: "¿Cuántos años tienes?",
    por_que: "¿Por qué quieres ser staff en SolvianMC Network?",
    experiencia: "¿Tienes experiencia previa como staff? ¿En qué servidores y hasta qué rango?",
    reglas: "¿Conoces y respetas las reglas del servidor?",
    discusion: "¿Cómo actuarías ante una discusión entre jugadores?",
    procedimiento: "¿Qué procedimiento seguirías antes de sancionar a alguien?",
    priorizar: "¿Cómo priorizas problemas cuando estás solo?",
    abuso_rango: "¿Qué harías si un compañero staff abusa de su rango?",
    conflicto_staff: "¿Cómo manejarías un conflicto dentro del staff?",
    mala_sancion: "¿Qué harías si aplicas mal una sanción?",
    solo_equipo: "¿Prefieres trabajar solo o en equipo? ¿Por qué?",
    respeto: "¿Qué harías si no te respetan? ¿Y si a tu compañero no lo respetan?",
    comandos: "¿Conoces comandos básicos de moderación? Nómbralos y explícalos",
    horas: "¿Cuántas horas le podrías dedicar al staff diario?",
    ideas: "¿Qué ideas tienes para mejorar SolvianMC?",
  },
  discord: {
    dc_nick: "¿Cuál es tu nick de Discord?",
    dc_id: "¿Cuál es tu ID de Discord?",
    edad: "¿Cuántos años tienes?",
    experiencia_dc: "¿Tienes experiencia previa gestionando servidores de Discord?",
    incumplimiento: "¿Qué harías si un usuario está incumpliendo las normas?",
    bots: "¿Qué bots de moderación y automatización conoces?",
    por_que: "¿Por qué quieres ser staff de Discord en SolvianMC?",
    reglas: "¿Conoces y respetas las reglas del servidor?",
    sanciones: "¿Qué tipos de sanciones conoces? Nombra y explica cada una",
    raid: "¿Cómo actuarías ante una raid en el servidor?",
    ticket: "¿Cómo gestionarías un ticket de ayuda?",
    solo_equipo: "¿Prefieres trabajar solo o en equipo? ¿Por qué?",
    tiempo: "¿Cuánto tiempo puedes dedicar semanalmente al Discord?",
  },
  creador: {
    creator_type: "Tipo de creador seleccionado",
    canal: "Enlace a tu canal",
    viewers: "Media de viewers en streams de Minecraft",
    entretener: "¿Cómo mantienes al chat entretenido en momentos lentos?",
    shaders: "¿Tu PC soporta Shaders en directo?",
    lore_o_desmadre: "¿Lore o desmadre en directo?",
    tipo_contenido: "¿Serie episódica o videos de momentos?",
    replay_mod: "¿Sabes utilizar Replay Mod o cámaras libres?",
    video_orgulloso: "Link del video del que te sientes más orgulloso",
    frecuencia: "¿Cada cuánto subirías un video del servidor?",
    tipo_videos: "¿Qué tipo de TikToks harías?",
    ip_visible: "¿IP/nombre del server visible en tus videos?",
    shaders_packs: "¿Usas Shaders o Texture Packs llamativos?",
    promedio_vistas: "Promedio de vistas en últimos 5 TikToks de MC",
    metas: "Metas principales para tu canal en los próximos meses",
    por_que_server: "¿Por qué elegiste este servidor para crear contenido?",
    constancia: "Compromiso de constancia (frecuencia)",
    vibra: "¿Qué vibra le quieres dar a tu contenido en el server?",
    tiempo_minecraft: "Tiempo jugando Minecraft y tipo de contenido habitual",
    sanciones_previas: "¿Has sido sancionado/baneado por toxicidad antes?",
    acepta_normas: "Acepta las normas del servidor y de creadores",
  },
};

interface Update {
  id: string;
  title: string;
  date: string;
  content: string;
  category: string;
  update_number: number;
  images: string[];
  created_at: string;
}

interface Review {
  id: string;
  name: string;
  stars: number;
  comment: string;
  date: string;
  created_at: string;
}

const StatCard = ({ icon: Icon, value, label, color = "text-primary" }: { icon: any; value: string | number; label: string; color?: string }) => (
  <div className="card-medieval p-4 text-center">
    <Icon className={`mx-auto mb-1 ${color}`} size={24} />
    <p className="font-heading font-bold text-xl">{value}</p>
    <p className="text-muted-foreground text-xs font-body">{label}</p>
  </div>
);

const AdminInner = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, isAdmin, signOut } = useAuth();
  const server = useServerStatus();
  const [updates, setUpdates] = useState<Update[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("gens");
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [publishing, setPublishing] = useState(false);
  const [activeTab, setActiveTab] = useState<"dashboard" | "updates" | "reviews" | "tickets" | "applications" | "apertura">("dashboard");
  const [apertura, setApertura] = useState<{ id: string; is_active: boolean; title: string; content: string } | null>(null);
  const [aperturaTitle, setAperturaTitle] = useState("");
  const [aperturaContent, setAperturaContent] = useState("");
  const [savingApertura, setSavingApertura] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ type: "update" | "review"; id: string; name: string } | null>(null);
  const [editingUpdate, setEditingUpdate] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");

  // Ticket management state
  const [allTickets, setAllTickets] = useState<any[]>([]);
  const [ticketSearch, setTicketSearch] = useState("");
  const [ticketFilter, setTicketFilter] = useState<string>("all");
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
  const [ticketMessages, setTicketMessages] = useState<any[]>([]);
  const [ticketProfiles, setTicketProfiles] = useState<Record<string, any>>({});
  const [staffMsg, setStaffMsg] = useState("");
  const [sendingStaffMsg, setSendingStaffMsg] = useState(false);
  const ticketMsgEndRef = useRef<HTMLDivElement>(null);

  // Staff applications state
  const [formSettings, setFormSettings] = useState<{ minecraft: boolean; discord: boolean; creador: boolean }>({ minecraft: false, discord: false, creador: false });
  const [applications, setApplications] = useState<any[]>([]);
  const [appFilter, setAppFilter] = useState<"all" | "pending" | "reviewed" | "accepted" | "rejected">("all");
  const [appTypeFilter, setAppTypeFilter] = useState<"all" | "minecraft" | "discord" | "creador">("all");
  const [selectedApp, setSelectedApp] = useState<any | null>(null);
  const [togglingForm, setTogglingForm] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate("/login"); return; }
    if (!isAdmin) {
      toast.error("No tienes permisos para acceder al panel de administración");
      navigate("/");
      return;
    }

    const fetchData = async () => {
      const [uRes, rRes, tRes, fsRes, apRes, apertRes] = await Promise.all([
        supabase.from("updates").select("*").order("created_at", { ascending: false }),
        supabase.from("reviews").select("*").order("created_at", { ascending: false }),
        supabase.from("tickets").select("*").order("created_at", { ascending: false }),
        supabase.from("form_settings").select("*"),
        supabase.from("staff_applications").select("*").order("created_at", { ascending: false }),
        supabase.from("apertura_settings" as any).select("*").limit(1).maybeSingle(),
      ]);
      if (uRes.data) setUpdates(uRes.data as Update[]);
      if (rRes.data) setReviews(rRes.data as Review[]);
      if (apertRes.data) {
        const a = apertRes.data as any;
        setApertura(a);
        setAperturaTitle(a.title);
        setAperturaContent(a.content);
      }
      if (fsRes.data) {
        const mc = fsRes.data.find((s: any) => s.form_type === "minecraft");
        const dc = fsRes.data.find((s: any) => s.form_type === "discord");
        const cr = fsRes.data.find((s: any) => s.form_type === "creador");
        setFormSettings({ minecraft: mc?.is_active ?? false, discord: dc?.is_active ?? false, creador: cr?.is_active ?? false });
      }
      if (apRes.data) setApplications(apRes.data);
      if (tRes.data) {
        setAllTickets(tRes.data);
        const ids = new Set<string>();
        tRes.data.forEach((t: any) => { ids.add(t.user_id); if (t.assigned_staff_id) ids.add(t.assigned_staff_id); });
        if (ids.size > 0) {
          const { data: profs } = await supabase.from("profiles").select("*").in("id", Array.from(ids));
          if (profs) {
            const map: Record<string, any> = {};
            profs.forEach((p: any) => { map[p.id] = p; });
            setTicketProfiles(map);
          }
        }
      }
    };
    fetchData();
  }, [user, authLoading, isAdmin, navigate]);

  // Realtime for selected ticket
  useEffect(() => {
    if (!selectedTicket) return;
    const channel = supabase
      .channel(`admin-ticket-${selectedTicket.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "ticket_messages", filter: `ticket_id=eq.${selectedTicket.id}` }, async (payload) => {
        const newMsg = payload.new;
        setTicketMessages((prev) => [...prev, newMsg]);
        if (!ticketProfiles[newMsg.user_id]) {
          const { data: p } = await supabase.from("profiles").select("*").eq("id", newMsg.user_id).maybeSingle();
          if (p) setTicketProfiles((prev: any) => ({ ...prev, [p.id]: p }));
        }
        setTimeout(() => ticketMsgEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [selectedTicket?.id]);

  if (authLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="ml-3 font-body text-muted-foreground">Cargando...</span>
        </div>
      </Layout>
    );
  }

  if (!user) return null;

  if (!isAdmin) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <ShieldAlert className="text-destructive" size={48} />
          <h1 className="font-heading text-2xl font-bold">Acceso Denegado</h1>
          <p className="text-muted-foreground font-body">No tienes permisos de administrador.</p>
          <button
            onClick={() => { signOut(); navigate("/"); }}
            className="px-4 py-2 bg-muted text-muted-foreground font-heading font-bold rounded-lg text-sm"
          >
            Volver al inicio
          </button>
        </div>
      </Layout>
    );
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const remaining = 5 - imageFiles.length;
    const newFiles = files.slice(0, remaining);
    setImageFiles((prev) => [...prev, ...newFiles]);
    newFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => setImagePreviews((prev) => [...prev, ev.target?.result as string]);
      reader.readAsDataURL(file);
    });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeImage = (index: number) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const getNextUpdateNumber = () => {
    const categoryUpdates = updates.filter((u) => u.category === category);
    if (categoryUpdates.length === 0) return 1;
    return Math.max(...categoryUpdates.map((u) => u.update_number)) + 1;
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim() || publishing) return;
    setPublishing(true);
    try {
      const uploadedUrls: string[] = [];
      for (const file of imageFiles) {
        const ext = file.name.split(".").pop();
        const path = `${category}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error } = await supabase.storage.from("update-images").upload(path, file);
        if (!error) {
          const { data: urlData } = supabase.storage.from("update-images").getPublicUrl(path);
          uploadedUrls.push(urlData.publicUrl);
        }
      }
      const dateStr = new Date().toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" });
      const updateNumber = getNextUpdateNumber();
      const { data, error } = await supabase
        .from("updates")
        .insert({ title: title.trim(), content: content.trim(), date: dateStr, category, update_number: updateNumber, images: uploadedUrls })
        .select().single();
      if (!error && data) {
        setUpdates([data as Update, ...updates]);
        setTitle(""); setContent(""); setImageFiles([]); setImagePreviews([]);
      }
    } finally { setPublishing(false); }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    if (deleteTarget.type === "update") {
      await supabase.from("updates").delete().eq("id", deleteTarget.id);
      setUpdates(updates.filter((u) => u.id !== deleteTarget.id));
    } else {
      await supabase.from("reviews").delete().eq("id", deleteTarget.id);
      setReviews(reviews.filter((r) => r.id !== deleteTarget.id));
    }
    setDeleteTarget(null);
  };

  const startEdit = (u: Update) => {
    setEditingUpdate(u.id);
    setEditTitle(u.title);
    setEditContent(u.content);
  };

  const saveEdit = async () => {
    if (!editingUpdate || !editTitle.trim() || !editContent.trim()) return;
    const { error } = await supabase
      .from("updates")
      .update({ title: editTitle.trim(), content: editContent.trim() })
      .eq("id", editingUpdate);
    if (!error) {
      setUpdates(updates.map((u) => u.id === editingUpdate ? { ...u, title: editTitle.trim(), content: editContent.trim() } : u));
    }
    setEditingUpdate(null);
  };

  const handleSignOut = async () => { await signOut(); navigate("/"); };
  const getCategoryLabel = (cat: string) => GAME_CATEGORIES.find((c) => c.id === cat)?.label ?? cat;

  const avgStars = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.stars, 0) / reviews.length).toFixed(1)
    : "—";

  const updatesByCategory = GAME_CATEGORIES.map((cat) => ({
    ...cat,
    count: updates.filter((u) => u.category === cat.id).length,
  }));

  const starDistribution = [5, 4, 3, 2, 1].map((s) => ({
    stars: s,
    count: reviews.filter((r) => r.stars === s).length,
    pct: reviews.length > 0 ? (reviews.filter((r) => r.stars === s).length / reviews.length) * 100 : 0,
  }));

  const recentActivity = [
    ...updates.slice(0, 3).map((u) => ({ type: "update" as const, title: u.title, date: u.created_at, category: u.category })),
    ...reviews.slice(0, 3).map((r) => ({ type: "review" as const, title: `${r.name} — ${r.stars}★`, date: r.created_at, category: "" })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);

  const formatTimeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Ahora";
    if (mins < 60) return `Hace ${mins}m`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `Hace ${hours}h`;
    const days = Math.floor(hours / 24);
    return `Hace ${days}d`;
  };

  // Ticket management helpers
  const STATUS_LABELS: Record<string, { label: string; color: string }> = {
    open: { label: "Abierto", color: "text-secondary" },
    in_review: { label: "En Revisión", color: "text-accent" },
    waiting_response: { label: "Esperando Respuesta", color: "text-primary" },
    closed: { label: "Cerrado", color: "text-muted-foreground" },
  };

  const CATEGORY_LABELS: Record<string, string> = {
    reportar_jugador: "Reportar Jugador",
    problema_tecnico: "Problema Técnico",
    dudas_compra: "Dudas de Compra",
    apelacion_sancion: "Apelación de Sanción",
  };

  const filteredTickets = allTickets.filter((t) => {
    const matchFilter = ticketFilter === "all" || t.status === ticketFilter;
    const matchSearch = !ticketSearch || `Ticket ${t.ticket_number}`.toLowerCase().includes(ticketSearch.toLowerCase()) || t.subject.toLowerCase().includes(ticketSearch.toLowerCase());
    return matchFilter && matchSearch;
  });

  const openTicketChat = async (t: any) => {
    setSelectedTicket(t);
    const { data: msgs } = await supabase.from("ticket_messages").select("*").eq("ticket_id", t.id).order("created_at", { ascending: true });
    if (msgs) {
      setTicketMessages(msgs);
      const newIds = new Set<string>();
      msgs.forEach((m: any) => { if (!ticketProfiles[m.user_id]) newIds.add(m.user_id); });
      if (newIds.size > 0) {
        const { data: profs } = await supabase.from("profiles").select("*").in("id", Array.from(newIds));
        if (profs) {
          const map = { ...ticketProfiles };
          profs.forEach((p: any) => { map[p.id] = p; });
          setTicketProfiles(map);
        }
      }
    }
    // Subscribe to realtime
    setTimeout(() => ticketMsgEndRef.current?.scrollIntoView({ behavior: "smooth" }), 200);
  };



  const handleStaffSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedTicket || !staffMsg.trim() || sendingStaffMsg) return;
    setSendingStaffMsg(true);
    await supabase.from("ticket_messages").insert({ ticket_id: selectedTicket.id, user_id: user.id, message: staffMsg.trim() });
    setStaffMsg("");
    setSendingStaffMsg(false);
  };

  const updateTicketStatus = async (ticketId: string, newStatus: string) => {
    const updateData: any = { status: newStatus, updated_at: new Date().toISOString() };
    if (newStatus === "in_review" || newStatus === "waiting_response") {
      updateData.assigned_staff_id = user!.id;
    }
    if (newStatus === "closed") {
      updateData.closed_at = new Date().toISOString();
    }
    const { error } = await supabase.from("tickets").update(updateData).eq("id", ticketId);
    if (!error) {
      setAllTickets((prev) => prev.map((t) => t.id === ticketId ? { ...t, ...updateData } : t));
      if (selectedTicket?.id === ticketId) setSelectedTicket((prev: any) => prev ? { ...prev, ...updateData } : prev);
      toast.success(`Ticket actualizado a "${STATUS_LABELS[newStatus]?.label}"`);
    }
  };

  // Form toggle handler
  const FORM_LABELS: Record<string, string> = { minecraft: "Minecraft", discord: "Discord", creador: "Creador de Contenido" };
  const toggleForm = async (formType: "minecraft" | "discord" | "creador") => {
    setTogglingForm(formType);
    const newValue = !formSettings[formType];
    const { error } = await supabase.from("form_settings").update({ is_active: newValue, updated_at: new Date().toISOString() }).eq("form_type", formType);
    if (!error) {
      setFormSettings((prev) => ({ ...prev, [formType]: newValue }));
      if (!newValue) {
        await supabase.from("staff_applications").delete().eq("form_type", formType);
        setApplications((prev) => prev.filter((a) => a.form_type !== formType));
        toast.success(`Formulario ${FORM_LABELS[formType]} desactivado. Solicitudes eliminadas.`);
      } else {
        toast.success(`Formulario ${FORM_LABELS[formType]} activado.`);
      }
    }
    setTogglingForm(null);
  };

  const markAsReviewed = async (appId: string) => {
    const { error } = await supabase.from("staff_applications").update({ status: "reviewed" }).eq("id", appId);
    if (!error) {
      setApplications((prev) => prev.map((a) => a.id === appId ? { ...a, status: "reviewed" } : a));
      if (selectedApp?.id === appId) setSelectedApp((prev: any) => prev ? { ...prev, status: "reviewed" } : prev);
      toast.success("Solicitud marcada como revisada");
    }
  };

  const acceptApplication = async (appId: string) => {
    const t = toast.loading("Aceptando postulante y enviando DM...");
    const { data, error } = await supabase.functions.invoke("accept-application", { body: { appId, action: "accept" } });
    toast.dismiss(t);
    if (error || (data as any)?.error) {
      toast.error((data as any)?.error || error?.message || "Error al aceptar");
      return;
    }
    setApplications((prev) => prev.map((a) => a.id === appId ? { ...a, status: "accepted" } : a));
    if (selectedApp?.id === appId) setSelectedApp((prev: any) => prev ? { ...prev, status: "accepted" } : prev);
    toast.success("¡Postulante aceptado! Rol asignado y DM enviado.");
  };

  const rejectApplication = async (appId: string) => {
    const t = toast.loading("Rechazando postulante y enviando DM...");
    const { data, error } = await supabase.functions.invoke("accept-application", { body: { appId, action: "reject" } });
    toast.dismiss(t);
    if (error || (data as any)?.error) {
      toast.error((data as any)?.error || error?.message || "Error al rechazar");
      return;
    }
    setApplications((prev) => prev.map((a) => a.id === appId ? { ...a, status: "rejected" } : a));
    if (selectedApp?.id === appId) setSelectedApp((prev: any) => prev ? { ...prev, status: "rejected" } : prev);
    toast.success("Postulante rechazado. DM enviado.");
  };

  const deleteApplication = async (appId: string) => {
    const { error } = await supabase.from("staff_applications").delete().eq("id", appId);
    if (!error) {
      setApplications((prev) => prev.filter((a) => a.id !== appId));
      if (selectedApp?.id === appId) setSelectedApp(null);
      toast.success("Solicitud eliminada");
    }
  };

  const CREATOR_TYPE_LABELS: Record<string, string> = { youtuber: "YouTuber", streamer: "Streamer", tiktoker: "TikToker", media: "Media" };
  const getAppTypeBadge = (a: any) => {
    if (a.form_type === "creador") {
      const ct = (a.answers as any)?.creator_type;
      return `Creador · ${CREATOR_TYPE_LABELS[ct] || "?"}`;
    }
    if (a.form_type === "minecraft") return "Minecraft";
    if (a.form_type === "discord") return "Discord";
    return a.form_type;
  };

  const filteredApps = applications.filter((a) => {
    const matchStatus = appFilter === "all" || a.status === appFilter;
    const matchType = appTypeFilter === "all" || a.form_type === appTypeFilter;
    return matchStatus && matchType;
  });

  const mcAppsCount = applications.filter((a) => a.form_type === "minecraft").length;
  const dcAppsCount = applications.filter((a) => a.form_type === "discord").length;
  const crAppsCount = applications.filter((a) => a.form_type === "creador").length;
  const pendingAppsCount = applications.filter((a) => a.status === "pending").length;

  const tabs = [
    { key: "dashboard" as const, icon: BarChart3, label: "Dashboard" },
    { key: "updates" as const, icon: FileText, label: `Actualizaciones (${updates.length})` },
    { key: "reviews" as const, icon: MessageSquare, label: `Reseñas (${reviews.length})` },
    { key: "tickets" as const, icon: Ticket, label: `Tickets (${allTickets.length})` },
    { key: "applications" as const, icon: ClipboardList, label: `Aplicaciones (${applications.length})` },
    { key: "apertura" as const, icon: Award, label: `Apertura ${apertura?.is_active ? "🟢" : "🔴"}` },
  ];

  const saveApertura = async () => {
    if (!apertura) return;
    setSavingApertura(true);
    const { error } = await supabase.from("apertura_settings" as any).update({
      title: aperturaTitle.trim(),
      content: aperturaContent.trim(),
      updated_at: new Date().toISOString(),
    }).eq("id", apertura.id);
    setSavingApertura(false);
    if (!error) {
      setApertura({ ...apertura, title: aperturaTitle.trim(), content: aperturaContent.trim() });
      toast.success("Apertura guardada");
    } else {
      toast.error("Error al guardar");
    }
  };

  const toggleApertura = async () => {
    if (!apertura) return;
    const newValue = !apertura.is_active;
    const { error } = await supabase.from("apertura_settings" as any).update({ is_active: newValue, updated_at: new Date().toISOString() }).eq("id", apertura.id);
    if (!error) {
      setApertura({ ...apertura, is_active: newValue });
      toast.success(newValue ? "Apertura visible en el inicio" : "Apertura oculta");
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-heading text-2xl font-bold text-gradient-gold">Panel de Administración</h1>
            <p className="text-muted-foreground text-sm font-body">Hola, {user.email?.split("@")[0]} 👋</p>
          </div>
          <button onClick={handleSignOut} className="flex items-center gap-2 px-4 py-2 bg-muted text-muted-foreground rounded-lg font-heading font-bold text-sm hover:bg-muted/80 transition">
            <LogOut size={16} /> Salir
          </button>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-heading font-bold text-sm transition-all border-2 ${
                activeTab === tab.key
                  ? "bg-primary text-primary-foreground border-primary glow-gold"
                  : "bg-card border-border text-muted-foreground hover:border-primary/50"
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Dashboard */}
        {activeTab === "dashboard" && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard icon={FileText} value={updates.length} label="Total Updates" />
              <StatCard icon={MessageSquare} value={reviews.length} label="Total Reseñas" />
              <StatCard icon={Star} value={avgStars} label="Nota Media" color="text-primary" />
              <StatCard icon={Users} value={server.online ? server.players?.online ?? 0 : 0} label="Online Ahora" color="text-secondary" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Server status */}
              <div className="card-medieval p-5">
                <h3 className="font-heading font-bold mb-3">🖥️ Estado del Servidor</h3>
                <div className="flex items-center gap-2 mb-3">
                  {server.loading ? <Activity className="animate-spin text-muted-foreground" size={18} /> : server.online ? <Wifi className="text-secondary" size={18} /> : <WifiOff className="text-destructive" size={18} />}
                  <span className="font-body text-sm">{server.loading ? "Consultando..." : server.online ? "Activo" : "Apagado"}</span>
                </div>
                {server.online && server.players && (
                  <div className="space-y-1 text-sm text-muted-foreground font-body">
                    <p><Users size={14} className="inline mr-1" />Jugadores: {server.players.online}/{server.players.max}</p>
                    {server.version && <p>Versión: {server.version}</p>}
                    {server.motd && <p>MOTD: {server.motd}</p>}
                  </div>
                )}
              </div>

              {/* Recent activity */}
              <div className="card-medieval p-5">
                <h3 className="font-heading font-bold mb-3">📋 Últimos Movimientos</h3>
                {recentActivity.length > 0 ? (
                  <div className="space-y-2">
                    {recentActivity.map((item, i) => (
                      <div key={i} className="flex items-start gap-2">
                        {item.type === "update" ? <FileText size={14} className="text-primary mt-0.5" /> : <Star size={14} className="text-primary mt-0.5" />}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-body truncate">{item.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatTimeAgo(item.date)}
                            {item.category && <span> • {getCategoryLabel(item.category)}</span>}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm font-body">Nada por aquí todavía</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Updates by category */}
              <div className="card-medieval p-5">
                <h3 className="font-heading font-bold mb-3">📊 Updates por Modalidad</h3>
                {updatesByCategory.map((cat) => (
                  <div key={cat.id} className="mb-2">
                    <div className="flex justify-between text-sm font-body mb-1">
                      <span>{cat.label}</span><span>{cat.count}</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: updates.length > 0 ? `${(cat.count / updates.length) * 100}%` : "0%" }}
                        transition={{ delay: 0.5, duration: 0.8 }}
                        className="h-full bg-primary rounded-full"
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Star distribution */}
              <div className="card-medieval p-5">
                <h3 className="font-heading font-bold mb-3">⭐ Cómo nos califican</h3>
                {starDistribution.map((s) => (
                  <div key={s.stars} className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-body w-4">{s.stars}</span>
                    <Star size={12} className="text-primary fill-primary" />
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${s.pct}%` }} transition={{ delay: 0.5, duration: 0.8 }} className="h-full bg-primary rounded-full" />
                    </div>
                    <span className="text-xs text-muted-foreground w-6 text-right">{s.count}</span>
                  </div>
                ))}
              </div>

              {/* Quick actions */}
              <div className="card-medieval p-5">
                <h3 className="font-heading font-bold mb-3">⚡ Accesos Directos</h3>
                <div className="space-y-2">
                   <button onClick={() => setActiveTab("updates")} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-heading font-bold text-sm hover:opacity-90 transition w-full">
                     <Plus size={16} /> Crear Update
                  </button>
                  <button onClick={() => navigate("/actualizaciones")} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-muted text-muted-foreground font-heading font-bold text-sm hover:bg-muted/80 transition w-full">
                    <Eye size={16} /> Ver Página Pública
                  </button>
                  <button onClick={() => navigate("/valoraciones")} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-muted text-muted-foreground font-heading font-bold text-sm hover:bg-muted/80 transition w-full">
                    <Star size={16} /> Ver Valoraciones
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Updates Tab */}
        {activeTab === "updates" && (
          <div className="space-y-6">
            <div className="card-medieval p-6">
              <h3 className="font-heading font-bold text-lg mb-4">✏️ Crear Nuevo Update</h3>
              <div className="mb-4">
                <p className="text-sm font-heading font-semibold mb-2">Selecciona la modalidad</p>
                <div className="flex flex-wrap gap-2">
                  {GAME_CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setCategory(cat.id)}
                      className={`px-4 py-2 rounded-lg font-heading font-bold text-sm transition-colors border-2 ${
                        category === cat.id
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background border-border text-muted-foreground hover:border-primary/50"
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground font-body mt-2">
                  N° Update: #{getNextUpdateNumber()} — {getCategoryLabel(category)}
                </p>
              </div>

              <form onSubmit={handleAdd} className="space-y-4">
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Título"
                  className="w-full px-4 py-2.5 rounded-lg bg-background border border-border font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Contenido de la actualización..."
                  className="w-full px-4 py-2.5 rounded-lg bg-background border border-border font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary min-h-[120px]"
                />

                <div>
                  <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleImageSelect} className="hidden" />
                  <button type="button" onClick={() => fileInputRef.current?.click()} disabled={imageFiles.length >= 5} className="flex items-center gap-2 px-4 py-2 bg-muted rounded-lg text-sm font-body disabled:opacity-50">
                    <Upload size={16} /> Añadir imágenes ({imageFiles.length}/5)
                  </button>
                  {imagePreviews.length > 0 && (
                    <div className="flex gap-2 mt-2 flex-wrap">
                      {imagePreviews.map((preview, i) => (
                        <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border border-border">
                          <img src={preview} alt="" className="w-full h-full object-cover" />
                          <button onClick={() => removeImage(i)} className="absolute top-0.5 right-0.5 bg-destructive text-destructive-foreground rounded-full p-0.5"><X size={12} /></button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <button type="submit" disabled={publishing || !title.trim() || !content.trim()} className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-heading font-bold text-sm flex items-center gap-2 disabled:opacity-50">
                  {publishing ? <><div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" /> Publicando...</> : <><Plus size={16} /> Publicar</>}
                </button>
              </form>
            </div>

            <div className="space-y-4">
              {updates.map((update) => (
                <div key={update.id} className="card-medieval p-4">
                  {editingUpdate === update.id ? (
                    <div className="space-y-2">
                      <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="w-full px-3 py-1.5 rounded-lg bg-background border border-border font-body text-sm" />
                      <textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} className="w-full px-3 py-1.5 rounded-lg bg-background border border-border font-body text-sm min-h-[80px]" />
                      <div className="flex gap-2">
                        <button onClick={saveEdit} className="px-3 py-1 bg-secondary text-secondary-foreground rounded-lg text-sm font-heading font-bold flex items-center gap-1"><Check size={14} /> Guardar</button>
                        <button onClick={() => setEditingUpdate(null)} className="px-3 py-1 bg-muted text-muted-foreground rounded-lg text-sm font-heading font-bold flex items-center gap-1"><XCircle size={14} /> Cancelar</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground font-body">{getCategoryLabel(update.category)} #{update.update_number}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button onClick={() => startEdit(update)} className="p-1 text-muted-foreground hover:text-foreground"><Edit2 size={14} /></button>
                          <button onClick={() => setDeleteTarget({ type: "update", id: update.id, name: update.title })} className="p-1 text-destructive hover:text-destructive/80"><Trash2 size={14} /></button>
                        </div>
                      </div>
                      <h4 className="font-heading font-bold">{update.title}</h4>
                      <p className="text-muted-foreground text-sm font-body line-clamp-2">{update.content}</p>
                      <p className="text-xs text-muted-foreground mt-1">{update.date}</p>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Apertura Tab */}
        {activeTab === "apertura" && (
          <div className="card-medieval p-6 space-y-4 max-w-2xl">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-heading font-bold text-lg">🎉 Banner de Apertura</h3>
                <p className="text-muted-foreground text-sm font-body">
                  Aparece en el inicio, justo debajo del Hero. Puedes activarlo o desactivarlo cuando quieras.
                </p>
              </div>
              <button
                onClick={toggleApertura}
                disabled={!apertura}
                className={`px-4 py-2 rounded-lg font-heading font-bold text-sm border-2 ${
                  apertura?.is_active
                    ? "bg-secondary text-secondary-foreground border-secondary"
                    : "bg-muted text-muted-foreground border-border"
                }`}
              >
                {apertura?.is_active ? "🟢 Activo" : "🔴 Oculto"}
              </button>
            </div>

            <div>
              <label className="text-sm font-heading font-semibold block mb-1">Título</label>
              <input
                value={aperturaTitle}
                onChange={(e) => setAperturaTitle(e.target.value)}
                placeholder="Ej: ¡Gran Apertura SolvianMC!"
                className="w-full px-4 py-2.5 rounded-lg bg-background border border-border font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="text-sm font-heading font-semibold block mb-1">Contenido</label>
              <textarea
                value={aperturaContent}
                onChange={(e) => setAperturaContent(e.target.value)}
                placeholder="Mensaje del banner de apertura..."
                className="w-full px-4 py-2.5 rounded-lg bg-background border border-border font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary min-h-[120px]"
              />
            </div>

            <button
              onClick={saveApertura}
              disabled={savingApertura || !apertura || !aperturaTitle.trim() || !aperturaContent.trim()}
              className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-heading font-bold text-sm flex items-center gap-2 disabled:opacity-50"
            >
              <Check size={16} /> {savingApertura ? "Guardando..." : "Guardar Cambios"}
            </button>
          </div>
        )}
        {activeTab === "reviews" && (
          <div className="space-y-4">
            {reviews.map((review) => (
              <div key={review.id} className="card-medieval p-4 flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-heading font-bold text-sm">{review.name}</span>
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} size={12} className={s <= review.stars ? "text-primary fill-primary" : "text-muted-foreground"} />
                      ))}
                    </div>
                  </div>
                  <p className="text-muted-foreground text-sm font-body">{review.comment}</p>
                  <p className="text-xs text-muted-foreground mt-1">{review.date}</p>
                </div>
                <button onClick={() => setDeleteTarget({ type: "review", id: review.id, name: review.name })} className="p-1 text-destructive hover:text-destructive/80 flex-shrink-0">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
            {reviews.length === 0 && (
              <p className="text-center text-muted-foreground font-body py-8">Aún no hay reseñas de jugadores.</p>
            )}
          </div>
        )}

        {/* Tickets Tab */}
        {activeTab === "tickets" && (
          <div className="space-y-4">
            {/* Selected ticket chat view */}
            {selectedTicket ? (
              <div>
                <button onClick={() => setSelectedTicket(null)} className="flex items-center gap-2 mb-4 text-sm font-heading font-bold text-muted-foreground hover:text-foreground transition">
                  ← Volver a la lista
                </button>
                <div className="card-medieval p-4 mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-heading font-bold">Ticket #{selectedTicket.ticket_number}: {selectedTicket.subject}</h3>
                    <span className={`text-sm font-heading font-bold ${STATUS_LABELS[selectedTicket.status]?.color}`}>
                      {STATUS_LABELS[selectedTicket.status]?.label}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground font-body mb-2">{selectedTicket.description}</p>
                  <p className="text-xs text-muted-foreground font-body">Categoría: {CATEGORY_LABELS[selectedTicket.category]} — Usuario: {ticketProfiles[selectedTicket.user_id]?.display_name || "Desconocido"}</p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {selectedTicket.status !== "in_review" && selectedTicket.status !== "closed" && (
                      <button onClick={() => updateTicketStatus(selectedTicket.id, "in_review")} className="px-3 py-1 bg-accent text-accent-foreground rounded-lg text-xs font-heading font-bold">Tomar / En Revisión</button>
                    )}
                    {selectedTicket.status !== "waiting_response" && selectedTicket.status !== "closed" && (
                      <button onClick={() => updateTicketStatus(selectedTicket.id, "waiting_response")} className="px-3 py-1 bg-primary text-primary-foreground rounded-lg text-xs font-heading font-bold">Esperando Respuesta</button>
                    )}
                    {selectedTicket.status !== "closed" && (
                      <button onClick={() => updateTicketStatus(selectedTicket.id, "closed")} className="px-3 py-1 bg-muted text-muted-foreground rounded-lg text-xs font-heading font-bold">Cerrar Ticket</button>
                    )}
                  </div>
                </div>
                {/* Chat */}
                <div className="card-medieval overflow-hidden">
                  <div className="h-[350px] overflow-y-auto p-4 space-y-3">
                    {ticketMessages.length === 0 && <p className="text-center text-muted-foreground text-sm font-body py-8">Sin mensajes.</p>}
                    {ticketMessages.map((msg: any) => {
                      const isOwner = msg.user_id === selectedTicket.user_id;
                      const profile = ticketProfiles[msg.user_id];
                      return (
                        <div key={msg.id} className={`flex gap-2 ${isOwner ? "justify-start" : "justify-end"}`}>
                          {isOwner && <img src={profile?.avatar_url || "/placeholder.svg"} alt="" className="w-8 h-8 rounded-full border border-primary flex-shrink-0 mt-1" />}
                          <div className={`max-w-[70%] rounded-xl p-3 ${isOwner ? "bg-muted border border-border" : "bg-primary/15 border border-primary/30"}`}>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-heading font-bold">{profile?.display_name || "Usuario"}</span>
                              {!isOwner && <span className="text-[10px] bg-accent/20 text-accent px-1.5 py-0.5 rounded font-body font-bold">STAFF</span>}
                            </div>
                            <p className="text-sm font-body">{msg.message}</p>
                            <p className="text-[10px] text-muted-foreground mt-1 font-body">
                              {new Date(msg.created_at).toLocaleDateString("es-ES", { day: "numeric", month: "short" })} — {new Date(msg.created_at).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
                            </p>
                          </div>
                          {!isOwner && <img src={profile?.avatar_url || "/placeholder.svg"} alt="" className="w-8 h-8 rounded-full border border-primary flex-shrink-0 mt-1" />}
                        </div>
                      );
                    })}
                    <div ref={ticketMsgEndRef} />
                  </div>
                  {selectedTicket.status !== "closed" && (
                    <form onSubmit={handleStaffSend} className="p-3 border-t border-border flex gap-2">
                      <input value={staffMsg} onChange={(e) => setStaffMsg(e.target.value)} placeholder="Responder como staff..." className="flex-1 px-4 py-2 rounded-xl border-2 border-border bg-background font-body text-sm focus:border-primary focus:outline-none transition" />
                      <button type="submit" disabled={sendingStaffMsg || !staffMsg.trim()} className="px-4 py-2 bg-primary text-primary-foreground rounded-xl font-heading font-bold text-sm hover:opacity-90 transition disabled:opacity-50">
                        <Send size={16} />
                      </button>
                    </form>
                  )}
                </div>
              </div>
            ) : (
              <>
                {/* Filters and search */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input value={ticketSearch} onChange={(e) => setTicketSearch(e.target.value)} placeholder="Buscar: Ticket 1..." className="w-full pl-10 pr-4 py-2.5 rounded-xl border-2 border-border bg-card font-body text-sm focus:border-primary focus:outline-none transition" />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { key: "all", label: "Todos" },
                      { key: "open", label: "Abiertos" },
                      { key: "in_review", label: "En Revisión" },
                      { key: "waiting_response", label: "Esperando" },
                      { key: "closed", label: "Cerrados" },
                    ].map((f) => (
                      <button key={f.key} onClick={() => setTicketFilter(f.key)} className={`px-3 py-2 rounded-lg text-xs font-heading font-bold border-2 transition ${ticketFilter === f.key ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border text-muted-foreground hover:border-primary/50"}`}>
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Ticket list */}
                <div className="space-y-3">
                  {filteredTickets.map((t: any) => (
                    <div key={t.id} className="card-medieval p-4 cursor-pointer hover:border-primary/50 transition" onClick={() => openTicketChat(t)}>
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-heading font-bold text-sm">Ticket #{t.ticket_number}</h4>
                          <p className="text-xs text-muted-foreground font-body">{t.subject}</p>
                        </div>
                        <div className="text-right">
                          <span className={`text-xs font-heading font-bold ${STATUS_LABELS[t.status]?.color}`}>{STATUS_LABELS[t.status]?.label}</span>
                          <p className="text-[10px] text-muted-foreground font-body">{CATEGORY_LABELS[t.category]}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground font-body">
                        <img src={ticketProfiles[t.user_id]?.avatar_url || "/placeholder.svg"} alt="" className="w-5 h-5 rounded-full" />
                        <span>{ticketProfiles[t.user_id]?.display_name || "Usuario"}</span>
                        <span>•</span>
                        <span>{new Date(t.created_at).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })}</span>
                      </div>
                    </div>
                  ))}
                  {filteredTickets.length === 0 && (
                    <p className="text-center text-muted-foreground font-body py-8">No hay tickets que coincidan con tu búsqueda.</p>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* Applications Tab */}
        {activeTab === "applications" && (
          <div className="space-y-6">
            {/* Toggle switches */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(["minecraft", "discord", "creador"] as const).map((type) => {
                const Icon = type === "minecraft" ? Gamepad2 : type === "discord" ? MessageCircle : Video;
                const iconColor = type === "minecraft" ? "text-primary" : type === "discord" ? "text-accent" : "text-secondary";
                const labelEmoji = type === "minecraft" ? "Minecraft ⛏️" : type === "discord" ? "Discord 💬" : "Creador 🎬";
                return (
                  <div key={type} className="card-medieval p-5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Icon className={iconColor} size={24} />
                        <div>
                          <h3 className="font-heading font-bold text-sm">Formulario {labelEmoji}</h3>
                          <p className="text-xs text-muted-foreground font-body">{formSettings[type] ? "Abierto para todos" : "Cerrado — no visible"}</p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" checked={formSettings[type]} onChange={() => toggleForm(type)} disabled={togglingForm === type} className="sr-only peer" />
                        <div className="peer ring-0 bg-destructive/60 rounded-full duration-300 after:duration-300 w-12 h-6 peer-checked:bg-secondary after:content-[''] after:rounded-full after:absolute after:bg-background after:h-5 after:w-5 after:top-0.5 after:left-0.5 peer-checked:after:translate-x-6" />
                      </label>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Analytics cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <StatCard icon={ClipboardList} value={applications.length} label="Totales" />
              <StatCard icon={Gamepad2} value={mcAppsCount} label="Minecraft" color="text-primary" />
              <StatCard icon={MessageCircle} value={dcAppsCount} label="Discord" color="text-accent" />
              <StatCard icon={Video} value={crAppsCount} label="Creadores" color="text-secondary" />
              <StatCard icon={Clock} value={pendingAppsCount} label="Sin Revisar" color="text-destructive" />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-2">
              {(["all", "pending", "reviewed", "accepted", "rejected"] as const).map((f) => (
                <button key={f} onClick={() => setAppFilter(f)} className={`px-4 py-2 rounded-lg font-heading font-bold text-xs transition border-2 ${appFilter === f ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border text-muted-foreground hover:border-primary/50"}`}>
                  {f === "all" ? "Todos los estados" : f === "pending" ? "Pendiente" : f === "reviewed" ? "Revisado" : f === "accepted" ? "Aceptado" : "Rechazado"}
                </button>
              ))}
              <div className="w-px bg-border mx-1" />
              {(["all", "minecraft", "discord", "creador"] as const).map((f) => (
                <button key={f} onClick={() => setAppTypeFilter(f)} className={`px-4 py-2 rounded-lg font-heading font-bold text-xs transition border-2 ${appTypeFilter === f ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border text-muted-foreground hover:border-primary/50"}`}>
                  {f === "all" ? "Todos los tipos" : f === "minecraft" ? "Minecraft" : f === "discord" ? "Discord" : "Creadores"}
                </button>
              ))}
            </div>

            {/* Application detail view */}
            {selectedApp ? (
              <div className="card-medieval p-6">
                <button onClick={() => setSelectedApp(null)} className="text-sm text-muted-foreground font-body hover:text-foreground transition mb-4 block">← Volver a lista</button>
                <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                  <div className="flex items-center gap-3">
                    <img src={selectedApp.user_avatar || "/placeholder.svg"} alt="" className="w-12 h-12 rounded-full border-2 border-border" />
                    <div>
                      <h3 className="font-heading font-bold">{selectedApp.user_name || "Usuario"}</h3>
                      <p className="text-xs text-muted-foreground font-body">{selectedApp.user_email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`px-3 py-1 rounded-full text-xs font-heading font-bold ${
                      selectedApp.status === "accepted" ? "bg-secondary/20 text-secondary" :
                      selectedApp.status === "rejected" ? "bg-destructive/20 text-destructive" :
                      selectedApp.status === "reviewed" ? "bg-accent/20 text-accent" :
                      "bg-primary/20 text-primary"
                    }`}>
                      {selectedApp.status === "accepted" ? "Aceptado" : selectedApp.status === "rejected" ? "Rechazado" : selectedApp.status === "reviewed" ? "Revisado" : "Pendiente"}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-heading font-bold ${
                      selectedApp.form_type === "minecraft" ? "bg-primary/10 text-primary" :
                      selectedApp.form_type === "discord" ? "bg-accent/10 text-accent" :
                      "bg-secondary/10 text-secondary"
                    }`}>
                      {getAppTypeBadge(selectedApp)}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground font-body mb-4">
                  Fecha: {new Date(selectedApp.created_at).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                </p>

                <div className="space-y-4">
                  {Object.entries(selectedApp.answers || {}).map(([key, value]) => {
                    const questionLabel = QUESTION_LABELS[selectedApp.form_type]?.[key] || key;
                    const displayValue = typeof value === "boolean" ? (value ? "Sí (aceptado)" : "No") : String(value);
                    return (
                      <div key={key} className="p-4 bg-muted/30 rounded-lg border border-border/50">
                        <p className="text-xs font-heading font-bold text-primary mb-2">📋 {questionLabel}</p>
                        <p className="font-body text-sm text-foreground/90 whitespace-pre-wrap">{displayValue}</p>
                      </div>
                    );
                  })}
                </div>

                <div className="flex gap-2 mt-6 flex-wrap">
                  {selectedApp.status !== "accepted" && (
                    <button onClick={() => acceptApplication(selectedApp.id)} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-heading font-bold text-sm hover:opacity-90 transition glow-gold">
                      <CheckCircle2 size={16} /> Aceptar (DM + Rol)
                    </button>
                  )}
                  {selectedApp.status !== "rejected" && (
                    <button onClick={() => rejectApplication(selectedApp.id)} className="flex items-center gap-2 px-4 py-2 bg-destructive text-destructive-foreground rounded-lg font-heading font-bold text-sm hover:opacity-90 transition">
                      <XCircle size={16} /> Rechazar (DM)
                    </button>
                  )}
                  {selectedApp.status === "pending" && (
                    <button onClick={() => markAsReviewed(selectedApp.id)} className="flex items-center gap-2 px-4 py-2 bg-accent text-accent-foreground rounded-lg font-heading font-bold text-sm hover:opacity-90 transition">
                      <CheckCircle2 size={16} /> Marcar como Revisado
                    </button>
                  )}
                  <button onClick={() => deleteApplication(selectedApp.id)} className="flex items-center gap-2 px-4 py-2 bg-muted text-muted-foreground rounded-lg font-heading font-bold text-sm hover:bg-muted/80 transition">
                    <Trash2 size={16} /> Eliminar
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredApps.map((app) => (
                  <div key={app.id} className="card-medieval p-4 cursor-pointer hover:border-primary/50 transition" onClick={() => setSelectedApp(app)}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <img src={app.user_avatar || "/placeholder.svg"} alt="" className="w-10 h-10 rounded-full border border-border" />
                        <div>
                          <h4 className="font-heading font-bold text-sm">{app.user_name || "Usuario"}</h4>
                          <p className="text-xs text-muted-foreground font-body">{app.user_email}</p>
                        </div>
                      </div>
                      <div className="text-right flex items-center gap-2 flex-wrap">
                        <span className={`px-2 py-1 rounded-full text-[10px] font-heading font-bold ${
                          app.form_type === "minecraft" ? "bg-primary/10 text-primary" :
                          app.form_type === "discord" ? "bg-accent/10 text-accent" :
                          "bg-secondary/10 text-secondary"
                        }`}>
                          {getAppTypeBadge(app)}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-[10px] font-heading font-bold ${
                          app.status === "accepted" ? "bg-secondary/20 text-secondary" :
                          app.status === "rejected" ? "bg-destructive/20 text-destructive" :
                          app.status === "reviewed" ? "bg-accent/20 text-accent" :
                          "bg-primary/20 text-primary"
                        }`}>
                          {app.status === "accepted" ? "Aceptado" : app.status === "rejected" ? "Rechazado" : app.status === "reviewed" ? "Revisado" : "Pendiente"}
                        </span>
                      </div>
                    </div>
                    <p className="text-[10px] text-muted-foreground font-body mt-2">
                      {new Date(app.created_at).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </div>
                ))}
                {filteredApps.length === 0 && (
                  <p className="text-center text-muted-foreground font-body py-8">No hay solicitudes con estos filtros.</p>
                )}
              </div>
            )}
          </div>
        )}


        <AnimatePresence>
          {deleteTarget && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-foreground/50 z-50 flex items-center justify-center p-4"
              onClick={() => setDeleteTarget(null)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="card-medieval p-6 max-w-sm w-full"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="font-heading font-bold text-lg mb-2">¿Eliminar?</h3>
                <p className="text-muted-foreground font-body text-sm mb-4">
                  ¿Seguro que deseas eliminar "{deleteTarget.name}"?
                </p>
                <div className="flex gap-2 justify-end">
                  <button onClick={() => setDeleteTarget(null)} className="px-4 py-2 bg-muted text-muted-foreground rounded-lg font-heading font-bold text-sm">Cancelar</button>
                  <button onClick={confirmDelete} className="px-4 py-2 bg-destructive text-destructive-foreground rounded-lg font-heading font-bold text-sm">Eliminar</button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Layout>
  );
};

const Admin = () => {
  const [verified, setVerified] = useState(() => {
    const v = sessionStorage.getItem(TWO_FA_KEY);
    return !!(v && Date.now() - parseInt(v, 10) < TWO_FA_TTL_MS);
  });
  if (!verified) return <AdminGate onVerified={() => setVerified(true)} />;
  return <AdminInner />;
};

export default Admin;
