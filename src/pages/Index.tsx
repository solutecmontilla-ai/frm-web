import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Trophy, ChevronRight, History } from "lucide-react";
import { NotificationButton } from "@/components/NotificationButton";
import ligaLogo from "@/assets/liga-frm-logo.png";
import liga35Logo from "@/assets/liga-frm-35-logo.jpeg";
import amaysLogo from "@/assets/sponsors/amaysgroup.png";

interface Tournament {
  id: string;
  slug: "torneo40" | "torneo35";
  title: string;
  subtitle: string;
  description: string;
  logo: string;
  route: string;
  teams: number;
  accent: string;
}

const defaultTournaments: Tournament[] = [
  {
    id: "40",
    slug: "torneo40",
    title: "Liga +40",
    subtitle: "Novena Edición • 2025",
    description: "Categoría mayores de 40 años",
    logo: ligaLogo,
    route: "/torneo-40",
    teams: 11,
    accent: "from-primary to-yellow-600",
  },
  {
    id: "35",
    slug: "torneo35",
    title: "Liga +35",
    subtitle: "Segunda Edición • Nocturna • 2025",
    description: "Categoría mayores de 35 años",
    logo: liga35Logo,
    route: "/torneo-35",
    teams: 10,
    accent: "from-emerald-500 to-teal-600",
  },
];

const Index = () => {
  const navigate = useNavigate();
  const [tournaments, setTournaments] = useState<Tournament[]>(defaultTournaments);

  useEffect(() => {
    fetch("/api/torneos/hero")
      .then((r) => r.ok ? r.json() : null)
      .then((d) => {
        if (!d?.torneos) return;
        setTournaments((prev) => prev.map((t) => {
          const h = d.torneos[t.slug];
          if (!h) return t;
          return {
            ...t,
            subtitle:    h.heroSubtitle    ?? t.subtitle,
            description: h.heroDescription ?? t.description,
            teams:       h.equiposCount    ?? t.teams,
          };
        }));
      })
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top accent bar */}
      <div className="h-1 w-full bg-gradient-to-r from-primary via-secondary to-primary" />

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center relative overflow-hidden px-4 py-12">
        {/* Background effects */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-[120px]" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary/20 rounded-full blur-[150px]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px]" />
        </div>

        {/* Field lines */}
        <div className="absolute inset-0 opacity-[0.03]">
          <div className="absolute top-1/2 left-0 right-0 h-[2px] bg-white" />
          <div className="absolute top-0 bottom-0 left-1/2 w-[2px] bg-white" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 border-2 border-white rounded-full" />
        </div>

        <div className="relative z-10 w-full max-w-4xl mx-auto text-center">
          {/* Main Logo */}
          <div className="mb-6 animate-fade-in">
            <img
              src={ligaLogo}
              alt="Liga FRM"
              className="h-24 md:h-32 mx-auto drop-shadow-2xl"
              style={{ filter: 'drop-shadow(0 0 30px hsl(var(--primary) / 0.4))' }}
            />
          </div>

          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-primary/20 border border-primary/40 rounded-full px-5 py-2 mb-6 animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <Trophy className="w-5 h-5 text-primary" />
            <span className="font-display text-sm font-semibold tracking-widest text-primary uppercase">
              Fútbol Amateur
            </span>
          </div>

          <h1 className="font-display text-4xl md:text-7xl font-bold mb-3 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <span className="text-gradient-gold">Liga FRM</span>
          </h1>
          <p className="text-lg md:text-2xl text-muted-foreground mb-2 animate-fade-in" style={{ animationDelay: '0.3s' }}>
            ⚽ Donde la pasión no tiene edad ⚽
          </p>
          <p className="text-base text-muted-foreground/80 mb-12 animate-fade-in" style={{ animationDelay: '0.35s' }}>
            Selecciona el torneo que deseas ver
          </p>

          {/* Tournament Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 max-w-3xl mx-auto">
            {tournaments.map((t, i) => (
              <button
                key={t.id}
                onClick={() => navigate(t.route)}
                className="group relative bg-card/60 backdrop-blur-md border border-border/50 rounded-2xl p-8 text-left transition-all duration-300 hover:border-primary/50 hover:shadow-glow hover:-translate-y-2 animate-fade-in"
                style={{ animationDelay: `${0.4 + i * 0.15}s` }}
              >
                {/* Glow on hover */}
                <div className="absolute inset-0 rounded-2xl bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                <div className="relative flex flex-col items-center gap-5">
                  {/* Tournament logo */}
                  <div className="w-28 h-28 md:w-32 md:h-32 flex items-center justify-center">
                    <img
                      src={t.logo}
                      alt={t.title}
                      className="max-w-full max-h-full object-contain drop-shadow-lg group-hover:scale-110 transition-transform duration-300"
                    />
                  </div>

                  {/* Info */}
                  <div className="text-center">
                    <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground group-hover:text-primary transition-colors">
                      {t.title}
                    </h2>
                    <p className="text-sm text-primary mt-1 font-medium tracking-wider">
                      {t.subtitle}
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      {t.description}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {t.teams} equipos
                    </p>
                  </div>

                  {/* CTA */}
                  <div className="flex items-center gap-2 px-5 py-2.5 bg-primary/20 border border-primary/40 rounded-full text-primary font-medium text-sm group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                    Ver torneo
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Historial + Notificaciones */}
          <div className="mt-8 animate-fade-in flex items-center justify-center gap-3" style={{ animationDelay: '0.65s' }}>
            <button
              onClick={() => navigate("/historial")}
              className="group inline-flex items-center gap-2 px-6 py-2.5 border border-border/50 rounded-full text-sm text-muted-foreground hover:text-primary hover:border-primary/40 transition-all duration-200"
            >
              <History className="w-4 h-4" />
              Ver ediciones anteriores
              <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </button>
            <NotificationButton />
          </div>

          {/* Sponsors */}
          <div className="mt-12 animate-fade-in" style={{ animationDelay: '0.7s' }}>
            <span className="inline-block px-4 py-1.5 bg-primary/20 text-primary rounded-full text-xs font-medium mb-6 tracking-wider uppercase">
              Patrocinantes Oficiales
            </span>
            <div className="flex items-center justify-center gap-8 md:gap-12">
              <a href="https://amaysgroup.com" target="_blank" rel="noopener noreferrer" className="group">
                <div className="bg-card/60 backdrop-blur-md border border-border/50 rounded-xl p-5 transition-all duration-300 group-hover:border-primary/50 group-hover:shadow-glow">
                  <img
                    src={amaysLogo}
                    alt="Amays Group"
                    className="h-12 md:h-16 object-contain opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all"
                  />
                </div>
              </a>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative border-t border-border/30 py-6">
        <div className="container flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">© 2025 Liga FRM. Todos los derechos reservados.</p>
          <p className="text-sm text-muted-foreground">
            Diseñado por <span className="text-primary font-semibold">Amays Group</span>
          </p>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-secondary to-primary" />
      </footer>
    </div>
  );
};

export default Index;
