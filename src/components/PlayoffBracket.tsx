import React from "react";
import { Trophy, Swords } from "lucide-react";
import { cn } from "@/lib/utils";
import { getLogo40 } from "@/lib/teamLogos";
import { useTournamentData } from "@/hooks/useTournamentData";
import { useTorneoHero } from "@/hooks/useTorneoHero";

import ligaLogo from "@/assets/liga-frm-logo.png";

interface Scorer {
  name: string;
  goals: number;
}

interface BracketTeam {
  name: string;
  seed: number;
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

interface FinalMatch {
  label: string;
  team1: BracketTeam | null;
  team2: BracketTeam | null;
  winner: 1 | 2 | null;
  penalties?: boolean;
}

interface PlayoffData {
  quarterFinals: BracketMatch[];
  semiFinals: BracketMatch[];
  thirdPlace?: BracketMatch;
  final: FinalMatch;
  champion?: string;
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
        <span className="w-5 h-5 rounded-full bg-primary/20 text-primary text-[10px] font-bold flex items-center justify-center flex-shrink-0">
          {match.team1.seed}
        </span>
        <div className="w-8 h-8 flex-shrink-0 flex items-center justify-center">
          <img src={getLogo40(match.team1.name)} alt={match.team1.name} className="max-w-full max-h-full object-contain" />
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
        <span className="w-5 h-5 rounded-full bg-muted text-muted-foreground text-[10px] font-bold flex items-center justify-center flex-shrink-0">
          {match.team2.seed}
        </span>
        <div className="w-8 h-8 flex-shrink-0 flex items-center justify-center">
          <img src={getLogo40(match.team2.name)} alt={match.team2.name} className="max-w-full max-h-full object-contain" />
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

const PlayoffBracket = () => {
  const { data, loading } = useTournamentData<PlayoffData>("torneo40", "playoff");
  const hero = useTorneoHero("torneo40");
  const edicionLabel = hero?.edicionNombre ?? "";

  const quarterFinals = data?.quarterFinals ?? [];
  const semiFinals = data?.semiFinals ?? [];
  const thirdPlace = data?.thirdPlace ?? null;
  const final = data?.final ?? null;
  const finalReady = !!(final && final.team1 && final.team2);
  const champion = data?.champion ?? null;

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
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground">Fase Final</h2>
          {edicionLabel && <p className="text-muted-foreground mt-2">{edicionLabel} — Liga FRM +40</p>}
        </div>

        {loading && (
          <div className="text-center py-12 text-muted-foreground">Cargando bracket...</div>
        )}

        {!loading && quarterFinals.length > 0 && (
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

                <div className="flex flex-col items-center gap-4 px-4 min-w-[200px]">
                  <div className="w-20 h-20 rounded-full bg-gradient-card border-2 border-primary/50 flex items-center justify-center shadow-glow p-2">
                    <img src={ligaLogo} alt="Liga FRM" className="max-w-full max-h-full object-contain" />
                  </div>
                  {finalReady && final && <MatchupCard match={final as BracketMatch} />}
                  {!finalReady && !champion && (
                    <div className="text-center">
                      <div className="text-xs font-bold text-primary uppercase tracking-widest font-display">Gran Final</div>
                      <div className="text-xs text-muted-foreground italic mt-1">Por definir</div>
                    </div>
                  )}
                  {champion && (
                    <div className="flex flex-col items-center gap-2 bg-amber-500/10 border border-amber-500/40 rounded-xl px-4 py-3 w-full text-center">
                      <Trophy className="w-6 h-6 text-amber-400" />
                      <div className="text-[10px] font-bold text-amber-400 uppercase tracking-widest font-display">Campeón</div>
                      <div className="w-10 h-10 flex items-center justify-center">
                        <img src={getLogo40(champion)} alt={champion} className="max-w-full max-h-full object-contain" />
                      </div>
                      <div className="font-display font-bold text-sm text-amber-300">{champion}</div>
                    </div>
                  )}
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
              {thirdPlace && (
                <div className="mt-8 flex flex-col items-center gap-2">
                  <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest font-display mb-1">Tercer Lugar</h3>
                  <div className="w-72">
                    <MatchupCard match={thirdPlace} />
                  </div>
                </div>
              )}
            </div>

            {/* Mobile */}
            <div className="md:hidden max-w-sm mx-auto space-y-6">
              <div className="flex flex-col items-center gap-2 mb-4">
                <div className="w-20 h-20 rounded-full bg-gradient-card border-2 border-primary/50 flex items-center justify-center shadow-glow p-2">
                  <img src={ligaLogo} alt="Liga FRM" className="max-w-full max-h-full object-contain" />
                </div>
              </div>
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-primary uppercase tracking-widest text-center font-display">Cuartos de Final</h3>
                {quarterFinals.map((m) => (
                  <MatchupCard key={m.label} match={m} />
                ))}
              </div>
              {semiFinals.length > 0 && (
                <div className="space-y-3 pt-2">
                  <h3 className="text-sm font-bold text-primary uppercase tracking-widest text-center font-display">Semifinales</h3>
                  {semiFinals.map((s) => (
                    <MatchupCard key={s.label} match={s} />
                  ))}
                </div>
              )}
              {thirdPlace && (
                <div className="space-y-3 pt-2">
                  <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest text-center font-display">Tercer Lugar</h3>
                  <MatchupCard match={thirdPlace} />
                </div>
              )}
              {finalReady && final && (
                <div className="space-y-3 pt-2">
                  <h3 className="text-sm font-bold text-primary uppercase tracking-widest text-center font-display">Gran Final</h3>
                  <MatchupCard match={final as BracketMatch} />
                </div>
              )}
              {!finalReady && !champion && (
                <div className="text-center pt-2">
                  <h3 className="text-sm font-bold text-primary uppercase tracking-widest font-display">Gran Final</h3>
                  <span className="text-xs text-muted-foreground italic">Por definir</span>
                </div>
              )}
              {champion && (
                <div className="flex flex-col items-center gap-2 bg-amber-500/10 border border-amber-500/40 rounded-xl px-4 py-4 text-center mt-2">
                  <Trophy className="w-7 h-7 text-amber-400" />
                  <div className="text-[10px] font-bold text-amber-400 uppercase tracking-widest font-display">Campeón</div>
                  <div className="w-14 h-14 flex items-center justify-center">
                    <img src={getLogo40(champion)} alt={champion} className="max-w-full max-h-full object-contain" />
                  </div>
                  <div className="font-display font-bold text-base text-amber-300">{champion}</div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </section>
  );
};

export default PlayoffBracket;
