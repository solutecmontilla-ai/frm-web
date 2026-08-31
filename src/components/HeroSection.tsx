import { Trophy, Users, Target, Calendar } from "lucide-react";
import ligaLogo from "@/assets/liga-frm-logo.png";
import { useTorneoHero } from "@/hooks/useTorneoHero";

const HeroSection = () => {
  const hero = useTorneoHero("torneo40");
  const badge = hero?.heroSubtitle ?? hero?.edicionNombre ?? "Liga FRM";
  const equipos  = hero?.equiposCount ?? hero?.stats.equipos ?? 0;
  const jornadas = hero?.stats.jornadas ?? 0;
  const goles    = hero?.stats.goles ?? 0;
  const partidos = hero?.stats.partidos ?? 0;
  return (
    <section className="relative bg-gradient-hero py-16 md:py-28 overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Soccer ball pattern */}
        <div className="absolute top-10 left-[10%] w-20 h-20 border-2 border-primary/20 rounded-full animate-bounce" style={{ animationDuration: '3s' }} />
        <div className="absolute top-[30%] right-[15%] w-16 h-16 border-2 border-secondary/20 rounded-full animate-bounce" style={{ animationDuration: '4s', animationDelay: '1s' }} />
        <div className="absolute bottom-[20%] left-[20%] w-12 h-12 border-2 border-primary/20 rounded-full animate-bounce" style={{ animationDuration: '3.5s', animationDelay: '0.5s' }} />
        
        {/* Glowing orbs */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/30 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute bottom-10 right-20 w-96 h-96 bg-secondary/30 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[150px]" />
      </div>

      {/* Field lines overlay */}
      <div className="absolute inset-0 opacity-[0.03]">
        <div className="absolute top-1/2 left-0 right-0 h-[2px] bg-white" />
        <div className="absolute top-0 bottom-0 left-1/2 w-[2px] bg-white" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 border-2 border-white rounded-full" />
      </div>

      <div className="container relative z-10">
        <div className="text-center max-w-4xl mx-auto">
          {/* Logo animado */}
          <div className="mb-8 animate-fade-in">
            <img 
              src={ligaLogo} 
              alt="Liga FRM" 
              className="h-24 md:h-32 mx-auto drop-shadow-2xl hover:scale-105 transition-transform duration-300"
              style={{ filter: 'drop-shadow(0 0 30px hsl(var(--primary) / 0.4))' }}
            />
          </div>

          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-primary/20 border border-primary/40 rounded-full px-5 py-2 mb-6 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <Trophy className="w-5 h-5 text-primary animate-pulse" />
            <span className="font-display text-sm font-semibold tracking-widest text-primary uppercase">
              {badge}
            </span>
          </div>

          {/* Main Title */}
          <h1 className="font-display text-5xl md:text-8xl font-bold mb-3 animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <span className="text-gradient-gold drop-shadow-lg">Liga FRM</span>
          </h1>
          
          <p className="text-2xl md:text-4xl text-foreground/90 font-display tracking-wider mb-2 animate-fade-in" style={{ animationDelay: '0.4s' }}>
            Fútbol Amateur
          </p>
          <p className="text-lg md:text-xl text-muted-foreground font-medium animate-fade-in" style={{ animationDelay: '0.5s' }}>
            ⚽ Donde la pasión no tiene edad ⚽
          </p>

          {/* Stats Cards */}
          <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
            <div className="group bg-card/60 backdrop-blur-md border border-border/50 rounded-2xl p-5 hover:border-primary/50 hover:shadow-glow transition-all duration-300 animate-fade-in" style={{ animationDelay: '0.6s' }}>
              <Users className="w-8 h-8 text-primary mx-auto mb-2 group-hover:scale-110 transition-transform" />
              <p className="text-3xl font-display font-bold text-gradient-gold">{equipos}</p>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mt-1">Equipos</p>
            </div>
            <div className="group bg-card/60 backdrop-blur-md border border-border/50 rounded-2xl p-5 hover:border-primary/50 hover:shadow-glow transition-all duration-300 animate-fade-in" style={{ animationDelay: '0.7s' }}>
              <Calendar className="w-8 h-8 text-primary mx-auto mb-2 group-hover:scale-110 transition-transform" />
              <p className="text-3xl font-display font-bold text-gradient-gold">{jornadas}</p>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mt-1">Jornadas</p>
            </div>
            <div className="group bg-card/60 backdrop-blur-md border border-border/50 rounded-2xl p-5 hover:border-primary/50 hover:shadow-glow transition-all duration-300 animate-fade-in" style={{ animationDelay: '0.8s' }}>
              <Target className="w-8 h-8 text-primary mx-auto mb-2 group-hover:scale-110 transition-transform" />
              <p className="text-3xl font-display font-bold text-gradient-gold">{goles}</p>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mt-1">Goles</p>
            </div>
            <div className="group bg-card/60 backdrop-blur-md border border-border/50 rounded-2xl p-5 hover:border-primary/50 hover:shadow-glow transition-all duration-300 animate-fade-in" style={{ animationDelay: '0.9s' }}>
              <Trophy className="w-8 h-8 text-primary mx-auto mb-2 group-hover:scale-110 transition-transform" />
              <p className="text-3xl font-display font-bold text-gradient-gold">{partidos}</p>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mt-1">Partidos</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom wave decoration */}
      <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
};

export default HeroSection;
