import Layout from "@/components/Layout";
import AnimatedSection from "@/components/AnimatedSection";
import { MessageCircle, Users } from "lucide-react";

const DISCORD_SOLVIAN_ID = "1487527989385363606";
const DISCORD_ALLY_ID = "938999745366614047";

const DiscordCard = ({ title, widgetId, inviteLink, label }: { title: string; widgetId: string; inviteLink: string; label: string }) => {
  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="card-medieval rounded-2xl overflow-hidden border border-primary/30 shadow-lg shadow-primary/10 transition-transform duration-300 hover:-translate-y-1">
        <div className="flex items-center justify-between px-5 py-4 bg-primary/10 border-b border-primary/20">
          <div className="flex items-center gap-2">
            <Users size={18} className="text-primary" />
            <span className="font-heading font-bold text-lg text-gradient-gold">{title}</span>
          </div>
          <span className="text-xs text-muted-foreground font-body">{label}</span>
        </div>
        <iframe
          src={"https://discord.com/widget?id=" + widgetId + "&theme=dark"}
          width="100%"
          height="420"
          sandbox="allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts"
          className="border-0 block"
          title={"Discord Widget - " + title}
        />
        <div className="px-5 py-4 bg-primary/5 border-t border-primary/20 flex justify-center">
          
            href={inviteLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-2 bg-primary text-primary-foreground font-heading font-bold rounded-xl glow-gold hover:opacity-90 transition text-sm"
          >
            <MessageCircle size={16} />
            Unirse al servidor
          </a>
        </div>
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
        <p className="text-muted-foreground font-body mb-14 max-w-xl mx-auto">
          Únete a nuestra comunidad y la de nuestros aliados. ¡Te esperamos!
        </p>

        <div className="flex flex-col gap-16">
          <div>
            <div className="inline-block mb-6 px-4 py-1 rounded-full border border-primary/40 bg-primary/10 text-primary font-heading text-sm font-bold tracking-widest uppercase">
              SolvianMC
            </div>
            <DiscordCard
              title="SolvianMC"
              widgetId={DISCORD_SOLVIAN_ID}
              inviteLink="https://discord.gg/y4ajWpbGd5"
              label="Servidor Principal"
            />
          </div>

          <div className="relative">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
            <div className="inline-block mb-6 px-4 py-1 rounded-full border border-primary/40 bg-primary/10 text-primary font-heading text-sm font-bold tracking-widest uppercase mt-4">
              Ally
            </div>
            <DiscordCard
              title="Chillied"
              widgetId={DISCORD_ALLY_ID}
              inviteLink="https://discord.gg/chillied"
              label="Servidor Aliado"
            />
          </div>
        </div>
      </AnimatedSection>
    </Layout>
  );
};

export default Discord;
