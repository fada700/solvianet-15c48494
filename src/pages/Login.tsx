import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { Shield } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { motion } from "framer-motion";
import logo from "@/assets/solvianmc-logo.png";
import GoldParticles from "@/components/GoldParticles";

const DiscordIcon = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.317 4.37a19.79 19.79 0 0 0-4.885-1.515.07.07 0 0 0-.073.035c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.07.07 0 0 0-.073-.035A19.736 19.736 0 0 0 3.677 4.37a.064.064 0 0 0-.03.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.84 19.84 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.182 0-2.157-1.086-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.332-.956 2.418-2.157 2.418zm7.974 0c-1.183 0-2.157-1.086-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.332-.946 2.418-2.157 2.418z"/>
  </svg>
);

const Login = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && user) navigate("/admin", { replace: true });
  }, [user, authLoading, navigate]);

  const handleDiscordLogin = () => {
    const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/discord-auth?action=start&mode=admin&origin=${encodeURIComponent(window.location.origin)}`;
    window.location.href = url;
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
        <div className="absolute inset-0 pointer-events-none"><GoldParticles /></div>
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="relative w-full max-w-md z-10"
        >
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="flex justify-center mb-[-40px] relative z-20"
          >
            <img src={logo} alt="SolvianMC" className="w-28 h-28 drop-shadow-[0_0_30px_hsla(45,80%,50%,0.5)]" />
          </motion.div>

          <div className="card-medieval p-8 pt-14 border-primary/20 shadow-[0_0_40px_-10px_hsla(45,80%,50%,0.15)]">
            <div className="h-1 bg-gradient-to-r from-transparent via-primary to-transparent rounded-full mb-6" />
            <div className="text-center mb-6">
              <h1 className="font-heading text-2xl font-bold text-gradient-gold flex items-center justify-center gap-2">
                <Shield size={22} className="text-primary" />
                Panel de Administración
              </h1>
              <p className="text-muted-foreground text-sm font-body mt-2">
                Solo personal autorizado. Inicia sesión con Discord y verifica con tu rol de admin del servidor.
              </p>
            </div>

            <button
              onClick={handleDiscordLogin}
              className="w-full py-3 bg-[#5865F2] hover:bg-[#4752c4] text-white font-heading font-bold rounded-lg flex items-center justify-center gap-3 transition-all shadow-lg hover:shadow-[0_0_20px_rgba(88,101,242,0.4)]"
            >
              <DiscordIcon size={20} />
              Iniciar con Discord
            </button>

            <div className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground font-body">
              <div className="h-px w-8 bg-border" />
              <span>🔒 Acceso con doble verificación</span>
              <div className="h-px w-8 bg-border" />
            </div>
          </div>
        </motion.div>
      </div>
    </Layout>
  );
};

export default Login;
