import { useState, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Search, ArrowLeft, Rocket, Terminal, Shield, Coins, Sparkles, Compass,
  type LucideIcon,
} from "lucide-react";
import Layout from "@/components/Layout";
import AnimatedSection from "@/components/AnimatedSection";

interface WikiItem { title: string; description: string }
interface WikiSection { title: string; items: WikiItem[] }
interface WikiCategory {
  slug: string;
  title: string;
  short: string;
  icon: LucideIcon;
  color: string;
  subcategories: string[];
  sections: WikiSection[];
}

const CATEGORIES: WikiCategory[] = [
  {
    slug: "primeros-pasos",
    title: "Primeros pasos",
    short: "Cómo conectarte y empezar",
    icon: Rocket,
    color: "text-primary",
    subcategories: ["Llegada al spawn", "Explorar y elegir base", "Primeros avances"],
    sections: [
      {
        title: "Llegada al spawn",
        items: [
          { title: "Conectarte", description: "Abre Minecraft, añade el servidor con IP play.solvianmc.net y entra. Te recibirá el spawn con NPCs informativos." },
          { title: "Tutorial inicial", description: "Habla con el NPC de bienvenida para recibir tu kit inicial y aprender lo básico del servidor." },
          { title: "Elegir modalidad", description: "Desde el spawn puedes acceder a las modalidades disponibles (Survival, Gens, etc.) usando los portales." },
        ],
      },
      {
        title: "Explorar y elegir base",
        items: [
          { title: "/rtp", description: "Te teletransporta a una zona aleatoria lejos del spawn para encontrar un buen lugar donde construir." },
          { title: "Buscar bioma", description: "Explora varios biomas antes de fijar tu base — algunos tienen recursos exclusivos." },
          { title: "Distancia segura", description: "Construye lejos del spawn para evitar griefers y tener tranquilidad para crecer." },
        ],
      },
      {
        title: "Primeros avances",
        items: [
          { title: "Recolecta recursos", description: "Madera, piedra, comida — lo básico para sobrevivir las primeras noches." },
          { title: "/sethome", description: "Marca tu base como home para teletransportarte de vuelta con /home." },
          { title: "Únete a la comunidad", description: "Entra al Discord oficial para coordinar con otros jugadores y enterarte de eventos." },
        ],
      },
    ],
  },
  {
    slug: "comandos-basicos",
    title: "Comandos básicos",
    short: "Essentials y utilidades",
    icon: Terminal,
    color: "text-accent",
    subcategories: ["Teletransporte", "Casas y warps", "Mensajes"],
    sections: [
      {
        title: "Teletransporte",
        items: [
          { title: "/tpa <jugador>", description: "Envía una solicitud de teletransporte a otro jugador." },
          { title: "/tpaccept", description: "Acepta la solicitud de teletransporte recibida." },
          { title: "/tpdeny", description: "Rechaza la solicitud de teletransporte recibida." },
        ],
      },
      {
        title: "Casas y warps",
        items: [
          { title: "/sethome <nombre>", description: "Establece una casa con el nombre indicado en tu posición actual." },
          { title: "/home <nombre>", description: "Te teletransporta a la casa guardada." },
          { title: "/warp <nombre>", description: "Te teletransporta a una zona pública creada por el staff." },
        ],
      },
      {
        title: "Mensajes",
        items: [
          { title: "/msg <jugador> <texto>", description: "Envía un mensaje privado a otro jugador." },
          { title: "/r <texto>", description: "Responde al último mensaje privado recibido." },
          { title: "/ignore <jugador>", description: "Ignora los mensajes y chat de un jugador específico." },
        ],
      },
    ],
  },
  {
    slug: "survival",
    title: "Survival",
    short: "Protecciones y exploración",
    icon: Shield,
    color: "text-secondary",
    subcategories: ["ProtectionStone", "RTP", "Comandos extra"],
    sections: [
      {
        title: "ProtectionStone",
        items: [
          { title: "¿Qué es?", description: "Sistema de protección de terrenos mediante bloques especiales que puedes comprar en la tienda." },
          { title: "/ps info", description: "Muestra información de la protección donde estás parado." },
          { title: "/ps add <jugador>", description: "Añade a un jugador como miembro de tu protección." },
        ],
      },
      {
        title: "RTP",
        items: [
          { title: "/rtp", description: "Random Teleport: te lleva a una ubicación aleatoria en el mundo Survival." },
          { title: "Cooldown", description: "Hay un tiempo de espera entre usos para evitar abuso del comando." },
          { title: "Zonas seguras", description: "El RTP nunca te dejará en zonas protegidas o peligrosas como lava." },
        ],
      },
      {
        title: "Comandos extra",
        items: [
          { title: "/back", description: "Te devuelve al último lugar donde moriste o te teletransportaste." },
          { title: "/spawn", description: "Te lleva al spawn principal del servidor." },
          { title: "/balance", description: "Muestra tu dinero actual en el servidor." },
        ],
      },
    ],
  },
  {
    slug: "economia",
    title: "Economía",
    short: "Dinero, trabajos y tienda",
    icon: Coins,
    color: "text-primary",
    subcategories: ["Sistema de dinero", "Jobs", "Tienda y ventas"],
    sections: [
      {
        title: "Sistema de dinero",
        items: [
          { title: "/balance", description: "Consulta tu saldo actual." },
          { title: "/pay <jugador> <cantidad>", description: "Envía dinero a otro jugador del servidor." },
          { title: "/baltop", description: "Ranking de los jugadores más ricos del servidor." },
        ],
      },
      {
        title: "Jobs",
        items: [
          { title: "/jobs browse", description: "Lista todos los trabajos disponibles para unirte." },
          { title: "/jobs join <nombre>", description: "Te unes al trabajo seleccionado para ganar dinero realizando esas tareas." },
          { title: "/jobs stats", description: "Muestra tu progreso, nivel y ganancias en los trabajos activos." },
        ],
      },
      {
        title: "Tienda y ventas",
        items: [
          { title: "/shop", description: "Abre la tienda del servidor para comprar y vender items." },
          { title: "/sell hand", description: "Vende el item que tienes en la mano al precio actual de la tienda." },
          { title: "Subasta /ah", description: "Pon items a la venta para otros jugadores en la casa de subastas." },
        ],
      },
    ],
  },
  {
    slug: "habilidades",
    title: "Habilidades",
    short: "AuraSkills y progresión RPG",
    icon: Sparkles,
    color: "text-accent",
    subcategories: ["Skills disponibles", "Comandos", "Bonificaciones"],
    sections: [
      {
        title: "Skills disponibles",
        items: [
          { title: "Minería", description: "Sube de nivel picando piedra y minerales. Otorga bonificaciones a recolección." },
          { title: "Combate", description: "Sube combatiendo mobs. Mejora el daño y las defensas." },
          { title: "Agricultura", description: "Sube cultivando y cosechando. Aumenta las probabilidades de drops dobles." },
        ],
      },
      {
        title: "Comandos",
        items: [
          { title: "/skills", description: "Abre el menú de habilidades con tu progreso actual." },
          { title: "/skills top <skill>", description: "Muestra el ranking del skill indicado." },
          { title: "/stats", description: "Consulta tus stats (fuerza, salud, regeneración, etc.)." },
        ],
      },
      {
        title: "Bonificaciones",
        items: [
          { title: "Stats pasivos", description: "Cada skill otorga stats permanentes según tu nivel." },
          { title: "Habilidades activas", description: "Algunos skills desbloquean habilidades activadas con clic derecho." },
          { title: "Recompensas por nivel", description: "Al subir ciertos hitos ganas dinero, items o títulos exclusivos." },
        ],
      },
    ],
  },
  {
    slug: "misiones",
    title: "Misiones",
    short: "Quests y recompensas",
    icon: Compass,
    color: "text-secondary",
    subcategories: ["Tipos de misiones", "Comandos", "Recompensas"],
    sections: [
      {
        title: "Tipos de misiones",
        items: [
          { title: "Diarias", description: "Misiones cortas que se reinician cada día con recompensas básicas." },
          { title: "Semanales", description: "Más largas y desafiantes, con mejores premios." },
          { title: "Eventos", description: "Misiones temporales por eventos especiales del servidor." },
        ],
      },
      {
        title: "Comandos",
        items: [
          { title: "/quests", description: "Abre el menú de misiones disponibles." },
          { title: "/quests accept <id>", description: "Acepta la misión indicada." },
          { title: "/quests progress", description: "Muestra tus misiones activas y su progreso." },
        ],
      },
      {
        title: "Recompensas",
        items: [
          { title: "Dinero", description: "La mayoría de misiones otorga monedas del servidor." },
          { title: "Items exclusivos", description: "Algunas dan items raros que no se consiguen de otra forma." },
          { title: "Puntos de evento", description: "Acumula puntos para canjear en eventos especiales." },
        ],
      },
    ],
  },
];

