import Layout from "@/components/Layout";
import AnimatedSection from "@/components/AnimatedSection";
import { MessageCircle } from "lucide-react";

const DISCORD_SOLVIAN_ID = "1487527989385363606";
const DISCORD_ALLY_ID = "938999745366614047";

const Discord = () => {
  return (
    <Layout>
      <AnimatedSection className="container mx-auto px-4 py-16 max-w-5xl text-center">
        <MessageCircle className="mx-auto text-primary mb-4" size={48} />
        <h1 className="font-heading text-3xl md:text-4xl font-bold text-gradient-gold mb-4">Discord</h1>
        <p className="text-muted-foreground font-body mb-8 max-w-xl mx-auto">
          Únete a nuestra comunidad en Discord para estar al tanto de todo, hablar con el staff y conocer nuevos amigos.
        </p>
        <a href="https://discord.gg/y4ajWpbGd5" target="_blank" rel="noopener noreferrer" className="inline-block px-8 py-3 bg-primary text-primary-foreground font-heading font-bold rounded-xl glow-gold hover:opacity-90 transition text-lg mb-12">
          Unirse al Discord
        </a>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
          <div className="flex flex-col gap-3">
            <h2 className="font-heading text-xl font-bold text-gradient-gold text-center">SolvianMC</h2>
            <div className="card-medieval overflow-hidden rounded-xl">
              <iframe
                src={"https://discord.com/widget?id=" + DISCORD_SOLVIAN_ID + "&theme=dark"}
                width="100%"
                height="500"
                sandbox="allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts"
                className="border-0"
                title="Discord Widget - SolvianMC"
              />
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <h2 className="font-heading text-xl font-bold text-gradient-gold text-center">Ally — Chillied</h2>
            <div className="card-medieval overflow-hidden rounded-xl">
              <iframe
                src={"https://discord.com/widget?id=" + DISCORD_ALLY_ID + "&theme=dark"}
                width="100%"
                height="500"
                sandbox="allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts"
                className="border-0"
                title="Discord Widget - Chillied"
              />
            </div>
          </div>
        </div>
      </AnimatedSection>
    </Layout>
  );
};

export default Discord;
