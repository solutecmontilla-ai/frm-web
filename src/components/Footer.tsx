import ligaLogo from "@/assets/liga-frm-logo.png";
import { Instagram, Phone, Mail } from "lucide-react";
import { useTorneoHero } from "@/hooks/useTorneoHero";

const Footer = () => {
  const hero = useTorneoHero("torneo40");
  const subtitle = hero?.heroSubtitle ?? hero?.edicionNombre ?? "";
  return (
    <footer className="relative border-t border-primary/20 bg-card/50 overflow-hidden">
      {/* Background accent */}
      <div className="absolute inset-0 bg-gradient-to-t from-primary/5 to-transparent pointer-events-none" />
      
      <div className="container relative py-12">
        <div className="grid md:grid-cols-3 gap-8 items-center">
          {/* Logo & Info */}
          <div className="flex flex-col items-center md:items-start gap-4">
            <img
              src={ligaLogo}
              alt="Liga FRM"
              className="h-16 w-auto object-contain hover:scale-105 transition-transform"
              style={{ filter: 'drop-shadow(0 0 20px hsl(var(--primary) / 0.3))' }}
            />
            <div className="text-center md:text-left">
              <h4 className="font-display text-xl font-bold text-gradient-gold">
                Liga FRM
              </h4>
              <p className="text-sm text-muted-foreground mt-1">
                Fútbol Amateur{subtitle ? ` • ${subtitle}` : ""}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                ⚽ Donde la pasión no tiene edad
              </p>
            </div>
          </div>

          {/* Quick Links */}
          <div className="flex flex-col items-center gap-3">
            <h5 className="font-display text-sm uppercase tracking-widest text-primary mb-2">Enlaces</h5>
            <nav className="flex flex-wrap justify-center gap-4 text-sm text-muted-foreground">
              <a href="#equipos" className="hover:text-primary transition-colors">
                Equipos
              </a>
              <a href="#resultados" className="hover:text-primary transition-colors">
                Resultados
              </a>
              <a href="#goleadores" className="hover:text-primary transition-colors">
                Goleadores
              </a>
            </nav>
            <div className="flex gap-4 mt-3">
              <a href="#" className="p-2 rounded-full bg-muted/50 text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-all">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="p-2 rounded-full bg-muted/50 text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-all">
                <Phone className="w-5 h-5" />
              </a>
              <a href="#" className="p-2 rounded-full bg-muted/50 text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-all">
                <Mail className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Contact */}
          <div className="flex flex-col items-center md:items-end text-center md:text-right">
            <h5 className="font-display text-sm uppercase tracking-widest text-primary mb-3">Contacto</h5>
            <p className="text-sm text-muted-foreground">Inscripciones abiertas</p>
            <p className="text-sm text-muted-foreground">para la X Edición</p>
            <a 
              href="https://wa.me/584243171902?text=Quiero%20participar%20en%20la%20X%20edici%C3%B3n" 
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-primary/20 border border-primary/40 rounded-full text-sm font-medium text-primary hover:bg-primary hover:text-primary-foreground transition-all"
            >
              <Phone className="w-4 h-4" />
              Inscribirse
            </a>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-10 pt-6 border-t border-border/30">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              © 2025 Liga FRM. Todos los derechos reservados.
            </p>
            <p className="text-sm text-muted-foreground">
              Diseñado por <span className="text-primary font-semibold">Amays Group</span>
            </p>
          </div>
        </div>
      </div>

      {/* Decorative bottom line */}
      <div className="h-1 w-full bg-gradient-to-r from-primary via-secondary to-primary" />
    </footer>
  );
};

export default Footer;