const WikiHome = () => {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return CATEGORIES;
    return CATEGORIES.filter((c) =>
      c.title.toLowerCase().includes(q) ||
      c.short.toLowerCase().includes(q) ||
      c.subcategories.some((s) => s.toLowerCase().includes(q))
    );
  }, [query]);

  return (
    <Layout>
      <AnimatedSection className="container mx-auto px-4 py-12 max-w-6xl">
        <div className="text-center mb-10">
          <h1 className="font-heading text-4xl md:text-5xl font-bold text-gradient-gold mb-3">Wiki — SolvianMC</h1>
          <p className="text-muted-foreground font-body text-lg">Todo lo que necesitas saber del servidor</p>
        </div>

        <div className="max-w-2xl mx-auto mb-10 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar en la wiki..."
            className="w-full pl-12 pr-4 py-3 rounded-xl bg-[#222] border-2 border-border font-body focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((cat, i) => {
            const Icon = cat.icon;
            return (
              <motion.div
                key={cat.slug}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Link
                  to={`/wiki/${cat.slug}`}
                  className="block bg-[#222] border-2 border-border rounded-xl p-6 hover:border-primary hover:shadow-[0_0_20px_rgba(212,160,23,0.2)] transition-all duration-200 h-full group"
                >
                  <Icon className={`${cat.color} mb-3 group-hover:scale-110 transition-transform`} size={36} />
                  <h2 className="font-heading text-xl font-bold mb-1">{cat.title}</h2>
                  <p className="text-muted-foreground font-body text-sm mb-4">{cat.short}</p>
                  <ul className="space-y-1">
                    {cat.subcategories.map((s) => (
                      <li key={s} className="text-xs text-muted-foreground font-body flex items-center gap-1.5">
                        <span className="text-primary">›</span> {s}
                      </li>
                    ))}
                  </ul>
                </Link>
              </motion.div>
            );
          })}
          {filtered.length === 0 && (
            <p className="col-span-full text-center text-muted-foreground font-body py-12">
              No se encontró ninguna categoría con "{query}".
            </p>
          )}
        </div>
      </AnimatedSection>
    </Layout>
  );
};

