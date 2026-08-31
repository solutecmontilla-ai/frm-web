import { Trophy, Users } from "lucide-react";
import ligaLogo from "@/assets/liga-frm-logo.png";
import { useTorneoHero } from "@/hooks/useTorneoHero";

const HeroSection35 = () => {
  const hero = useTorneoHero("torneo35");
  const badge = hero?.heroSubtitle ?? hero?.edicionNombre ?? "Liga +35";
  const equipos = hero?.equiposCount ?? hero?.stats.equipos ?? 0;
  const numero = hero?.numero ?? null;

  return (
    <section className="relative bg-gradient-hero py-16 md:py-24 overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-72 bg-emerald-500/20 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute bottom-10 right-20 w-96 h-96 bg-teal-500/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="container relative z-10 text-center max-w-4xl mx-auto">
        <div className="mb-8 animate-fade-in">
          <img
            src={ligaLogo}
            alt="Liga +35"
            className="h-24 md:h-32 mx-auto drop-shadow-2xl"
            style={{ filter: 'drop-shadow(0 0 30px hsl(var(--primary) / 0.4))' }}
          />
        </div>

        <div className="inline-flex items-center gap-2 bg-primary/20 border border-primary/40 rounded-full px-5 py-2 mb-6 animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <Trophy className="w-5 h-5 text-primary animate-pulse" />
          <span className="font-display text-sm font-semibold tracking-widest text-primary uppercase">
            {badge}
          </span>
        </div>

        <h1 className="font-display text-5xl md:text-8xl font-bold mb-3 animate-fade-in" style={{ animationDelay: '0.3s' }}>
          <span className="text-gradient-gold">Liga +35</span>
        </h1>
        <p className="text-2xl md:text-4xl text-foreground/90 font-display tracking-wider mb-2 animate-fade-in" style={{ animationDelay: '0.4s' }}>
          Fútbol Amateur
        </p>
        <p className="text-lg text-muted-foreground animate-fade-in" style={{ animationDelay: '0.5s' }}>
          ⚽ Donde la pasión no tiene edad ⚽
        </p>

        <div className="mt-12 grid grid-cols-2 gap-4 max-w-md mx-auto">
          <div className="group bg-card/60 backdrop-blur-md border border-border/50 rounded-2xl p-5 hover:border-primary/50 hover:shadow-glow transition-all duration-300 animate-fade-in" style={{ animationDelay: '0.6s' }}>
            <Users className="w-8 h-8 text-primary mx-auto mb-2 group-hover:scale-110 transition-transform" />
            <p className="text-3xl font-display font-bold text-gradient-gold">{equipos}</p>
            <p className="text-xs text-muted-foreground uppercase tracking-wider mt-1">Equipos</p>
          </div>
          <div className="group bg-card/60 backdrop-blur-md border border-border/50 rounded-2xl p-5 hover:border-primary/50 hover:shadow-glow transition-all duration-300 animate-fade-in" style={{ animationDelay: '0.7s' }}>
            <Trophy className="w-8 h-8 text-primary mx-auto mb-2 group-hover:scale-110 transition-transform" />
            <p className="text-3xl font-display font-bold text-gradient-gold">{numero ?? "—"}</p>
            <p className="text-xs text-muted-foreground uppercase tracking-wider mt-1">Edición</p>
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
};

export default HeroSection35;
