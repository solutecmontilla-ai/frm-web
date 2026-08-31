import ligaLogo from "@/assets/liga-frm-logo.png";
import { Menu, ArrowLeft } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { useTorneoHero } from "@/hooks/useTorneoHero";

const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const hero = useTorneoHero("torneo40");
  const subtitle = hero?.heroSubtitle ?? (hero?.edicionNombre ? `${hero.edicionNombre}` : "Liga FRM");

  return (
    <header className="sticky top-0 z-50 w-full border-b border-primary/20 bg-background/90 backdrop-blur-xl">
      {/* Animated top accent bar */}
      <div className="h-1 w-full bg-gradient-to-r from-primary via-secondary to-primary animate-pulse-slow" />
      
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-1 text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium hidden sm:inline">Torneos</span>
          </button>
          <div className="w-px h-8 bg-border/50 mx-1" />
          <img
            src={ligaLogo}
            alt="Liga FRM"
            className="h-12 w-auto object-contain"
          />
          <div className="hidden sm:block">
            <h1 className="font-display text-xl font-bold text-gradient-gold">
              Liga FRM
            </h1>
            <p className="text-xs text-muted-foreground">Fútbol Amateur • {subtitle}</p>
          </div>
        </div>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8">
          <a
            href="#equipos"
            className="relative text-sm font-display uppercase tracking-wider text-muted-foreground hover:text-primary transition-colors group"
          >
            Equipos
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full" />
          </a>
          <a
            href="#resultados"
            className="relative text-sm font-display uppercase tracking-wider text-muted-foreground hover:text-primary transition-colors group"
          >
            Resultados
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full" />
          </a>
          <a
            href="#goleadores"
            className="relative text-sm font-display uppercase tracking-wider text-muted-foreground hover:text-primary transition-colors group"
          >
            Goleadores
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full" />
          </a>
          <Link
            to="/disciplina/torneo40"
            className="relative text-sm font-display uppercase tracking-wider text-amber-400 hover:text-amber-300 transition-colors group"
          >
            Disciplina
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-amber-400 transition-all group-hover:w-full" />
          </Link>
        </nav>

        {/* Mobile Menu Button */}
        <button 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 text-foreground hover:text-primary transition-colors"
        >
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {/* Mobile Nav */}
      {mobileMenuOpen && (
        <nav className="md:hidden border-t border-border/40 bg-card/95 backdrop-blur-xl">
          <div className="container py-4 flex flex-col gap-4">
            <a href="#equipos" className="font-display uppercase tracking-wider text-muted-foreground hover:text-primary transition-colors">
              Equipos
            </a>
            <a href="#resultados" className="font-display uppercase tracking-wider text-muted-foreground hover:text-primary transition-colors">
              Resultados
            </a>
            <a href="#goleadores" className="font-display uppercase tracking-wider text-muted-foreground hover:text-primary transition-colors">
              Goleadores
            </a>
            <Link to="/disciplina/torneo40" className="font-display uppercase tracking-wider text-amber-400 hover:text-amber-300 transition-colors">
              Disciplina
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
};

export default Header;
