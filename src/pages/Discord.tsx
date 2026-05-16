import Layout from "@/components/Layout";
import AnimatedSection from "@/components/AnimatedSection";
import { MessageCircle } from "lucide-react";

const DISCORD_SOLVIAN_ID = "1487527989385363606";
const DISCORD_ALLY_ID = "938999745366614047";

const btnClass = "inline-flex items-center gap-2 px-5 py-2 bg-[#5865F2] text-white font-heading font-bold rounded-lg hover:bg-[#4752c4] transition text-sm";

const DiscordCard = ({ title, widgetId, inviteLink, label, logo, badgeClass }: { title: string; widgetId: string; inviteLink: string; label: string; logo: string; badgeClass: string }) => {
  const src = "https://discord.com/widget?id=" + widgetId + "&theme=dark";
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
      <iframe src={src} width="100%" height="400" sandbox="allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts" className="border-0 block" title={"Discord Widget - " + title} />
      <div className="flex items-center justify-between px-5 py-4 bg-black/20 border-t border-primary/20">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
          En línea
        </div>
        <a href={inviteLink} target="_blank" rel="noopener noreferrer" className={btnClass}><MessageCircle size={14} />Unirse al servidor</a>
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
          <DiscordCard title="SolvianMC" widgetId={DISCORD_SOLVIAN_ID} inviteLink="https://discord.gg/y4ajWpbGd5" label="Servidor Principal" logo="/SOLVIAN.png" badgeClass="text-xs px-3 py-1 rounded-full border border-primary/40 bg-primary/10 text-primary font-bold" />
          <DiscordCard title="Chillied" widgetId={DISCORD_ALLY_ID} inviteLink="https://discord.gg/chillied" label="Servidor Aliado" logo="/chilledally.webp" badgeClass="text-xs px-3 py-1 rounded-full border border-teal-500/40 bg-teal-500/10 text-teal-400 font-bold" />
        </div>
      </AnimatedSection>
    </Layout>
  );
};

export default Discord;
