import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import Layout from "@/components/Layout";
import { Calendar, FileText, Image as ImageIcon, Gamepad2, Sword, Leaf } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const CATEGORIES = [
  { id: "all", label: "Todas", icon: FileText },
  { id: "global", label: "Global", icon: FileText },
  { id: "gens", label: "Gens", icon: Gamepad2 },
  { id: "survival", label: "Survival", icon: Leaf },
  { id: "arcade", label: "Arcade Games", icon: Sword },
] as const;

interface Update {
  id: string;
  title: string;
  date: string;
  content: string;
  category: string;
  update_number: number;
  images: string[];
}

const Actualizaciones = () => {
  const [searchParams] = useSearchParams();
  const [updates, setUpdates] = useState<Update[]>([]);
  const [loading, setLoading] = useState(true);
  const initialCategory = searchParams.get("mode") || "all";
  const [activeCategory, setActiveCategory] = useState(initialCategory);
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);

  useEffect(() => {
    const mode = searchParams.get("mode");
    if (mode && CATEGORIES.some((c) => c.id === mode)) {
      setActiveCategory(mode);
    }
  }, [searchParams]);

  useEffect(() => {
    const fetchUpdates = async () => {
      const { data, error } = await supabase
        .from("updates")
        .select("*")
        .order("created_at", { ascending: false });
      if (!error && data) setUpdates(data as Update[]);
      setLoading(false);
    };
    fetchUpdates();
  }, []);

  const filtered = activeCategory === "all"
    ? updates
    : updates.filter((u) => u.category === activeCategory);

  const getCategoryLabel = (cat: string) =>
    CATEGORIES.find((c) => c.id === cat)?.label ?? cat;

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case "gens": return "bg-purple-500/20 text-purple-700 border-purple-500/30";
      case "survival": return "bg-emerald-500/20 text-emerald-700 border-emerald-500/30";
      case "arcade": return "bg-amber-500/20 text-amber-700 border-amber-500/30";
      case "global": return "bg-primary/20 text-primary border-primary/30";
      default: return "bg-muted text-muted-foreground";
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <h1 className="font-heading text-3xl md:text-4xl font-bold text-gradient-gold text-center mb-2">Actualizaciones</h1>
        <p className="text-muted-foreground font-body text-center mb-8">Todas las novedades de los modos de juego de SolvianMC</p>

        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-heading font-bold text-sm transition-all border-2 ${
                  activeCategory === cat.id
                    ? "bg-primary text-primary-foreground border-primary glow-gold"
                    : "bg-card border-border text-muted-foreground hover:border-primary/50"
                }`}
              >
                <Icon size={16} />
                {cat.label}
              </button>
            );
          })}
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-muted-foreground font-body">Cargando...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 card-medieval">
            <p className="text-muted-foreground font-body">No hay actualizaciones en esta categoría. ¡Vuelve pronto!</p>
          </div>
        ) : (
          <div className="space-y-6">
            {filtered.map((update) => (
              <div key={update.id} className="card-medieval p-6">
                <div className="flex items-center gap-3 mb-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-heading font-bold border ${getCategoryColor(update.category)}`}>
                    {getCategoryLabel(update.category)}
                  </span>
                  <span className="text-xs text-muted-foreground font-body">Update #{update.update_number}</span>
                </div>
                <h2 className="font-heading font-bold text-xl mb-2">{update.title}</h2>
                <p className="text-muted-foreground font-body whitespace-pre-wrap mb-4">{update.content}</p>

                {update.images && update.images.length > 0 && (
                  <div className="mb-4">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {update.images.map((img, i) => (
                        <button key={i} onClick={() => setLightboxImg(img)} className="relative aspect-video rounded-lg overflow-hidden border-2 border-border hover:border-primary transition-colors">
                          <img src={img} alt={`Imagen ${i + 1}`} className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2 text-xs text-muted-foreground font-body">
                  <Calendar size={14} />
                  Publicado el {update.date}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {lightboxImg && (
        <div className="fixed inset-0 bg-foreground/80 z-50 flex items-center justify-center p-4" onClick={() => setLightboxImg(null)}>
          <img src={lightboxImg} alt="Vista ampliada" className="max-w-full max-h-full rounded-xl" onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </Layout>
  );
};

export default Actualizaciones;
