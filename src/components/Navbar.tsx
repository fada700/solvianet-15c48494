import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, Shield } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import logo from "@/assets/solvianmc.png";

const navLinks = [
  { name: "Inicio", path: "/", external: false },
  { name: "Actualizaciones", path: "/actualizaciones", external: false },
  { name: "Tienda", path: "https://tienda.solvianmc.net", external: true },
  { name: "Valoraciones", path: "/valoraciones", external: false },
  { name: "Tickets", path: "/tickets", external: false },
  { name: "Aplicaciones", path: "/aplicaciones", external: false },
  { name: "Staff", path: "/staff", external: false },
  { name: "Discord", path: "/discord", external: false },
  { name: "Votar", path: "/votar", external: false },
];

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const { user, isAdmin } = useAuth();

  const copyIP = () => {
    navigator.clipboard.writeText("play.solvianmc.net");
    toast.success("¡IP copiada!", { description: "play.solvianmc.net:25636" });
  };

  return (
    <nav className="sticky top-0 z-50 bg-background/90 backdrop-blur-md border-b-2 border-border">
      <div className="container mx-auto flex items-center justify-between py-3 px-4">
        <Link to="/" className="flex items-center gap-2">
          <img src={logo} alt="SolvianMC" className="h-10 w-10 rounded-full" />
          <span className="font-heading font-bold text-lg text-gradient-gold hidden sm:block">SolvianMC</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) =>
            link.external ? (
              <a
                key={link.name}
                href={link.path}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-2 rounded-lg text-sm font-body font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                {link.name}
              </a>
            ) : (
              <Link
                key={link.name}
                to={link.path}
                className={`px-3 py-2 rounded-lg text-sm font-body font-semibold transition-colors ${
                  location.pathname === link.path
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                {link.name}
              </Link>
            )
          )}
          <button
            onClick={copyIP}
            className="ml-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-heading font-bold text-sm glow-gold hover:opacity-90 transition"
          >
            Copiar IP
          </button>
          {user && isAdmin && (
            <Link
              to="/admin"
              className="ml-1 px-4 py-2 rounded-lg bg-accent text-accent-foreground font-heading font-bold text-sm flex items-center gap-1.5 hover:opacity-90 transition"
            >
              <Shield size={14} /> Admin P.
            </Link>
          )}
        </div>

        {/* Mobile toggle */}
        <button onClick={() => setOpen(!open)} className="md:hidden text-foreground">
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-border bg-background px-4 pb-4">
          {navLinks.map((link) =>
            link.external ? (
              <a
                key={link.name}
                href={link.path}
                target="_blank"
                rel="noopener noreferrer"
                className="block py-2 text-sm font-body font-semibold text-muted-foreground"
                onClick={() => setOpen(false)}
              >
                {link.name}
              </a>
            ) : (
              <Link
                key={link.name}
                to={link.path}
                className={`block py-2 text-sm font-body font-semibold ${
                  location.pathname === link.path ? "text-primary" : "text-muted-foreground"
                }`}
                onClick={() => setOpen(false)}
              >
                {link.name}
              </Link>
            )
          )}
          <button
            onClick={() => { copyIP(); setOpen(false); }}
            className="mt-2 w-full px-4 py-2 rounded-lg bg-primary text-primary-foreground font-heading font-bold text-sm"
          >
            Copiar IP
          </button>
          {user && isAdmin && (
            <Link
              to="/admin"
              className="mt-2 w-full px-4 py-2 rounded-lg bg-accent text-accent-foreground font-heading font-bold text-sm flex items-center justify-center gap-1.5"
              onClick={() => setOpen(false)}
            >
              <Shield size={14} /> Admin P.
            </Link>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
