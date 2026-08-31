import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Trophy, Star, Swords, ArrowLeft, Clock } from "lucide-react";
import { getLogo40, getLogo35 } from "@/lib/teamLogos";
import { useTournamentData } from "@/hooks/useTournamentData";
import { cn } from "@/lib/utils";
import ligaLogo from "@/assets/liga-frm-logo.png";
import liga35Logo from "@/assets/liga-frm-35-logo.jpeg";

interface EdicionResumen {
  id: number;
  nombre: string;
  numero: number;
  activa: number;
  champion: string | null;
  runnerUp: string | null;
  finalScore: string | null;
  topScorer: { name: string; team: string; goals: number } | null;
  totalPartidos: number;
}

interface EdicionesData {
  ediciones: EdicionResumen[];
}

type Torneo = "torneo40" | "torneo35";

function EdicionCard({ ed, torneo }: { ed: EdicionResumen; torneo: Torneo }) {
  const getLogo = torneo === "torneo40" ? getLogo40 : getLogo35;
  const isActive = ed.activa === 1;

  return (
    <div
      className={cn(
        "bg-gradient-card border rounded-2xl p-6 space-y-5 transition-all duration-300",
        isActive
          ? "border-primary/50 shadow-glow"
          : "border-border/50 hover:border-border"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display text-xl font-bold text-foreground">{ed.nombre}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {ed.totalPartidos} partidos jugados
          </p>
        </div>
        {isActive ? (
          <span className="flex items-center gap-1.5 px-3 py-1 bg-primary/20 border border-primary/40 rounded-full text-xs font-bold text-primary uppercase tracking-widest">
            <Clock className="w-3 h-3" /> En Curso
          </span>
        ) : (
          <span className="px-3 py-1 bg-muted/50 border border-border/50 rounded-full text-xs text-muted-foreground uppercase tracking-widest">
            Finalizada
          </span>
        )}
      </div>

      {/* Campeón */}
      {ed.champion ? (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <Trophy className="w-5 h-5 text-amber-400 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold text-amber-400 uppercase tracking-widest mb-1">
                Campeón
              </p>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 shrink-0 flex items-center justify-center">
                  <img
                    src={getLogo(ed.champion)}
                    alt={ed.champion}
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
                <span className="font-display font-bold text-amber-300 truncate">
                  {ed.champion}
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-muted/30 border border-border/30 rounded-xl p-4 flex items-center gap-3">
          <Trophy className="w-5 h-5 text-muted-foreground/40 shrink-0" />
          <p className="text-sm text-muted-foreground/60 italic">Torneo en curso</p>
        </div>
      )}

      {/* Final + Sub */}
      {(ed.runnerUp || ed.finalScore) && (
        <div className="space-y-2">
          {ed.finalScore && (
            <div className="flex items-center gap-2">
              <Swords className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              <span className="text-xs text-muted-foreground">
                Final:{" "}
                <span className="font-semibold text-foreground">{ed.finalScore}</span>
              </span>
            </div>
          )}
          {ed.runnerUp && (
            <div className="flex items-center gap-2">
              <div className="w-3.5 h-3.5 rounded-full bg-zinc-400/30 flex items-center justify-center shrink-0">
                <span className="text-[8px] font-bold text-zinc-400">2</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 flex items-center justify-center">
                  <img
                    src={getLogo(ed.runnerUp)}
                    alt={ed.runnerUp}
                    className="max-w-full max-h-full object-contain opacity-70"
                  />
                </div>
                <span className="text-xs text-muted-foreground">{ed.runnerUp}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Goleador */}
      {ed.topScorer && (
        <div className="flex items-center gap-2 pt-3 border-t border-border/40">
          <Star className="w-3.5 h-3.5 text-primary shrink-0" />
          <div className="flex-1 min-w-0">
            <span className="text-[10px] text-muted-foreground uppercase tracking-widest">
              Goleador —{" "}
            </span>
            <span className="text-xs font-semibold text-foreground">
              {ed.topScorer.name}
            </span>
            <span className="text-xs text-muted-foreground">
              {" "}({ed.topScorer.team})
            </span>
          </div>
          <span className="font-display font-bold text-primary text-sm shrink-0">
            {ed.topScorer.goals} goles
          </span>
        </div>
      )}
    </div>
  );
}

function TorneoTab({ torneo }: { torneo: Torneo }) {
  const { data, loading } = useTournamentData<EdicionesData>(torneo, "ediciones" as any);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {[1, 2].map((i) => (
          <div key={i} className="bg-gradient-card border border-border/50 rounded-2xl p-6 h-64 animate-pulse" />
        ))}
      </div>
    );
  }

  const ediciones = data?.ediciones ?? [];

  if (!ediciones.length) {
    return (
      <p className="text-center text-muted-foreground py-12">
        No hay ediciones registradas.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {ediciones.map((ed) => (
        <EdicionCard key={ed.id} ed={ed} torneo={torneo} />
      ))}
    </div>
  );
}

export default function Historial() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Torneo>("torneo40");

  const tabs = [
    { value: "torneo40" as Torneo, label: "Liga +40", logo: ligaLogo },
    { value: "torneo35" as Torneo, label: "Liga +35", logo: liga35Logo },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="h-1 w-full bg-gradient-to-r from-primary via-secondary to-primary" />

      {/* Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary/10 rounded-full blur-[150px]" />
      </div>

      <div className="relative z-10 flex-1 container py-8 md:py-12 space-y-8">
        {/* Back + Title */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium">Inicio</span>
          </button>
        </div>

        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/30 rounded-full px-4 py-1.5">
            <Trophy className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">Historia</span>
          </div>
          <h1 className="font-display text-3xl md:text-5xl font-bold text-foreground">
            Ediciones Anteriores
          </h1>
          <p className="text-muted-foreground">Historial completo de la Liga FRM</p>
        </div>

        {/* Tabs */}
        <div className="flex justify-center gap-3">
          {tabs.map((t) => (
            <button
              key={t.value}
              onClick={() => setTab(t.value)}
              className={cn(
                "flex items-center gap-2.5 px-5 py-2.5 rounded-full border text-sm font-semibold transition-all duration-200",
                tab === t.value
                  ? "bg-primary/20 border-primary/50 text-primary shadow-glow"
                  : "bg-card/60 border-border/50 text-muted-foreground hover:text-foreground hover:border-border"
              )}
            >
              <img src={t.logo} alt={t.label} className="w-5 h-5 object-contain" />
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <TorneoTab torneo={tab} />
      </div>

      <footer className="relative border-t border-border/30 py-5 mt-8">
        <div className="container flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">© 2025 Liga FRM. Todos los derechos reservados.</p>
          <p className="text-sm text-muted-foreground">
            Diseñado por <span className="text-primary font-semibold">Amays Group</span>
          </p>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-secondary to-primary" />
      </footer>
    </div>
  );
}
