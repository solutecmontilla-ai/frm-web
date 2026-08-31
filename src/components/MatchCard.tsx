import { cn } from "@/lib/utils";

interface Scorer {
  name: string;
  goals: number;
}

interface Team {
  name: string;
  logo: string;
  score: number;
  scorers: Scorer[];
}

interface MatchCardProps {
  homeTeam: Team;
  awayTeam: Team;
  className?: string;
  delay?: number;
  status?: "SUSPENDIDO";
}

const MatchCard = ({ homeTeam, awayTeam, className, delay = 0, status }: MatchCardProps) => {
  const isSuspended = status === "SUSPENDIDO";
  const homeWins = !isSuspended && homeTeam.score > awayTeam.score;
  const awayWins = !isSuspended && awayTeam.score > homeTeam.score;
  const isDraw = !isSuspended && homeTeam.score === awayTeam.score;

  return (
    <div
      className={cn(
        "bg-gradient-card rounded-lg border border-border/50 overflow-hidden",
        "hover:border-primary/50 hover:shadow-glow transition-all duration-300",
        "opacity-0 animate-fade-in",
        className
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Match Header */}
      <div className={cn("bg-muted/30 px-4 py-2 border-b border-border/30", isSuspended && "bg-destructive/10")}>
        <span className={cn("text-xs font-medium uppercase tracking-wider", isSuspended ? "text-destructive font-bold" : "text-muted-foreground")}>
          {isSuspended ? "Suspendido" : "Partido"}
        </span>
      </div>

      {/* Score Section */}
      <div className="p-6">
        <div className="flex items-center justify-between gap-4">
          {/* Home Team */}
          <div className="flex-1 flex flex-col items-center">
            <div className="w-14 h-14 md:w-16 md:h-16 mb-2 flex items-center justify-center">
              <img
                src={homeTeam.logo}
                alt={homeTeam.name}
                className="max-w-full max-h-full object-contain drop-shadow-lg"
              />
            </div>
            <h3
              className={cn(
                "font-display text-sm md:text-base font-bold transition-colors text-center leading-tight",
                homeWins && "text-win",
                !homeWins && !isDraw && "text-muted-foreground"
              )}
            >
              {homeTeam.name}
            </h3>
          </div>

          {/* Score */}
          <div className="flex items-center gap-3">
            {isSuspended ? (
              <span className="font-display text-lg md:text-xl font-bold text-destructive uppercase tracking-wider">
                SUSP.
              </span>
            ) : (
              <>
                <span className={cn("font-display text-4xl md:text-5xl font-bold", homeWins ? "text-win" : isDraw ? "text-draw" : "text-foreground")}>
                  {homeTeam.score}
                </span>
                <span className="text-2xl text-muted-foreground">-</span>
                <span className={cn("font-display text-4xl md:text-5xl font-bold", awayWins ? "text-win" : isDraw ? "text-draw" : "text-foreground")}>
                  {awayTeam.score}
                </span>
              </>
            )}
          </div>

          {/* Away Team */}
          <div className="flex-1 flex flex-col items-center">
            <div className="w-14 h-14 md:w-16 md:h-16 mb-2 flex items-center justify-center">
              <img
                src={awayTeam.logo}
                alt={awayTeam.name}
                className="max-w-full max-h-full object-contain drop-shadow-lg"
              />
            </div>
            <h3
              className={cn(
                "font-display text-sm md:text-base font-bold transition-colors text-center leading-tight",
                awayWins && "text-win",
                !awayWins && !isDraw && "text-muted-foreground"
              )}
            >
              {awayTeam.name}
            </h3>
          </div>
        </div>

        {/* Scorers */}
        {!isSuspended && (
          <div className="mt-6 pt-4 border-t border-border/30">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-xs uppercase tracking-wider text-primary font-semibold mb-2">Goles</p>
                {homeTeam.scorers.map((scorer, index) => (
                  <p key={index} className="text-sm text-muted-foreground">
                    {scorer.name}
                    {scorer.goals > 1 && <span className="text-primary ml-1">({scorer.goals})</span>}
                  </p>
                ))}
              </div>
              <div className="space-y-1 text-right">
                <p className="text-xs uppercase tracking-wider text-primary font-semibold mb-2">Goles</p>
                {awayTeam.scorers.map((scorer, index) => (
                  <p key={index} className="text-sm text-muted-foreground">
                    {scorer.name}
                    {scorer.goals > 1 && <span className="text-primary ml-1">({scorer.goals})</span>}
                  </p>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MatchCard;
