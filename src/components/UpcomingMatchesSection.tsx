import { Calendar, Clock, MapPin, Trophy, Swords, AlertTriangle, Ban, Coffee } from "lucide-react";
import { cn } from "@/lib/utils";
import { getLogo40 } from "@/lib/teamLogos";
import { useTournamentData } from "@/hooks/useTournamentData";
import { useTorneoHero } from "@/hooks/useTorneoHero";
import { useDisciplinaResumen } from "@/hooks/useDisciplinaResumen";

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
  descansa?: string[];
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
      <div className="flex-1 flex flex-col items-center text-center">
        <div className="w-12 h-12 mb-1.5 flex items-center justify-center">
          <img src={getLogo40(match.homeTeam)} alt={match.homeTeam} className="max-w-full max-h-full object-contain" />
        </div>
        <span className="font-display text-xs md:text-sm font-bold text-foreground leading-tight">{match.homeTeam}</span>
      </div>
      <div className="flex flex-col items-center gap-1">
        <Swords className="w-4 h-4 text-primary" />
        <div className="flex items-center gap-1 text-primary">
          <Clock className="w-3 h-3" />
          <span className="text-xs font-semibold">{match.time}</span>
        </div>
      </div>
      <div className="flex-1 flex flex-col items-center text-center">
        <div className="w-12 h-12 mb-1.5 flex items-center justify-center">
          <img src={getLogo40(match.awayTeam)} alt={match.awayTeam} className="max-w-full max-h-full object-contain" />
        </div>
        <span className="font-display text-xs md:text-sm font-bold text-foreground leading-tight">{match.awayTeam}</span>
      </div>
    </div>
  </div>
);

const UpcomingMatchesSection = () => {
  const { data, loading } = useTournamentData<UpcomingData>("torneo40", "proximos");
  const hero = useTorneoHero("torneo40");
  const disciplina = useDisciplinaResumen("torneo40");

  const matchdays = data?.matchdays ?? [];
  const phase = data?.phase ?? "Próximos Partidos";
  const edicionLabel = hero?.edicionNombre ?? "";
  const descansa = data?.descansa ?? [];

  const suspendidos = Object.entries(disciplina).flatMap(([equipo, d]) =>
    d.suspendidos.map((j) => ({ jugador: j, equipo }))
  );
  const apercibidos = Object.entries(disciplina).flatMap(([equipo, d]) =>
    d.alertas.map((j) => ({ jugador: j, equipo }))
  );

  const hasDisciplina = suspendidos.length > 0 || apercibidos.length > 0;

  let globalDelay = 0;

  return (
    <section id="proxima-jornada" className="py-16 md:py-24 bg-muted/30">
      <div className="container">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/30 rounded-full px-4 py-1.5 mb-4">
            <Trophy className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">{phase}</span>
          </div>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground">
            Programación {phase}
          </h2>
          {edicionLabel && <p className="text-muted-foreground mt-2">{edicionLabel}</p>}
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
              <div key={`${day.day}-${day.venue}`}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex items-center gap-2 bg-primary/10 rounded-full px-3 py-1">
                    <Calendar className="w-3.5 h-3.5 text-primary" />
                    <span className="text-sm font-bold text-primary">{day.day}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <MapPin className="w-3.5 h-3.5" />
                    <span className="text-sm">{day.venue}</span>
                  </div>
                  <div className="flex-1 h-px bg-border/50" />
                </div>
                <div className="space-y-3">
                  {day.matches.map((match) => {
                    const d = globalDelay;
                    globalDelay += 100;
                    return <MatchRow key={`${match.homeTeam}-${match.awayTeam}`} match={match} delay={d} />;
                  })}
                </div>
              </div>
            ))}

            {/* Descansa */}
            {descansa.length > 0 && (
              <div className="flex items-center gap-2 px-4 py-3 bg-muted/50 border border-border/40 rounded-lg">
                <Coffee className="w-4 h-4 text-muted-foreground shrink-0" />
                <span className="text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground/70">Descansa:</span>{" "}
                  {descansa.join(", ")}
                </span>
              </div>
            )}

            {/* Disciplina */}
            {hasDisciplina && (
              <div className="border border-border/40 rounded-xl overflow-hidden">
                <div className="px-4 py-2 bg-muted/60 border-b border-border/40">
                  <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Disciplina — Jornada siguiente</span>
                </div>
                <div className="p-4 space-y-4">
                  {suspendidos.length > 0 && (
                    <div>
                      <div className="flex items-center gap-1.5 mb-2">
                        <Ban className="w-3.5 h-3.5 text-red-500" />
                        <span className="text-xs font-bold text-red-400 uppercase tracking-wider">Suspendidos</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {suspendidos.map(({ jugador, equipo }) => (
                          <div key={`${equipo}-${jugador}`} className="flex items-center gap-1.5 bg-red-500/10 border border-red-500/30 rounded-full px-3 py-1">
                            <span className="text-xs font-semibold text-red-300">{jugador}</span>
                            <span className="text-[10px] text-red-400/70">({equipo})</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {apercibidos.length > 0 && (
                    <div>
                      <div className="flex items-center gap-1.5 mb-2">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                        <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Apercibidos</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {apercibidos.map(({ jugador, equipo }) => (
                          <div key={`${equipo}-${jugador}`} className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/30 rounded-full px-3 py-1">
                            <span className="text-xs font-semibold text-amber-300">{jugador}</span>
                            <span className="text-[10px] text-amber-400/70">({equipo})</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
};

export default UpcomingMatchesSection;
