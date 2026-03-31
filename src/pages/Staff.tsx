import Layout from "@/components/Layout";
import AnimatedSection from "@/components/AnimatedSection";
import { Crown, Code, Settings } from "lucide-react";
import avatarSoyNulled from "@/assets/avatar-soynulled.png";
import avatarFelixDevYT from "@/assets/avatar-felixdevyt.png";
import avatarLuisDev from "@/assets/avatar-luisdev.png";
import avatarEqo from "@/assets/avatar-eqo.png";
import avatarCarvajal from "@/assets/avatar-carvajal.png";

const staff = [
  {
    name: "Nulled",
    avatar: avatarSoyNulled,
    role: "CEO & Founder",
    icon: Crown,
    description: "Responsable de la dirección general del servidor. Supervisa la administración, coordina los equipos y gestiona el funcionamiento global del proyecto.",
    color: "text-primary",
  },
  {
    name: "xLuixDev",
    avatar: avatarLuisDev,
    role: "CEO & Desarrollador",
    icon: Crown,
    description: "Encargado del desarrollo técnico del servidor, así como de su gestión integral y toma de decisiones a nivel global.",
    color: "text-primary",
  },
  {
    name: "Felix",
    avatar: avatarFelixDevYT,
    role: "CEO & Desarrollador",
    icon: Crown,
    description: "Responsable del desarrollo del servidor y de su gestión general, asegurando el correcto funcionamiento y evolución del proyecto.",
    color: "text-primary",
  },
  {
    name: "Eqo",
    avatar: avatarEqo,
    role: "Desarrollador",
    icon: Code,
    description: "Responsable del desarrollo de sistemas web y programación de la network, asegurando el correcto funcionamiento y optimización de las plataformas.",
    color: "text-accent",
  },
  {
    name: "Carvajal",
    avatar: avatarCarvajal,
    role: "Desarrollador & Configurador",
    icon: Settings,
    description: "Encargado de la creación de experiencias dentro del servidor, así como de la configuración, traducción y ajuste de los distintos sistemas para garantizar una experiencia fluida.",
    color: "text-accent",
  },
];

const Staff = () => (
  <Layout>
    <AnimatedSection className="container mx-auto px-4 py-16 max-w-4xl">
      <h1 className="font-heading text-3xl md:text-4xl font-bold text-gradient-gold text-center mb-4">Nuestro Equipo</h1>
      <p className="text-muted-foreground font-body text-center mb-12 max-w-2xl mx-auto">
        El equipo detrás de SolvianMC. Personas apasionadas trabajando para darte la mejor experiencia.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {staff.map((member, i) => {
          const Icon = member.icon;
          return (
            <AnimatedSection key={member.name} delay={i * 0.1} className="card-medieval p-6 flex gap-4 items-start">
              <img src={member.avatar} alt={member.name} className="w-20 h-20 rounded-full border-2 border-primary flex-shrink-0" />
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Icon size={18} className={member.color} />
                  <h3 className="font-heading font-bold">{member.name}</h3>
                </div>
                <p className={`text-sm font-heading font-semibold ${member.color} mb-2`}>{member.role}</p>
                <p className="text-muted-foreground text-sm font-body">{member.description}</p>
              </div>
            </AnimatedSection>
          );
        })}
      </div>
    </AnimatedSection>
  </Layout>
);

export default Staff;
