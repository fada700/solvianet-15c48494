import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, LogOut, ChevronDown, Shield } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import logo from "@/assets/solvianmc.png";

const mainLinks = [
  { name: "Inicio", path: "/", external: false },
  { name: "Actualizaciones", path: "/actualizaciones", external: false },
  { name: "Wiki", path: "/wiki", external: false },
  { name: "Tienda", path: "https://tienda.solvianmc.net", external: true },
  { name: "Aplicaciones", path: "/aplicaciones", external: false },
];

const comunidadLinks = [
  { name: "Discord", path: "/discord" },
  { name: "Valoraciones", path: "/valoraciones" },
  { name: "Votar", path: "/votar" },
];

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const [comOpen, setComOpen] = useState(false);
  const [mobileComOpen, setMobileComOpen] = useState(false);
  const location = useLocation();
  const { user, isAdmin, isStaffUser, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    toast.success("Sesión cerrada");
  };

  const isComActive = comunidadLinks.some((l) => l.path === location.pathname);

  const renderLink = (link: { name: string; path: string; external?: boolean }, onClick?: () => void) =>
    link.external ? (
      <a
        key={link.name}
        href={link.path}
        target="_blank"
        rel="noopener noreferrer"
        onClick={onClick}
        className="px-3 py-2 rounded-lg text-sm font-body font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
      >
        {link.name}
      </a>
    ) : (
      <Link
        key={link.name}
        to={link.path}
        onClick={onClick}
        className={`px-3 py-2 rounded-lg text-sm font-body font-semibold transition-colors ${
          location.pathname === link.path
            ? "text-primary bg-primary/10"
            : "text-muted-foreground hover:text-foreground hover:bg-muted"
        }`}
      >
        {link.name}
      </Link>
    );

  return (
    <nav className="sticky top-0 z-50 bg-[#1c1410]/95 backdrop-blur-md border-b-2 border-border">
      <div className="container mx-auto flex items-center justify-between py-3 px-4 gap-2">
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <img src={logo} alt="SolvianMC" className="h-10 w-10 rounded-full" />
          <span className="font-heading font-bold text-lg text-gradient-gold hidden sm:block">SolvianMC</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1 flex-1 justify-center">
          {!isStaffUser && mainLinks.map((l) => renderLink(l))}

          {/* Comunidad dropdown */}
          {!isStaffUser && (
            <div
              className="relative"
              onMouseEnter={() => setComOpen(true)}
              onMouseLeave={() => setComOpen(false)}
            >
              <button
                className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-body font-semibold transition-colors ${
                  isComActive
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                Comunidad
                <ChevronDown size={14} className={`transition-transform ${comOpen ? "rotate-180" : ""}`} />
              </button>
              <AnimatePresence>
                {comOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.18 }}
                    className="absolute left-0 top-full pt-2 min-w-[180px]"
                  >
                    <div className="bg-[#1c1410] border-2 border-border rounded-xl shadow-2xl py-2 overflow-hidden">
                      {comunidadLinks.map((cl) => (
                        <Link
                          key={cl.name}
                          to={cl.path}
                          className={`block px-4 py-2 text-sm font-body font-semibold transition-colors ${
                            location.pathname === cl.path
                              ? "text-primary bg-primary/10"
                              : "text-muted-foreground hover:text-[#d4a017] hover:bg-primary/10"
                          }`}
                        >
                          {cl.name}
                        </Link>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {!isStaffUser && renderLink({ name: "Tickets", path: "/tickets" })}
        </div>

        {/* Right side */}
        <div className="hidden md:flex items-center gap-2 shrink-0">
          {user && isAdmin && (
            <Link
              to="/admin"
              className="px-3 py-2 rounded-lg bg-accent text-accent-foreground font-heading font-bold text-sm flex items-center gap-1.5 hover:opacity-90 transition"
            >
              <Shield size={14} /> Admin
            </Link>
          )}
          {user && (
            <button
              onClick={handleSignOut}
              className="px-4 py-2 rounded-lg text-sm font-heading font-bold bg-destructive/15 text-destructive border border-destructive/30 hover:bg-destructive hover:text-destructive-foreground transition-all flex items-center gap-1.5"
            >
              <LogOut size={15} /> Cerrar Sesión
            </button>
          )}
        </div>

        {/* Mobile toggle */}
        <button onClick={() => setOpen(!open)} className="md:hidden text-foreground">
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-border bg-[#1c1410] px-4 pb-4">
          {!isStaffUser && mainLinks.map((l) => (
            <div key={l.name}>{renderLink(l, () => setOpen(false))}</div>
          ))}

          {!isStaffUser && (
            <div>
              <button
                onClick={() => setMobileComOpen(!mobileComOpen)}
                className="w-full flex items-center justify-between py-2 text-sm font-body font-semibold text-muted-foreground"
              >
                Comunidad
                <ChevronDown size={14} className={`transition-transform ${mobileComOpen ? "rotate-180" : ""}`} />
              </button>
              {mobileComOpen && (
                <div className="pl-4 border-l-2 border-primary/30 ml-2 my-1">
                  {comunidadLinks.map((cl) => (
                    <Link
                      key={cl.name}
                      to={cl.path}
                      onClick={() => setOpen(false)}
                      className={`block py-2 text-sm font-body font-semibold ${
                        location.pathname === cl.path ? "text-primary" : "text-muted-foreground"
                      }`}
                    >
                      {cl.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}

          {!isStaffUser && renderLink({ name: "Tickets", path: "/tickets" }, () => setOpen(false))}

          {user && isAdmin && (
            <Link
              to="/admin"
              onClick={() => setOpen(false)}
              className="mt-2 w-full px-4 py-2 rounded-lg bg-accent text-accent-foreground font-heading font-bold text-sm flex items-center justify-center gap-1.5"
            >
              <Shield size={14} /> Admin
            </Link>
          )}
          {user && (
            <button
              onClick={() => { handleSignOut(); setOpen(false); }}
              className="mt-2 w-full px-4 py-2 rounded-lg text-sm font-heading font-bold bg-destructive/15 text-destructive border border-destructive/30 flex items-center justify-center gap-1.5"
            >
              <LogOut size={15} /> Cerrar Sesión
            </button>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
