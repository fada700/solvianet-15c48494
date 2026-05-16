import Layout from "@/components/Layout";
import AnimatedSection from "@/components/AnimatedSection";
import { MessageCircle } from "lucide-react";
import { useEffect, useState } from "react";

const useInviteStats = (code: string) => {
  const [stats, setStats] = useState<{ online: number; total: number } | null>(null);
  useEffect(() => {
    fetch("https://discord.com/api/v9/invites/" + code + "?with_counts=true")
      .then((r) => r.json())
      .then((d) => setStats({ online: d.approximate_presence_count, total: d.approximate_member_count }))
      .catch(() => setStats(null));
  }, [code]);
  return stats;
};

const DiscordCard = ({ title, inviteCode, inviteLink, label, logo, badgeClass }: { title: string; inviteCode: string; inviteLink: string; label: string; logo: string; badgeClass: string }) => {
  const stats = useInviteStats(inviteCode);
  return (
    <div className="flex flex-col rounded-2xl overflow-hidden border border-primary/20 bg-background shadow-md hover:-translate-y-1 transition-transform duration-300">
      <div className="flex items-center gap-3 px-5 py-4 bg-black/30 border-b border-primary/20">
        <img src={logo} alt={title} className="w-14 h-14 rounded-xl object-cover bg-black" />
        <div className="flex-1">
          <p className="font-heading font-bold text-lg text-gradient-gold">{title}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
        <span className={badgeClass}>{label === "Servidor Principal" ? "Principal" : "Ally"}</span>
      </div>
      <div className="flex flex-col items-center justify-center gap-6 py-12 px-6 bg-[#1e1f22]">
        <img src={logo} alt={title} className="w-24 h-24 rounded-2xl object-cover shadow-lg" />
        <div className="flex gap-8 text-center">
          <div>
            <p className="text-2xl font-heading font-bold text-white">{stats ? stats.total.toLocaleString() : "—"}</p>
            <p className="text-xs text-[#b9bbbe] mt-1">Miembros</p>
          </div>
          <div className="w-px bg-white/10" />
          <div>
            <div className="flex items-center justify-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
              <p className="text-2xl font-heading font-bold text-white">{stats ? stats.online.toLocaleString() : "—"}</p>
            </div>
            <p className="text-xs text-[#b9bbbe] mt-1">En línea</p>
          </div>
        </div>
        <a href={inviteLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-6 py-3 bg-[#5865F2] text-white font-heading font-bold rounded-xl hover:bg-[#4752c4] transition text-base"><MessageCircle size={18} />Unirse al servidor</a>
      </div>
    </div>
  );
};

const Discord = () => {
  return (
    <Layout>
      <AnimatedSection className="container mx-auto px-4 py-16 max-w-6xl text-center">
        <MessageCircle className="mx-auto text-primary mb-4" size={48} />
        <h1 className="font-heading text-3xl md:text-4xl font-bold text-gradient-gold mb-2">Discord</h1>
        <p className="text-muted-foreground font-body mb-12 max-w-xl mx-auto">Únete a nuestra comunidad y la de nuestros aliados. ¡Te esperamos!</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <DiscordCard title="SolvianMC" inviteCode="y4ajWpbGd5" inviteLink="https://discord.gg/y4ajWpbGd5" label="Servidor Principal" logo="/SOLVIAN.png" badgeClass="text-xs px-3 py-1 rounded-full border border-primary/40 bg-primary/10 text-primary font-bold" />
          <DiscordCard title="Chillied" inviteCode="chillied" inviteLink="https://discord.gg/chillied" label="Servidor Aliado" logo="/chilledally.webp" badgeClass="text-xs px-3 py-1 rounded-full border border-teal-500/40 bg-teal-500/10 text-teal-400 font-bold" />
        </div>
      </AnimatedSection>
    </Layout>
  );
};

export default Discord;
