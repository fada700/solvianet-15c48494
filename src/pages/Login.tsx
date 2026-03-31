import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { Lock, AlertCircle, LogIn, Eye, EyeOff, Shield } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { motion } from "framer-motion";
import logo from "@/assets/solvianmc.png";

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
      <div className="flex items-center justify-center min-h-[60vh] px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md card-medieval p-8"
        >
          <div className="h-1 bg-gradient-to-r from-primary to-accent rounded-full mb-6" />
          <div className="text-center mb-6">
            <img src={logo} alt="SolvianMC" className="w-16 h-16 rounded-full mx-auto mb-3 border-2 border-primary" />
            <h1 className="font-heading text-2xl font-bold">Panel Admin</h1>
            <p className="text-muted-foreground text-sm font-body">Acceso exclusivo para el staff</p>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-destructive text-sm font-body mb-4 p-3 bg-destructive/10 rounded-lg">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-heading font-semibold mb-1 block">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg bg-background border border-border font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                placeholder="admin@solvianmc.net"
                disabled={submitting}
                autoComplete="email"
              />
            </div>
            <div>
              <label className="text-sm font-heading font-semibold mb-1 block">Contraseña</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2.5 pr-10 rounded-lg bg-background border border-border font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
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
              className="w-full py-2.5 bg-primary text-primary-foreground font-heading font-bold rounded-lg flex items-center justify-center gap-2 hover:opacity-90 transition disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                  Entrando...
                </>
              ) : (
                <>
                  <Shield size={18} />
                  Entrar
                </>
              )}
            </button>
          </form>

          <p className="text-center text-xs text-muted-foreground mt-4 font-body">
            🔒 Conexión segura con SolvianMC
          </p>
        </motion.div>
      </div>
    </Layout>
  );
};

export default Login;