const WikiDetail = ({ slug }: { slug: string }) => {
  const navigate = useNavigate();
  const cat = CATEGORIES.find((c) => c.slug === slug);
  if (!cat) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="font-heading text-2xl font-bold mb-4">Categoría no encontrada</h1>
          <button onClick={() => navigate("/wiki")} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-heading font-bold">
            Volver a la Wiki
          </button>
        </div>
      </Layout>
    );
  }
  const Icon = cat.icon;
  const isCommand = (s: string) => s.trim().startsWith("/");

  return (
    <Layout>
      <AnimatedSection className="container mx-auto px-4 py-12 max-w-6xl">
        <Link to="/wiki" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary font-body mb-6 transition">
          <ArrowLeft size={16} /> Volver a la Wiki
        </Link>

        <div className="flex items-start gap-4 mb-10 pb-6 border-b-2 border-border">
          <div className="p-4 rounded-xl bg-[#222] border-2 border-border">
            <Icon className={cat.color} size={40} />
          </div>
          <div>
            <h1 className="font-heading text-3xl md:text-4xl font-bold text-gradient-gold mb-1">{cat.title}</h1>
            <p className="text-muted-foreground font-body">{cat.short}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {cat.sections.map((section, i) => (
            <motion.div
              key={section.title}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-[#222] border-2 border-border rounded-xl p-5"
            >
              <h3 className="font-heading text-lg font-bold mb-4 text-primary">{section.title}</h3>
              <div className="space-y-3">
                {section.items.map((item) => (
                  <div key={item.title}>
                    {isCommand(item.title) ? (
                      <code className="inline-block px-2 py-1 rounded-md bg-[#1a1208] border border-primary/40 text-primary font-mono text-xs mb-1">
                        {item.title}
                      </code>
                    ) : (
                      <p className="font-heading font-semibold text-sm mb-1">{item.title}</p>
                    )}
                    <p className="text-muted-foreground font-body text-xs leading-relaxed">{item.description}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </AnimatedSection>
    </Layout>
  );
};

const Wiki = () => {
  const { slug } = useParams<{ slug?: string }>();
  if (slug) return <WikiDetail slug={slug} />;
  return <WikiHome />;
};

export default Wiki;
