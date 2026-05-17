import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Layout from "@/components/Layout";
import { Shield, Mail, AlertCircle, ShieldAlert } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const STORAGE_KEY = "admin_2fa_verified_at";
const SESSION_TTL_MS = 60 * 60 * 1000; // 1 hour

interface Props {
  onVerified: () => void;
}

const AdminGate = ({ onVerified }: Props) => {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [denied, setDenied] = useState(searchParams.get("denied") === "1");
  const [code, setCode] = useState("");
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lockedUntil, setLockedUntil] = useState<string | null>(null);

  // Check existing 2FA session
  useEffect(() => {
    const v = sessionStorage.getItem(STORAGE_KEY);
    if (v && Date.now() - parseInt(v, 10) < SESSION_TTL_MS) {
      onVerified();
    }
  }, [onVerified]);

  // Auto-send code when arrived from Discord
  useEffect(() => {
    if (authLoading || !user) return;
    if (searchParams.get("step") === "code" && !codeSent) {
      setSearchParams({}, { replace: true });
      void sendCode();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user]);

  const handleDiscordLogin = () => {
    const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/discord-auth?action=start&mode=admin&origin=${encodeURIComponent(window.location.origin)}`;
    window.location.href = url;
  };

  const sendCode = async () => {
    setSending(true);
    setError(null);
    try {
      const { data, error } = await supabase.functions.invoke("admin-send-code");
      if (error) throw error;
      if ((data as any)?.error === "locked") {
        setLockedUntil((data as any).locked_until);
        setError("Has sido bloqueado por 15 minutos por demasiados intentos.");
      } else {
        setCodeSent(true);
        toast.success("Código enviado a tu correo");
      }
    } catch (e: any) {
      console.error(e);
      setError(e?.message || "No se pudo enviar el código");
    } finally {
      setSending(false);
    }
  };

  const verifyCode = async () => {
    if (!/^\d{6}$/.test(code)) {
      setError("Ingresa un código de 6 dígitos");
      return;
    }
    setVerifying(true);
    setError(null);
    try {
      const { data, error } = await supabase.functions.invoke("admin-verify-code", {
        body: { code },
      });
      if (error) throw error;
      const d = data as any;
      if (d?.ok) {
        sessionStorage.setItem(STORAGE_KEY, Date.now().toString());
        toast.success("Verificación correcta");
        onVerified();
        return;
      }
      if (d?.error === "locked") {
        setLockedUntil(d.locked_until);
        setError("Bloqueado por 15 minutos. Intenta más tarde.");
      } else if (d?.error === "expired") {
        setError("El código expiró. Solicita uno nuevo.");
        setCodeSent(false);
      } else if (d?.error === "wrong") {
        setError(`Código incorrecto. Te quedan ${d.attempts_left} intento(s).`);
      } else {
        setError("Código inválido");
      }
    } catch (e: any) {
      console.error(e);
      setError(e?.message || "Error al verificar");
    } finally {
      setVerifying(false);
    }
  };

  if (authLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </Layout>
    );
  }

  // 1. Not authenticated → Discord login
  if (!user) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[70vh] px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="card-medieval p-8 max-w-md w-full text-center"
          >
            <Shield className="mx-auto text-primary mb-4" size={48} />
            <h1 className="font-heading text-2xl font-bold text-gradient-gold mb-2">Panel Admin</h1>
            <p className="text-muted-foreground font-body text-sm mb-6">
              Inicia sesión con Discord. Debes tener el rol de admin en el servidor.
            </p>
            <button
              onClick={handleDiscordLogin}
              className="w-full py-3 bg-[#5865F2] hover:bg-[#4752c4] text-white font-heading font-bold rounded-lg transition-all"
            >
              Iniciar con Discord
            </button>
          </motion.div>
        </div>
      </Layout>
    );
  }

  // 2. Denied (no Discord admin role)
  if (denied) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[70vh] px-4">
          <div className="card-medieval p-8 max-w-md w-full text-center">
            <ShieldAlert className="mx-auto text-destructive mb-4" size={48} />
            <h1 className="font-heading text-2xl font-bold mb-2">Acceso denegado</h1>
            <p className="text-muted-foreground font-body text-sm mb-6">
              No tienes el rol de admin en el servidor de Discord.
            </p>
            <button
              onClick={async () => { await signOut(); setDenied(false); navigate("/"); }}
              className="px-4 py-2 bg-muted text-muted-foreground font-heading font-bold rounded-lg"
            >
              Volver al inicio
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  // 3. Need email code
  return (
    <Layout>
      <div className="flex items-center justify-center min-h-[70vh] px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="card-medieval p-8 max-w-md w-full"
        >
          <div className="text-center mb-6">
            <Mail className="mx-auto text-primary mb-3" size={40} />
            <h1 className="font-heading text-xl font-bold text-gradient-gold">Verificación por correo</h1>
            <p className="text-muted-foreground font-body text-sm mt-2">
              {codeSent
                ? `Hemos enviado un código de 6 dígitos a ${user.email}`
                : "Te enviaremos un código de 6 dígitos a tu correo."}
            </p>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-destructive text-sm font-body mb-4 p-3 bg-destructive/10 rounded-lg border border-destructive/20">
              <AlertCircle size={16} /> {error}
            </div>
          )}

          {codeSent ? (
            <div className="space-y-4">
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="000000"
                className="w-full text-center text-3xl tracking-[0.5em] font-mono py-4 rounded-lg bg-background/50 border border-border focus:outline-none focus:ring-2 focus:ring-primary/50"
                disabled={verifying || !!lockedUntil}
              />
              <button
                onClick={verifyCode}
                disabled={verifying || code.length !== 6 || !!lockedUntil}
                className="w-full py-3 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground font-heading font-bold rounded-lg disabled:opacity-50"
              >
                {verifying ? "Verificando..." : "Verificar código"}
              </button>
              <button
                onClick={sendCode}
                disabled={sending || !!lockedUntil}
                className="w-full text-sm text-muted-foreground hover:text-primary font-body underline disabled:opacity-50"
              >
                {sending ? "Enviando..." : "Reenviar código"}
              </button>
            </div>
          ) : (
            <button
              onClick={sendCode}
              disabled={sending}
              className="w-full py-3 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground font-heading font-bold rounded-lg disabled:opacity-50"
            >
              {sending ? "Enviando..." : "Enviar código"}
            </button>
          )}

          <button
            onClick={async () => { await signOut(); navigate("/"); }}
            className="w-full mt-4 text-xs text-muted-foreground hover:text-foreground font-body"
          >
            Cancelar y cerrar sesión
          </button>
        </motion.div>
      </div>
    </Layout>
  );
};

export default AdminGate;
