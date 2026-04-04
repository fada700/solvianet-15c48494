import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { AlertCircle, Eye, EyeOff, Shield, Sparkles } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { motion } from "framer-motion";
import logo from "@/assets/solvianmc-logo.png";
import GoldParticles from "@/components/GoldParticles";

const Login = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && user) {
      navigate("/admin", { replace: true });
    }
  }, [user, authLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim() || submitting) return;
    setSubmitting(true);
    setError("");

    const { error: signInError } = await signIn(email, password);
    if (signInError) {
      setError("Credenciales incorrectas. Inténtalo de nuevo.");
      setSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="ml-3 font-body text-muted-foreground">Verificando sesión...</span>
        </div>
      </Layout>
    );
  }

  if (user) return null;

  return (
    <Layout>
      <div className="relative flex items-center justify-center min-h-[75vh] px-4 overflow-hidden">
        {/* Background particles */}
        <div className="absolute inset-0 pointer-events-none">
          <GoldParticles />
        </div>

        {/* Glow effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[300px] h-[200px] bg-accent/10 rounded-full blur-[80px] pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="relative w-full max-w-md z-10"
        >
          {/* Logo floating above card */}
          <motion.div
            initial={{ y: -10 }}
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="flex justify-center mb-[-40px] relative z-20"
          >
            <div className="relative">
              <img
                src={logo}
                alt="SolvianMC"
                className="w-28 h-28 drop-shadow-[0_0_30px_hsla(45,80%,50%,0.5)]"
              />
              <div className="absolute inset-0 w-28 h-28 bg-primary/20 rounded-full blur-xl -z-10" />
            </div>
          </motion.div>

          {/* Card */}
          <div className="card-medieval p-8 pt-14 border-primary/20 shadow-[0_0_40px_-10px_hsla(45,80%,50%,0.15)]">
            {/* Top accent bar */}
            <div className="h-1 bg-gradient-to-r from-transparent via-primary to-transparent rounded-full mb-6" />

            <div className="text-center mb-6">
              <h1 className="font-heading text-2xl font-bold text-gradient-gold flex items-center justify-center gap-2">
                <Shield size={22} className="text-primary" />
                Panel de Administración
              </h1>
              <p className="text-muted-foreground text-sm font-body mt-1">
                Acceso exclusivo para el staff de SolvianMC
              </p>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-2 text-destructive text-sm font-body mb-4 p-3 bg-destructive/10 rounded-lg border border-destructive/20"
              >
                <AlertCircle size={16} />
                {error}
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-heading font-semibold mb-1.5 block text-foreground/80">
                  Correo electrónico
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-background/50 border border-border font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all placeholder:text-muted-foreground/50"
                  placeholder="admin@solvianmc.net"
                  disabled={submitting}
                  autoComplete="email"
                />
              </div>
              <div>
                <label className="text-sm font-heading font-semibold mb-1.5 block text-foreground/80">
                  Contraseña
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 pr-10 rounded-lg bg-background/50 border border-border font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all placeholder:text-muted-foreground/50"
                    placeholder="••••••••"
                    disabled={submitting}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground font-heading font-bold rounded-lg flex items-center justify-center gap-2 hover:shadow-[0_0_20px_hsla(45,80%,50%,0.3)] transition-all duration-300 disabled:opacity-50 glow-gold"
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                    Entrando...
                  </>
                ) : (
                  <>
                    <Sparkles size={18} />
                    Iniciar Sesión
                  </>
                )}
              </button>
            </form>

            {/* Bottom accent */}
            <div className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground font-body">
              <div className="h-px w-8 bg-border" />
              <span>🔒 Conexión segura</span>
              <div className="h-px w-8 bg-border" />
            </div>
          </div>
        </motion.div>
      </div>
    </Layout>
  );
};

export default Login;