import { Calendar, Clock, MapPin, Swords } from "lucide-react";
import { cn } from "@/lib/utils";
import { getLogo35 } from "@/lib/teamLogos";
import { useTournamentData } from "@/hooks/useTournamentData";

interface MatchInfo {
  homeTeam: string;
  awayTeam: string;
  time: string;
}

interface MatchDay {
  day: string;
  venue: string;
  matches: MatchInfo[];
}

interface UpcomingData {
  phase: string;
  matchdays: MatchDay[];
}

const MatchRow = ({ match, delay }: { match: MatchInfo; delay: number }) => (
  <div
    className={cn(
      "bg-gradient-card border border-border/50 rounded-lg p-4",
      "hover:border-primary/50 hover:shadow-glow transition-all duration-300",
      "opacity-0 animate-fade-in"
    )}
    style={{ animationDelay: `${delay}ms` }}
  >
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2.5 flex-1 min-w-0">
        <div className="w-9 h-9 flex-shrink-0 flex items-center justify-center">
          <img src={getLogo35(match.homeTeam)} alt={match.homeTeam} className="max-w-full max-h-full object-contain" />
        </div>
        <span className="font-semibold text-sm text-foreground truncate">{match.homeTeam}</span>
      </div>
      <div className="flex flex-col items-center gap-1 px-3">
        <Swords className="w-4 h-4 text-primary" />
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="w-3 h-3" />
          <span>{match.time}</span>
        </div>
      </div>
      <div className="flex items-center gap-2.5 flex-1 min-w-0 justify-end">
        <span className="font-semibold text-sm text-foreground truncate text-right">{match.awayTeam}</span>
        <div className="w-9 h-9 flex-shrink-0 flex items-center justify-center">
          <img src={getLogo35(match.awayTeam)} alt={match.awayTeam} className="max-w-full max-h-full object-contain" />
        </div>
      </div>
    </div>
  </div>
);

const UpcomingMatchesSection35 = () => {
  const { data, loading } = useTournamentData<UpcomingData>("torneo35", "proximos");
  const matchdays = data?.matchdays ?? [];
  const phase = data?.phase ?? "Próximos Partidos";

  let matchIndex = 0;

  return (
    <section id="proximos" className="py-16 md:py-24 bg-gradient-to-b from-background to-card">
      <div className="container">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/30 rounded-full px-4 py-1.5 mb-4">
            <Calendar className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">Próximos Partidos</span>
          </div>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground">
            <span className="text-gradient-gold">{phase}</span>
          </h2>
          <p className="text-muted-foreground mt-2">Programación de la próxima fecha</p>
        </div>

        {loading && (
          <div className="text-center py-12 text-muted-foreground">Cargando programación...</div>
        )}

        {!loading && matchdays.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">No hay partidos programados actualmente.</div>
        )}

        {!loading && matchdays.length > 0 && (
          <div className="max-w-2xl mx-auto space-y-8">
            {matchdays.map((day) => (
              <div key={day.day}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex items-center gap-2 bg-primary/10 rounded-full px-4 py-1.5">
                    <Calendar className="w-4 h-4 text-primary" />
                    <span className="text-sm font-semibold text-primary">{day.day}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{day.venue}</span>
                  </div>
                </div>
                <div className="space-y-3">
                  {day.matches.map((match) => {
                    const currentIndex = matchIndex++;
                    return (
                      <MatchRow
                        key={`${match.homeTeam}-${match.awayTeam}`}
                        match={match}
                        delay={currentIndex * 100}
                      />
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default UpcomingMatchesSection35;
