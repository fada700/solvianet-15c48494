import { Link } from "react-router-dom";
import { ShoppingCart, MessageCircle, Youtube, Vote, Sword, Shield, Palmtree, HelpCircle, ChevronDown, Users, Wifi, WifiOff, Sparkles } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import Layout from "@/components/Layout";
import AnimatedSection from "@/components/AnimatedSection";
import GoldParticles from "@/components/GoldParticles";
import { useServerStatus } from "@/hooks/useServerStatus";
import heroBg from "@/assets/hero-bg.jpg";
import logo from "@/assets/solvianmc.png";
import avatarSoyNulled from "@/assets/avatar-soynulled.png";
import avatarFelixDevYT from "@/assets/avatar-felixdevyt.png";
import avatarLuisDev from "@/assets/avatar-luisdev.png";
import avatarEqo from "@/assets/avatar-eqo.png";
import avatarCarvajal from "@/assets/avatar-carvajal.png";

const teamMembers = [
  { name: "Nulled", avatar: avatarSoyNulled, role: "CEO & Founder", isFounder: true },
  { name: "xLuixDev", avatar: avatarLuisDev, role: "CEO & Dev", isFounder: true },
  { name: "Felix", avatar: avatarFelixDevYT, role: "CEO & Dev", isFounder: true },
  { name: "Eqo", avatar: avatarEqo, role: "Desarrollador", isFounder: false },
  { name: "Carvajal", avatar: avatarCarvajal, role: "Dev & Config", isFounder: false },
];

const faqs = [
  { q: "¿Cómo entro al servidor?", a: "Abre Minecraft, ve a Multijugador y agrega la IP: play.solvianmc.net con el puerto: 25590" },
  { q: "¿Qué versiones soporta?", a: "Actualmente soportamos las versiones más recientes de Minecraft Java Edition." },
  { q: "¿Es premium o no premium?", a: "El servidor es no premium, ¡todos son bienvenidos!" },
  { q: "¿Puedo usar mods?", a: "Solo están permitidos mods de rendimiento como Optifine o Sodium. No se permiten hacks." },
  { q: "¿Cómo reporto a un jugador?", a: "Puedes reportar jugadores a través de nuestro Discord o directamente con el staff en el servidor." },
];

const rules = [
  "No usar hacks, mods ilegales o exploits.",
  "Respetar a todos los jugadores y al staff.",
  "No hacer spam ni publicidad en el chat.",
  "No griefear construcciones de otros jugadores.",
  "Jugar limpio y con deportivismo.",
];

const copyIP = () => {
  navigator.clipboard.writeText("play.solvianmc.net");
  toast.success("¡IP copiada!", { description: "IP: play.solvianmc.net — Puerto: 25590" });
};

