import { useNavigate } from "react-router-dom";
import Header35 from "@/components/torneo35/Header35";
import HeroSection35 from "@/components/torneo35/HeroSection35";
import TeamsSection35 from "@/components/torneo35/TeamsSection35";
import ResultsSection35 from "@/components/torneo35/ResultsSection35";
import StandingsSection35 from "@/components/torneo35/StandingsSection35";
import TopScorersSection35 from "@/components/torneo35/TopScorersSection35";
import UpcomingMatchesSection35 from "@/components/torneo35/UpcomingMatchesSection35";
import PlayoffBracket35 from "@/components/torneo35/PlayoffBracket35";
import SponsorsSection from "@/components/SponsorsSection";

const Torneo35 = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <Header35 />

      <main>
        <HeroSection35 />
        <TeamsSection35 />
        <UpcomingMatchesSection35 />
        <PlayoffBracket35 />
        <ResultsSection35 />
        <StandingsSection35 />
        <TopScorersSection35 />
        <SponsorsSection />
      </main>

      {/* Footer */}
      <footer className="relative border-t border-primary/20 bg-card/50 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-primary/5 to-transparent pointer-events-none" />
        <div className="container relative py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">© 2025 Liga FRM. Todos los derechos reservados.</p>
            <button
              onClick={() => navigate("/")}
              className="text-sm text-primary hover:underline"
            >
              ← Volver a selección de torneos
            </button>
            <p className="text-sm text-muted-foreground">
              Diseñado por <span className="text-primary font-semibold">Amays Group</span>
            </p>
          </div>
        </div>
        <div className="h-1 w-full bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-500" />
      </footer>
    </div>
  );
};

export default Torneo35;
