import { Trophy } from "lucide-react";
import MatchCard from "@/components/MatchCard";
import { getLogo35 } from "@/lib/teamLogos";
import { useTournamentData } from "@/hooks/useTournamentData";

interface ScorerEntry {
  name: string;
  goals: number;
}

interface MatchEntry {
  homeTeam: string;
  homeScore: number;
  homeScorers: ScorerEntry[];
  awayTeam: string;
  awayScore: number;
  awayScorers: ScorerEntry[];
  status?: "SUSPENDIDO";
}

interface Jornada {
  number: number;
  label: string;
  matches: MatchEntry[];
}

interface ResultsData {
  jornadas: Jornada[];
}

const JornadaBlock = ({ jornada }: { jornada: Jornada }) => {
  const matches = jornada.matches.map((m) => ({
    homeTeam: {
      name: m.homeTeam,
      logo: getLogo35(m.homeTeam),
      score: m.homeScore,
      scorers: m.homeScorers,
    },
    awayTeam: {
      name: m.awayTeam,
      logo: getLogo35(m.awayTeam),
      score: m.awayScore,
      scorers: m.awayScorers,
    },
    status: m.status,
  }));

  return (
    <div className="mb-12">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-px flex-1 bg-border/50" />
        <h3 className="font-display text-lg font-bold text-primary uppercase tracking-wider">{jornada.label}</h3>
        <span className="text-xs text-muted-foreground bg-muted/50 rounded-full px-3 py-1">{jornada.matches.length} partidos</span>
        <div className="h-px flex-1 bg-border/50" />
      </div>
      <div className="space-y-4">
        {matches.map((match, index) => (
          <MatchCard key={index} homeTeam={match.homeTeam} awayTeam={match.awayTeam} delay={index} status={match.status} />
        ))}
      </div>
    </div>
  );
};

const ResultsSection35 = () => {
  const { data, loading } = useTournamentData<ResultsData>("torneo35", "resultados");
  const jornadas = data?.jornadas ?? [];

  return (
    <section id="resultados" className="py-16 md:py-24 bg-muted/30">
      <div className="container">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/30 rounded-full px-4 py-1.5 mb-4">
            <Trophy className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">Resultados</span>
          </div>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground">Resultados del Torneo</h2>
          <p className="text-muted-foreground mt-2">Cancha: La Trinidad</p>
        </div>

        {loading && (
          <div className="text-center py-12 text-muted-foreground">Cargando resultados...</div>
        )}

        {!loading && (
          <div className="max-w-3xl mx-auto">
            {jornadas.map((jornada) => (
              <JornadaBlock key={jornada.number} jornada={jornada} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default ResultsSection35;
