import logo from "@/assets/solvianmc.png";

const Footer = () => (
  <footer className="border-t-2 border-border bg-card py-8 mt-auto">
    <div className="container mx-auto px-4 flex flex-col items-center gap-4">
      <img src={logo} alt="SolvianMC" className="h-12 w-12 rounded-full" />
      <p className="font-heading font-bold text-gradient-gold">SolvianMC</p>
      <p className="text-sm text-muted-foreground font-body text-center">
        © {new Date().getFullYear()} SolvianMC. Todos los derechos reservados.
      </p>
    </div>
  </footer>
);

export default Footer;
