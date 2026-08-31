import MatchCard from "./MatchCard";
import { Calendar } from "lucide-react";
import { getLogo40 } from "@/lib/teamLogos";
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

const JornadaSection = ({ jornada }: { jornada: Jornada }) => {
  const matches = jornada.matches.map((m) => ({
    homeTeam: {
      name: m.homeTeam,
      logo: getLogo40(m.homeTeam),
      score: m.homeScore,
      scorers: m.homeScorers,
    },
    awayTeam: {
      name: m.awayTeam,
      logo: getLogo40(m.awayTeam),
      score: m.awayScore,
      scorers: m.awayScorers,
    },
    status: m.status,
  }));

  return (
    <div className="mb-16 last:mb-0">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/30 rounded-full px-4 py-1.5 mb-4">
          <Calendar className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-primary">{jornada.label}</span>
        </div>
        <p className="text-muted-foreground text-sm">{jornada.matches.length} partidos jugados</p>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
        {matches.map((match, index) => (
          <MatchCard
            key={index}
            homeTeam={match.homeTeam}
            awayTeam={match.awayTeam}
            delay={index * 100}
            status={match.status}
          />
        ))}
      </div>
    </div>
  );
};

const ResultsSection = () => {
  const { data, loading } = useTournamentData<ResultsData>("torneo40", "resultados");
  const jornadas = data?.jornadas ?? [];

  return (
    <section id="resultados" className="py-16 md:py-24 bg-background">
      <div className="container">
        <div className="text-center mb-12">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground">Resultados</h2>
          <p className="text-muted-foreground mt-2">Todos los partidos del torneo</p>
        </div>

        {loading && (
          <div className="text-center py-12 text-muted-foreground">Cargando resultados...</div>
        )}

        {!loading && jornadas.map((jornada) => (
          <JornadaSection key={jornada.number} jornada={jornada} />
        ))}
      </div>
    </section>
  );
};

export default ResultsSection;
