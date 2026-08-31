import React from "react";
import { Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import { getLogo40 } from "@/lib/teamLogos";
import { useTournamentData } from "@/hooks/useTournamentData";
import { useDisciplinaResumen } from "@/hooks/useDisciplinaResumen";

interface TeamStanding {
  position: number;
  name: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
}

interface StandingsData {
  lastJornada: number;
  qualified: number;
  teams: TeamStanding[];
}

const DisciplinaBadges = ({ teamName, disciplina }: { teamName: string; disciplina: Record<string, { suspendidos: string[]; alertas: string[] }> }) => {
  const d = disciplina[teamName];
  if (!d) return null;
  return (
    <div className="flex items-center gap-1 flex-shrink-0">
      {d.suspendidos.length > 0 && (
        <span
          className="text-[9px] font-bold bg-destructive/20 text-destructive border border-destructive/30 rounded px-1.5 py-0.5 uppercase tracking-wide cursor-default"
          title={`Suspendido(s): ${d.suspendidos.join(", ")}`}
        >
          🚫 {d.suspendidos.length} susp.
        </span>
      )}
      {d.alertas.length > 0 && (
        <span
          className="text-[9px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30 rounded px-1.5 py-0.5 uppercase tracking-wide cursor-default"
          title={`Próx. suspensión: ${d.alertas.join(", ")}`}
        >
          ⚠ {d.alertas.length} alerta
        </span>
      )}
    </div>
  );
};

const StandingsSection = () => {
  const { data, loading } = useTournamentData<StandingsData>("torneo40", "tabla");
  const disciplina = useDisciplinaResumen("torneo40");

  const teams = data?.teams ?? [];
  const hasQualified = data?.qualified != null;
  const CLASIFICADOS = data?.qualified ?? teams.length;
  const lastJornada = data?.lastJornada ?? 9;

  return (
    <section id="tabla" className="py-16 md:py-24 bg-background">
      <div className="container">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/30 rounded-full px-4 py-1.5 mb-4">
            <Trophy className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">Clasificación</span>
          </div>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground">
            Tabla de Posiciones
          </h2>
          <p className="text-muted-foreground mt-2">
            Clasificación general después de la Jornada {lastJornada}
          </p>
        </div>

        {loading && (
          <div className="text-center py-12 text-muted-foreground">Cargando tabla...</div>
        )}

        {!loading && teams.length > 0 && (
          <>
            {/* Desktop */}
            <div className="max-w-4xl mx-auto hidden md:block">
              <div className="bg-gradient-card rounded-lg border border-border/50 overflow-hidden">
                <div className="bg-muted/50 border-b border-border/30">
                  <div className="grid grid-cols-[40px_minmax(160px,1.5fr)_repeat(8,minmax(40px,1fr))] items-center gap-2 px-4 py-3">
                    <span className="text-xs font-bold text-muted-foreground text-center">#</span>
                    <span className="text-xs font-bold text-muted-foreground">Equipo</span>
                    <span className="text-xs font-bold text-muted-foreground text-center">PJ</span>
                    <span className="text-xs font-bold text-muted-foreground text-center">G</span>
                    <span className="text-xs font-bold text-muted-foreground text-center">E</span>
                    <span className="text-xs font-bold text-muted-foreground text-center">P</span>
                    <span className="text-xs font-bold text-muted-foreground text-center">GF</span>
                    <span className="text-xs font-bold text-muted-foreground text-center">GC</span>
                    <span className="text-xs font-bold text-muted-foreground text-center">DG</span>
                    <span className="text-xs font-bold text-primary text-center">PTS</span>
                  </div>
                </div>
                <div className="divide-y divide-border/30">
                  {teams.map((team, index) => (
                    <React.Fragment key={team.name}>
                      {index === CLASIFICADOS && (
                        <div className="border-t-2 border-destructive/50 px-4 py-1.5 bg-destructive/5">
                          <span className="text-xs font-semibold text-destructive uppercase tracking-wider">Eliminados</span>
                        </div>
                      )}
                      <div
                        className={cn(
                          "grid grid-cols-[40px_minmax(160px,1.5fr)_repeat(8,minmax(40px,1fr))] items-center gap-2 px-4 py-3",
                          "hover:bg-muted/30 transition-colors duration-200",
                          "opacity-0 animate-fade-in",
                          index < 3 && "bg-primary/5",
                          index < CLASIFICADOS && index >= 3 && "bg-win/5"
                        )}
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <span
                          className={cn(
                            "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
                            index === 0 && "bg-yellow-500/20 text-yellow-500",
                            index === 1 && "bg-gray-400/20 text-gray-400",
                            index === 2 && "bg-amber-600/20 text-amber-600",
                            index > 2 && index < CLASIFICADOS && "text-win",
                            index >= CLASIFICADOS && "text-muted-foreground"
                          )}
                        >
                          {team.position}
                        </span>
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 flex-shrink-0 flex items-center justify-center">
                            <img src={getLogo40(team.name)} alt={team.name} className="max-w-full max-h-full object-contain" />
                          </div>
                          <span className={cn("font-semibold text-base truncate", index < CLASIFICADOS ? "text-foreground" : "text-muted-foreground")}>{team.name}</span>
                          {hasQualified && index < CLASIFICADOS && (
                            <span className="text-[10px] font-bold bg-win/20 text-win rounded px-1.5 py-0.5 uppercase tracking-wider flex-shrink-0">Clasificado</span>
                          )}
                          <DisciplinaBadges teamName={team.name} disciplina={disciplina} />
                        </div>
                        <span className="text-sm text-muted-foreground text-center">{team.played}</span>
                        <span className="text-sm text-muted-foreground text-center">{team.won}</span>
                        <span className="text-sm text-muted-foreground text-center">{team.drawn}</span>
                        <span className="text-sm text-muted-foreground text-center">{team.lost}</span>
                        <span className="text-sm text-muted-foreground text-center">{team.goalsFor}</span>
                        <span className="text-sm text-muted-foreground text-center">{team.goalsAgainst}</span>
                        <span className={cn("text-sm text-center font-medium", team.goalDifference > 0 && "text-win", team.goalDifference < 0 && "text-destructive", team.goalDifference === 0 && "text-muted-foreground")}>
                          {team.goalDifference > 0 ? `+${team.goalDifference}` : team.goalDifference}
                        </span>
                        <span className="text-sm font-bold text-primary text-center">{team.points}</span>
                      </div>
                    </React.Fragment>
                  ))}
                </div>
              </div>
            </div>

            {/* Mobile */}
            <div className="md:hidden space-y-2 max-w-lg mx-auto">
              {teams.map((team, index) => (
                <React.Fragment key={team.name}>
                  {index === CLASIFICADOS && (
                    <div className="border-t-2 border-destructive/50 rounded px-3 py-1.5 bg-destructive/5 text-center">
                      <span className="text-xs font-semibold text-destructive uppercase tracking-wider">Eliminados</span>
                    </div>
                  )}
                  <div
                    className={cn(
                      "bg-gradient-card rounded-lg border p-3",
                      "opacity-0 animate-fade-in",
                      index < CLASIFICADOS ? "border-win/30" : "border-border/50 opacity-70",
                      index < 3 && "border-primary/30"
                    )}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2.5">
                        <span
                          className={cn(
                            "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0",
                            index === 0 && "bg-yellow-500/20 text-yellow-500",
                            index === 1 && "bg-gray-400/20 text-gray-400",
                            index === 2 && "bg-amber-600/20 text-amber-600",
                            index > 2 && index < CLASIFICADOS && "text-win",
                            index >= CLASIFICADOS && "text-muted-foreground"
                          )}
                        >
                          {team.position}
                        </span>
                        <div className="w-7 h-7 flex-shrink-0 flex items-center justify-center">
                          <img src={getLogo40(team.name)} alt={team.name} className="max-w-full max-h-full object-contain" />
                        </div>
                        <span className={cn("font-semibold text-sm", index < CLASIFICADOS ? "text-foreground" : "text-muted-foreground")}>{team.name}</span>
                        {hasQualified && index < CLASIFICADOS && (
                          <span className="text-[9px] font-bold bg-win/20 text-win rounded px-1 py-0.5 uppercase flex-shrink-0">✓</span>
                        )}
                        <DisciplinaBadges teamName={team.name} disciplina={disciplina} />
                      </div>
                      <span className="text-lg font-bold text-primary">{team.points} pts</span>
                    </div>
                    <div className="grid grid-cols-4 gap-2 text-center text-xs">
                      <div className="bg-muted/30 rounded px-1 py-1">
                        <span className="text-muted-foreground block">PJ</span>
                        <span className="font-semibold text-foreground">{team.played}</span>
                      </div>
                      <div className="bg-muted/30 rounded px-1 py-1">
                        <span className="text-muted-foreground block">G/E/P</span>
                        <span className="font-semibold text-foreground">{team.won}/{team.drawn}/{team.lost}</span>
                      </div>
                      <div className="bg-muted/30 rounded px-1 py-1">
                        <span className="text-muted-foreground block">GF/GC</span>
                        <span className="font-semibold text-foreground">{team.goalsFor}/{team.goalsAgainst}</span>
                      </div>
                      <div className="bg-muted/30 rounded px-1 py-1">
                        <span className="text-muted-foreground block">DG</span>
                        <span className={cn("font-semibold", team.goalDifference > 0 && "text-win", team.goalDifference < 0 && "text-destructive", team.goalDifference === 0 && "text-muted-foreground")}>
                          {team.goalDifference > 0 ? `+${team.goalDifference}` : team.goalDifference}
                        </span>
                      </div>
                    </div>
                  </div>
                </React.Fragment>
              ))}
            </div>

            {/* Legend */}
            <div className="hidden md:flex flex-wrap items-center justify-center gap-4 mt-4 text-xs text-muted-foreground max-w-4xl mx-auto">
              <span><strong>PJ:</strong> Partidos Jugados</span>
              <span><strong>G:</strong> Ganados</span>
              <span><strong>E:</strong> Empatados</span>
              <span><strong>P:</strong> Perdidos</span>
              <span><strong>GF:</strong> Goles a Favor</span>
              <span><strong>GC:</strong> Goles en Contra</span>
              <span><strong>DG:</strong> Diferencia de Goles</span>
              <span><strong>PTS:</strong> Puntos</span>
            </div>
          </>
        )}
      </div>
    </section>
  );
};

export default StandingsSection;
