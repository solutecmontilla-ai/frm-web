import React from "react";
import { Trophy, Swords } from "lucide-react";
import { cn } from "@/lib/utils";
import { getLogo35 } from "@/lib/teamLogos";
import { useTournamentData } from "@/hooks/useTournamentData";

import ligaLogo from "@/assets/liga-frm-logo.png";

interface Scorer {
  name: string;
  goals: number;
}

interface BracketTeam {
  name: string;
  seed: number | null;
  score: number | null;
  penaltyScore?: number | null;
  scorers?: Scorer[];
}

interface BracketMatch {
  label: string;
  team1: BracketTeam;
  team2: BracketTeam;
  winner: 1 | 2 | null;
  penalties?: boolean;
}

interface PlayoffData {
  quarterFinals: BracketMatch[];
  semiFinals: BracketMatch[];
  final: {
    label: string;
    team1: BracketTeam | null;
    team2: BracketTeam | null;
    winner: 1 | 2 | null;
  };
}

const MatchupCard = ({ match }: { match: BracketMatch }) => {
  const hasScore = match.team1.score !== null;
  const hasPenalties = match.penalties && match.team1.penaltyScore != null;

  const renderScorers = (scorers?: Scorer[]) => {
    if (!scorers || scorers.length === 0) return null;
    return (
      <div className="text-[10px] text-muted-foreground mt-0.5 truncate">
        {scorers.map((s) => `${s.name}${s.goals > 1 ? ` (${s.goals})` : ""}`).join(", ")}
      </div>
    );
  };

  return (
    <div
      className={cn(
        "bg-gradient-card border border-border/50 rounded-lg p-3 w-full",
        "hover:border-primary/50 transition-all duration-300 hover:shadow-glow",
        "opacity-0 animate-fade-in"
      )}
    >
      <div className="text-[10px] font-bold text-primary uppercase tracking-widest mb-2 text-center font-display">
        {match.label}
      </div>

      <div className={cn("flex items-center gap-2 mb-1", match.winner === 2 && "opacity-50")}>
        {match.team1.seed != null && (
          <span className="w-5 h-5 rounded-full bg-primary/20 text-primary text-[10px] font-bold flex items-center justify-center flex-shrink-0">
            {match.team1.seed}
          </span>
        )}
        <div className="w-8 h-8 flex-shrink-0 flex items-center justify-center">
          <img src={getLogo35(match.team1.name)} alt={match.team1.name} className="max-w-full max-h-full object-contain" />
        </div>
        <div className="flex-1 min-w-0">
          <span className={cn("font-semibold text-sm truncate block", match.winner === 1 ? "text-win" : "text-foreground")}>{match.team1.name}</span>
          {renderScorers(match.team1.scorers)}
        </div>
        {hasScore && (
          <span className={cn("ml-auto font-display text-lg font-bold flex-shrink-0", match.winner === 1 ? "text-win" : "text-muted-foreground")}>
            {match.team1.score}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2 my-1.5">
        <div className="flex-1 h-px bg-border/50" />
        <Swords className="w-3.5 h-3.5 text-primary" />
        <div className="flex-1 h-px bg-border/50" />
      </div>

      <div className={cn("flex items-center gap-2 mt-1", match.winner === 1 && "opacity-50")}>
        {match.team2.seed != null && (
          <span className="w-5 h-5 rounded-full bg-muted text-muted-foreground text-[10px] font-bold flex items-center justify-center flex-shrink-0">
            {match.team2.seed}
          </span>
        )}
        <div className="w-8 h-8 flex-shrink-0 flex items-center justify-center">
          <img src={getLogo35(match.team2.name)} alt={match.team2.name} className="max-w-full max-h-full object-contain" />
        </div>
        <div className="flex-1 min-w-0">
          <span className={cn("font-semibold text-sm truncate block", match.winner === 2 ? "text-win" : "text-foreground")}>{match.team2.name}</span>
          {renderScorers(match.team2.scorers)}
        </div>
        {hasScore && (
          <span className={cn("ml-auto font-display text-lg font-bold flex-shrink-0", match.winner === 2 ? "text-win" : "text-muted-foreground")}>
            {match.team2.score}
          </span>
        )}
      </div>

      {hasPenalties && (
        <div className="mt-2 pt-2 border-t border-border/40 flex items-center justify-center gap-1.5">
          <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">Penales</span>
          <span className="text-[11px] font-display font-bold text-foreground">
            {match.team1.penaltyScore}–{match.team2.penaltyScore}
          </span>
        </div>
      )}
    </div>
  );
};

const PlayoffBracket35 = () => {
  const { data, loading } = useTournamentData<PlayoffData>("torneo35", "playoff");

  const quarterFinals = data?.quarterFinals ?? [];
  const semiFinals = data?.semiFinals ?? [];
  const hasQuarters = quarterFinals.length > 0;

  const leftQuarters = quarterFinals.slice(0, 2);
  const rightQuarters = quarterFinals.slice(2, 4);

  return (
    <section id="eliminatorias" className="py-16 md:py-24 bg-background">
      <div className="container">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/30 rounded-full px-4 py-1.5 mb-4">
            <Trophy className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">Fase Eliminatoria</span>
          </div>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground">{hasQuarters ? "Cuartos de Final" : "Semifinales"}</h2>
          <p className="text-muted-foreground mt-2">
            {hasQuarters ? "Los 8 clasificados se enfrentan en eliminación directa" : "Los 4 mejores equipos se enfrentan en eliminación directa"}
          </p>
        </div>

        {loading && (
          <div className="text-center py-12 text-muted-foreground">Cargando bracket...</div>
        )}

        {!loading && (hasQuarters || semiFinals.length > 0) && (
          <>
            {/* Desktop */}
            <div className="hidden md:block max-w-5xl mx-auto">
              <div className="grid grid-cols-[1fr_auto_1fr] gap-6 items-center">
                <div className="space-y-4">
                  <div className="grid grid-cols-[1fr_auto] gap-4 items-center">
                    <div className="space-y-4">
                      {leftQuarters.map((m) => (
                        <MatchupCard key={m.label} match={m} />
                      ))}
                    </div>
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-px h-8 bg-primary/30" />
                      {semiFinals[0] && <MatchupCard match={semiFinals[0]} />}
                      <div className="w-px h-8 bg-primary/30" />
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-center gap-4 px-4">
                  <div className="w-24 h-24 rounded-full bg-gradient-card border-2 border-primary/50 flex items-center justify-center shadow-glow p-2">
                    <img src={ligaLogo} alt="Liga FRM" className="max-w-full max-h-full object-contain" />
                  </div>
                  <div className="text-center">
                    <div className="text-xs font-bold text-primary uppercase tracking-widest font-display">Final</div>
                    <div className="text-xs text-muted-foreground italic mt-1">Por definir</div>
                  </div>
                  <Trophy className="w-8 h-8 text-primary animate-pulse-slow" />
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-[auto_1fr] gap-4 items-center">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-px h-8 bg-primary/30" />
                      {semiFinals[1] && <MatchupCard match={semiFinals[1]} />}
                      <div className="w-px h-8 bg-primary/30" />
                    </div>
                    <div className="space-y-4">
                      {rightQuarters.map((m) => (
                        <MatchupCard key={m.label} match={m} />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Mobile */}
            <div className="md:hidden max-w-sm mx-auto space-y-6">
              <div className="flex flex-col items-center gap-2 mb-4">
                <div className="w-20 h-20 rounded-full bg-gradient-card border-2 border-primary/50 flex items-center justify-center shadow-glow p-2">
                  <img src={ligaLogo} alt="Liga FRM" className="max-w-full max-h-full object-contain" />
                </div>
              </div>
              {hasQuarters && (
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-primary uppercase tracking-widest text-center font-display">Cuartos de Final</h3>
                  {quarterFinals.map((m) => (
                    <MatchupCard key={m.label} match={m} />
                  ))}
                </div>
              )}
              {semiFinals.length > 0 && (
                <div className="space-y-3 pt-2">
                  <h3 className="text-sm font-bold text-primary uppercase tracking-widest text-center font-display">Semifinales</h3>
                  {semiFinals.map((s) => (
                    <MatchupCard key={s.label} match={s} />
                  ))}
                </div>
              )}
              <div className="text-center pt-2">
                <h3 className="text-sm font-bold text-primary uppercase tracking-widest font-display">Final</h3>
                <div className="flex items-center justify-center gap-2 mt-2">
                  <Trophy className="w-5 h-5 text-primary animate-pulse-slow" />
                  <span className="text-xs text-muted-foreground italic">Por definir</span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  );
};

export default PlayoffBracket35;
