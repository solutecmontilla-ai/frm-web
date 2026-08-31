import { Award } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTournamentData } from "@/hooks/useTournamentData";

interface Scorer {
  name: string;
  team: string;
  goals: number;
}

interface ScorersData {
  scorers: Scorer[];
}

const TopScorersSection35 = () => {
  const { data, loading } = useTournamentData<ScorersData>("torneo35", "goleadores");
  const scorers = data?.scorers ?? [];

  return (
    <section id="goleadores" className="py-16 md:py-24 bg-muted/30">
      <div className="container">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/30 rounded-full px-4 py-1.5 mb-4">
            <Award className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">Goleadores</span>
          </div>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground">Tabla de Goleadores</h2>
          <p className="text-muted-foreground mt-2">Los máximos anotadores — Jornada 9</p>
        </div>

        {loading && (
          <div className="text-center py-12 text-muted-foreground">Cargando goleadores...</div>
        )}

        {!loading && scorers.length > 0 && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-gradient-card rounded-lg border border-border/50 overflow-hidden">
              <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-muted/50 border-b border-border/30">
                <div className="col-span-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">#</div>
                <div className="col-span-5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Jugador</div>
                <div className="col-span-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Equipo</div>
                <div className="col-span-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-right">Goles</div>
              </div>
              {scorers.map((scorer, index) => (
                <div key={`${scorer.name}-${index}`} className={cn("grid grid-cols-12 gap-4 px-6 py-4 items-center", "hover:bg-muted/30 transition-colors", "opacity-0 animate-fade-in", index !== scorers.length - 1 && "border-b border-border/20")} style={{ animationDelay: `${index * 40 + 200}ms` }}>
                  <div className="col-span-1">
                    {index < 3 ? (
                      <span className={cn("flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold", index === 0 && "bg-yellow-500/20 text-yellow-500", index === 1 && "bg-gray-400/20 text-gray-400", index === 2 && "bg-amber-600/20 text-amber-600")}>{index + 1}</span>
                    ) : (
                      <span className="text-sm text-muted-foreground font-medium">{index + 1}</span>
                    )}
                  </div>
                  <div className="col-span-5"><p className={cn("font-medium", index === 0 && "text-primary")}>{scorer.name}</p></div>
                  <div className="col-span-4"><p className="text-sm text-muted-foreground">{scorer.team}</p></div>
                  <div className="col-span-2 text-right"><span className={cn("font-display text-xl font-bold", index === 0 ? "text-primary" : "text-foreground")}>{scorer.goals}</span></div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default TopScorersSection35;
