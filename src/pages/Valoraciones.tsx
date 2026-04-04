import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { Star, Send, Clock, AlertCircle, LogIn, ShieldAlert } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

import { useAuth } from "@/hooks/useAuth";

interface Review {
  id: string;
  name: string;
  stars: number;
  comment: string;
  date: string;
}

const COOLDOWN_KEY = "solvianmc_review_cooldown";
const COOLDOWN_MS = 10 * 60 * 1000;

const Valoraciones = () => {
  const { user, isStaffUser } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [name, setName] = useState("");
  const [stars, setStars] = useState(5);
  const [comment, setComment] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReviews = async () => {
      const { data, error } = await supabase
        .from("reviews")
        .select("*")
        .order("created_at", { ascending: false });
      if (!error && data) setReviews(data);
      setLoading(false);
    };
    fetchReviews();

    const lastPost = localStorage.getItem(COOLDOWN_KEY);
    if (lastPost) {
      const remaining = COOLDOWN_MS - (Date.now() - parseInt(lastPost));
      if (remaining > 0) setCooldown(remaining);
    }
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => {
        const next = prev - 1000;
        return next <= 0 ? 0 : next;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const formatCooldown = (ms: number) => {
    const mins = Math.floor(ms / 60000);
    const secs = Math.floor((ms % 60000) / 1000);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const avgStars = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.stars, 0) / reviews.length).toFixed(1)
    : "0";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !comment.trim() || cooldown > 0) return;
    const dateStr = new Date().toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" });
    const { data, error } = await supabase
      .from("reviews")
      .insert({ name: name.trim(), stars, comment: comment.trim(), date: dateStr })
      .select()
      .single();
    if (!error && data) {
      setReviews([data, ...reviews]);
      localStorage.setItem(COOLDOWN_KEY, Date.now().toString());
      setCooldown(COOLDOWN_MS);
      setName("");
      setComment("");
      setStars(5);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <h1 className="font-heading text-3xl md:text-4xl font-bold text-gradient-gold text-center mb-4">Valoraciones</h1>
        
        <div className="flex justify-center gap-8 mb-8">
          <div className="text-center">
            <p className="font-heading text-3xl font-bold text-gradient-gold">{avgStars}</p>
            <p className="text-muted-foreground text-sm font-body">Promedio</p>
          </div>
          <div className="text-center">
            <p className="font-heading text-3xl font-bold">{reviews.length}</p>
            <p className="text-muted-foreground text-sm font-body">Reseñas</p>
          </div>
        </div>

        {/* Form */}
        <div className="card-medieval p-6 mb-8">
          <h3 className="font-heading font-bold text-lg mb-4">Deja tu reseña</h3>

          {isStaffUser ? (
            <div className="text-center py-4">
              <ShieldAlert className="mx-auto mb-2 text-muted-foreground" size={24} />
              <p className="text-muted-foreground font-body text-sm">Las cuentas de staff no pueden dejar reseñas. Inicia sesión con Google para hacerlo.</p>
            </div>
          ) : !user ? (
            <div className="text-center py-4">
              <AlertCircle className="mx-auto mb-2 text-muted-foreground" size={24} />
              <p className="text-muted-foreground font-body text-sm mb-3">Debes iniciar sesión con Google para dejar una reseña.</p>
              <button
                onClick={async () => {
                  const { error } = await supabase.auth.signInWithOAuth({
                    provider: "google",
                    options: { redirectTo: window.location.origin + "/valoraciones" },
                  });
                  if (error) console.error(error);
                }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-heading font-bold text-sm"
              >
                <LogIn size={16} /> Iniciar sesión con Google
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {cooldown > 0 && (
                <div className="flex items-center gap-2 text-muted-foreground text-sm font-body">
                  <Clock size={16} />
                  Podrás enviar otra reseña en {formatCooldown(cooldown)}
                </div>
              )}
              <input
                type="text"
                placeholder="Tu nombre"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2 rounded-lg bg-background border border-border font-body focus:outline-none focus:ring-2 focus:ring-primary"
                maxLength={30}
                disabled={cooldown > 0}
              />
              <div>
                <label className="text-sm font-heading font-semibold mb-1 block">Puntuación</label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button key={s} type="button" onClick={() => cooldown <= 0 && setStars(s)} disabled={cooldown > 0}>
                      <Star size={24} className={s <= stars ? "text-primary fill-primary" : "text-muted-foreground"} />
                    </button>
                  ))}
                </div>
              </div>
              <textarea
                placeholder="Tu comentario..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full px-4 py-2 rounded-lg bg-background border border-border font-body focus:outline-none focus:ring-2 focus:ring-primary min-h-[80px]"
                maxLength={500}
                disabled={cooldown > 0}
              />
              <button
                type="submit"
                disabled={cooldown > 0 || !name.trim() || !comment.trim()}
                className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-heading font-bold text-sm flex items-center gap-2 disabled:opacity-50"
              >
                <Send size={16} /> Enviar
              </button>
            </form>
          )}
        </div>

        {/* Reviews list */}
        {loading ? (
          <div className="text-center py-8">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : reviews.length === 0 ? (
          <p className="text-center text-muted-foreground font-body">No hay reseñas aún. ¡Sé el primero!</p>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <div key={review.id} className="card-medieval p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-heading font-bold">{review.name}</span>
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} size={14} className={s <= review.stars ? "text-primary fill-primary" : "text-muted-foreground"} />
                    ))}
                  </div>
                </div>
                <p className="text-muted-foreground font-body text-sm mb-1">{review.comment}</p>
                <p className="text-xs text-muted-foreground/60 font-body">{review.date}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Valoraciones;
