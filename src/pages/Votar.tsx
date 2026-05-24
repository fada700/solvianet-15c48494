import Layout from "@/components/Layout";
import { Vote } from "lucide-react";
import logo from "@/assets/SOLVIAN.png";

const Votar = () => (
  <Layout>
    <div className="container mx-auto px-4 py-16 max-w-3xl text-center">
      <p className="text-muted-foreground font-body text-sm mb-2">Servidores de Minecraft</p>
      <h1 className="font-heading text-3xl md:text-4xl font-bold text-gradient-gold mb-6">
        ¡Apoya al servidor y serás recompensado!
      </h1>
      <img src={logo} alt="SolvianMC" className="w-24 h-24 rounded-full mx-auto mb-6 border-2 border-primary glow-gold" />
      <div className="card-medieval p-6 text-left mb-8">
        <p className="text-muted-foreground font-body leading-relaxed">
          Al votar desde este enlace, recibirás recompensa en todas esas modalidades; las recompensas pueden variar,
          dependiendo de la modalidad. De igual manera, ten en cuenta que no necesitas estar en línea para recibir la recompensa.
          ¡Puedes votar ahora y al ingresar a la modalidad, recibirás las recompensas que te corresponden!
          Los votos caducan en 15 días; es decir, si votas y pasas 15 días sin entrar, los votos se perderán.
        </p>
      </div>
      <a
        href="https://example.votar/1"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 px-8 py-3 bg-primary text-primary-foreground font-heading font-bold rounded-xl glow-gold hover:opacity-90 transition text-lg"
      >
        <Vote size={20} /> 🗳️ ¡Votar Ahora!
      </a>
    </div>
  </Layout>
);

export default Votar;