const Index = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [apertura, setApertura] = useState<{ title: string; content: string } | null>(null);
  const server = useServerStatus();

  useEffect(() => {
    supabase.from("apertura_settings" as any).select("*").eq("is_active", true).limit(1).maybeSingle().then(({ data }) => {
      if (data) setApertura(data as any);
    });
  }, []);

  return (
    <Layout>
      {/* Hero */}
      <section className="relative min-h-[70vh] flex items-center justify-center overflow-hidden">
        <img src={heroBg} alt="SolvianMC Medieval Tropical" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-foreground/60 via-foreground/40 to-background" />
        <GoldParticles />
        <div className="relative z-20 text-center px-4">
          <img src={logo} alt="SolvianMC" className="w-28 h-28 mx-auto mb-4 rounded-full glow-gold animate-float" />
          <h1 className="font-heading text-4xl md:text-6xl font-bold text-background mb-3">SolvianMC</h1>
          <p className="text-background/80 font-body text-lg max-w-xl mx-auto">
            Un servidor de Minecraft medieval-tropical. ¡Únete a la aventura!
          </p>

          {/* Server Status */}
          {!server.loading && (
            <div className="mt-6 inline-flex items-center gap-3 bg-card/90 backdrop-blur-sm rounded-xl px-5 py-3 border-2 border-border">
              <div className="flex items-center gap-2">
                {server.online ? <Wifi className="text-secondary" size={18} /> : <WifiOff className="text-destructive" size={18} />}
                <span className="font-heading font-bold text-sm">
                  {server.online ? "Servidor Activo" : "Servidor Apagado"}
                </span>
              </div>
              {server.online && server.players && (
                <span className="text-sm text-muted-foreground font-body">
                  {server.players.online}/{server.players.max} jugadores
                </span>
              )}
              {server.online && server.version && (
                <span className="text-sm text-muted-foreground font-body">
                  Versión: {server.version}
                </span>
              )}
            </div>
          )}

          {server.loading && (
            <div className="mt-6 inline-flex items-center gap-2 text-background/60 text-sm font-body">
              <div className="w-4 h-4 border-2 border-background/40 border-t-background rounded-full animate-spin" />
              Consultando servidor...
            </div>
          )}

          <div className="mt-6 flex flex-col items-center gap-1">
            <button onClick={copyIP} className="px-8 py-3 bg-primary text-primary-foreground font-heading font-bold rounded-xl glow-gold hover:opacity-90 transition text-lg">
              play.solvianmc.net
            </button>
            <span className="text-background/60 text-xs font-body">Puerto: 25590</span>
          </div>
        </div>
      </section>

      {/* Apertura Banner */}
      {apertura && (
        <AnimatedSection className="container mx-auto px-4 pt-10 max-w-4xl">
          <div className="card-medieval p-6 border-2 border-primary glow-gold relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-primary text-primary-foreground px-3 py-1 rounded-bl-xl font-heading font-bold text-xs flex items-center gap-1">
              <Sparkles size={12} /> APERTURA
            </div>
            <h2 className="font-heading text-2xl md:text-3xl font-bold text-gradient-gold mb-2 pr-24">{apertura.title}</h2>
            <p className="text-muted-foreground font-body whitespace-pre-wrap">{apertura.content}</p>
          </div>
        </AnimatedSection>
      )}

      {/* Descripción */}
      <AnimatedSection className="container mx-auto px-4 py-16 text-center max-w-3xl">
        <h2 className="font-heading text-2xl md:text-3xl font-bold text-gradient-gold mb-4">¿Qué es SolvianMC?</h2>
        <p className="text-muted-foreground font-body text-lg leading-relaxed">
          SolvianMC es un servidor de Minecraft con temática medieval-tropical donde puedes explorar junglas exóticas,
          construir imperios y vivir aventuras épicas con tus amigos. ¡Una experiencia única te espera!
        </p>
      </AnimatedSection>

      {/* Quick Links */}
      <AnimatedSection className="container mx-auto px-4 pb-16 grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl">
        <Link to="/actualizaciones" className="card-medieval p-6 text-center hover:border-primary transition-colors">
          <h3 className="font-heading font-bold text-lg mb-1">Ver Actualizaciones</h3>
          <p className="text-muted-foreground text-sm font-body">Entérate de las novedades</p>
        </Link>
        <Link to="/votar" className="card-medieval p-6 text-center hover:border-primary transition-colors">
          <h3 className="font-heading font-bold text-lg mb-1">Votar</h3>
          <p className="text-muted-foreground text-sm font-body">Apoya al servidor y gana recompensas</p>
        </Link>
        <a href="https://tienda.solvianmc.net/" target="_blank" rel="noopener noreferrer" className="card-medieval p-6 text-center hover:border-primary transition-colors">
          <h3 className="font-heading font-bold text-lg mb-1">Tienda</h3>
          <p className="text-muted-foreground text-sm font-body">Consigue rangos y más</p>
        </a>
      </AnimatedSection>

      {/* Game Modes */}
      <AnimatedSection className="container mx-auto px-4 pb-16 max-w-4xl">
        <h2 className="font-heading text-2xl md:text-3xl font-bold text-gradient-gold text-center mb-8">Modos de Juego</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: <Shield className="text-primary" size={32} />, title: "Gens", mode: "gens", desc: "Genera recursos, construye tu base y domina la economía del servidor." },
            { icon: <Palmtree className="text-secondary" size={32} />, title: "Survival", mode: "survival", desc: "Experiencia survival con mejoras únicas, economía, clanes y aventuras épicas." },
            { icon: <Sword className="text-accent" size={32} />, title: "Arcade Games", mode: "arcade", desc: "Minijuegos rápidos y divertidos para jugar con amigos." },
          ].map((mode) => (
            <Link to={`/actualizaciones?mode=${mode.mode}`} key={mode.mode} className="card-medieval p-6 text-center hover:border-primary transition-colors group">
              <div className="flex justify-center mb-3">{mode.icon}</div>
              <h3 className="font-heading font-bold text-lg mb-2">{mode.title}</h3>
              <p className="text-muted-foreground text-sm font-body">{mode.desc}</p>
            </Link>
          ))}
        </div>
      </AnimatedSection>

      {/* FAQ */}
      <AnimatedSection className="container mx-auto px-4 pb-16 max-w-3xl">
        <h2 className="font-heading text-2xl md:text-3xl font-bold text-gradient-gold text-center mb-8">Preguntas Frecuentes</h2>
        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <div key={i} className="card-medieval overflow-hidden">
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full flex items-center justify-between p-5 text-left"
              >
                <span className="font-heading font-semibold text-sm">{faq.q}</span>
                <ChevronDown className={`text-muted-foreground transition-transform ${openFaq === i ? "rotate-180" : ""}`} size={18} />
              </button>
              {openFaq === i && (
                <div className="px-5 pb-5">
                  <p className="text-muted-foreground font-body text-sm">{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </AnimatedSection>

      {/* Rules */}
      <AnimatedSection className="container mx-auto px-4 pb-16 max-w-3xl">
        <h2 className="font-heading text-2xl md:text-3xl font-bold text-gradient-gold text-center mb-8">Reglas del Servidor</h2>
        <div className="space-y-3">
          {rules.map((rule, i) => (
            <div key={i} className="card-medieval p-4 flex items-start gap-4">
              <span className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-heading font-bold text-sm">
                {i + 1}
              </span>
              <p className="font-body text-sm pt-1">{rule}</p>
            </div>
          ))}
        </div>
      </AnimatedSection>

      {/* Team */}
      <AnimatedSection className="container mx-auto px-4 pb-16 max-w-4xl">
        <h2 className="font-heading text-2xl md:text-3xl font-bold text-gradient-gold text-center mb-8">Equipo Administrativo</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {teamMembers.map((member) => (
            <div key={member.name} className="card-medieval p-4 text-center">
              <img src={member.avatar} alt={member.name} className="w-16 h-16 rounded-full mx-auto mb-2 border-2 border-primary" />
              <h4 className="font-heading font-bold text-sm">{member.name}</h4>
              <p className="text-muted-foreground text-xs font-body">{member.role}</p>
            </div>
          ))}
        </div>
        <div className="text-center mt-6">
          <Link to="/staff" className="text-primary font-heading font-bold text-sm hover:underline">
            Ver equipo completo
          </Link>
        </div>
      </AnimatedSection>

      {/* Social */}
      <AnimatedSection className="container mx-auto px-4 pb-16 max-w-3xl text-center">
        <h2 className="font-heading text-2xl md:text-3xl font-bold text-gradient-gold mb-6">Nuestras Redes</h2>
        <div className="flex flex-wrap justify-center gap-4">
          <a href="https://tienda.solvianmc.net/" target="_blank" rel="noopener noreferrer" className="px-6 py-3 card-medieval font-heading font-bold text-sm hover:border-primary transition-colors flex items-center gap-2">
            <ShoppingCart size={18} /> Tienda
          </a>
          <a href="https://discord.gg/y4ajWpbGd5" target="_blank" rel="noopener noreferrer" className="px-6 py-3 card-medieval font-heading font-bold text-sm hover:border-primary transition-colors flex items-center gap-2">
            <MessageCircle size={18} /> Discord
          </a>
          <a href="https://youtube.com/" target="_blank" rel="noopener noreferrer" className="px-6 py-3 card-medieval font-heading font-bold text-sm hover:border-primary transition-colors flex items-center gap-2">
            <Youtube size={18} /> YouTube
          </a>
          <Link to="/votar" className="px-6 py-3 card-medieval font-heading font-bold text-sm hover:border-primary transition-colors flex items-center gap-2">
            <Vote size={18} /> Votar
          </Link>
        </div>
      </AnimatedSection>
    </Layout>
  );
};

export default Index;
