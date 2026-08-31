import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, ShieldAlert } from "lucide-react";
import { getLogo40, getLogo35 } from "@/lib/teamLogos";
import ligaLogo from "@/assets/liga-frm-logo.png";

type Torneo = "torneo40" | "torneo35";

interface Amarilla {
  id: number;
  jugador_nombre: string;
  equipo: string;
  multa_pagada: number;
  jornada_label: string | null;
  fecha_partido: string | null;
}

interface Roja {
  id: number;
  jugador_nombre: string;
  equipo: string;
  tipo: string;
  multa_pagada: number;
  jornada_label: string | null;
  fecha_partido: string | null;
}

interface Suspension {
  id: number;
  jugador_nombre: string;
  equipo: string;
  motivo: string;
  fecha_sancion: string;
  cumplida: number;
}

interface TeamGroup {
  nombre: string;
  amarillas: Amarilla[];
  rojas: Roja[];
  suspensiones: Suspension[];
}

function formatFecha(fecha: string | null): string {
  if (!fecha) return "";
  try {
    return new Date(fecha).toLocaleDateString("es-VE", { day: "2-digit", month: "2-digit", year: "numeric" });
  } catch {
    return fecha;
  }
}

function formatJornada(jornada: string | null, fecha: string | null): string {
  const j = jornada ?? "";
  const f = fecha ? formatFecha(fecha) : "";
  if (j && f) return `${j} · ${f}`;
  return j || f || "—";
}

function tipoRoja(tipo: string): string {
  if (tipo === "segunda_amarilla" || tipo === "doble_amarilla") return "2ª Amarilla";
  return "Roja Directa";
}

function motivoSuspension(motivo: string): string {
  if (motivo === "3_amarillas") return "3 Amarillas acumuladas";
  if (motivo === "segunda_amarilla") return "2ª Amarilla";
  return "Roja Directa";
}

function buildGroups(
  amarillas: Amarilla[],
  rojas: Roja[],
  suspensiones: Suspension[]
): TeamGroup[] {
  const map: Record<string, TeamGroup> = {};

  const getOrCreate = (nombre: string) => {
    if (!map[nombre]) map[nombre] = { nombre, amarillas: [], rojas: [], suspensiones: [] };
    return map[nombre];
  };

  for (const a of amarillas) getOrCreate(a.equipo).amarillas.push(a);
  for (const r of rojas) getOrCreate(r.equipo).rojas.push(r);
  for (const s of suspensiones) getOrCreate(s.equipo).suspensiones.push(s);

  return Object.values(map).sort((a, b) => {
    const aSusp = a.suspensiones.filter((s) => !s.cumplida).length;
    const bSusp = b.suspensiones.filter((s) => !s.cumplida).length;
    if (bSusp !== aSusp) return bSusp - aSusp;
    return (b.rojas.length + b.amarillas.length) - (a.rojas.length + a.amarillas.length);
  });
}

function groupAmarillasByPlayer(amarillas: Amarilla[]) {
  const map: Record<string, Amarilla[]> = {};
  for (const a of amarillas) {
    if (!map[a.jugador_nombre]) map[a.jugador_nombre] = [];
    map[a.jugador_nombre].push(a);
  }
  return Object.entries(map).sort((a, b) => b[1].length - a[1].length);
}

const TORNEO_LABELS: Record<string, string> = {
  torneo40: "Liga +40",
  torneo35: "Liga +35",
};

const BACK_ROUTES: Record<string, string> = {
  torneo40: "/torneo-40",
  torneo35: "/torneo-35",
};

export default function DisciplinaPage() {
  const { torneo = "torneo40" } = useParams<{ torneo: string }>();
  const navigate = useNavigate();
  const getLogo = torneo === "torneo40" ? getLogo40 : getLogo35;

  const [groups, setGroups] = useState<TeamGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [totales, setTotales] = useState({ amarillas: 0, rojas: 0, suspActivas: 0 });

  useEffect(() => {
    setLoading(true);
    fetch(`/api/${torneo}/disciplina?t=${Date.now()}`)
      .then((r) => r.json())
      .then((data) => {
        const g = buildGroups(data.amarillas ?? [], data.rojas ?? [], data.suspensiones ?? []);
        setGroups(g);
        setTotales({
          amarillas: (data.amarillas ?? []).length,
          rojas: (data.rojas ?? []).length,
          suspActivas: (data.suspensiones ?? []).filter((s: Suspension) => !s.cumplida).length,
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [torneo]);

  const accentColor = torneo === "torneo40"
    ? "from-primary via-secondary to-primary"
    : "from-emerald-500 via-teal-500 to-emerald-500";

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-primary/20 bg-background/90 backdrop-blur-xl">
        <div className={`h-1 w-full bg-gradient-to-r ${accentColor}`} />
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(BACK_ROUTES[torneo] ?? "/")}
              className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="text-sm font-medium hidden sm:inline">{TORNEO_LABELS[torneo]}</span>
            </button>
            <div className="w-px h-8 bg-border/50 mx-1" />
            <img src={ligaLogo} alt="Liga FRM" className="h-10 w-auto object-contain" />
            <div className="hidden sm:block">
              <h1 className="font-display text-lg font-bold text-gradient-gold">Disciplina</h1>
              <p className="text-xs text-muted-foreground">{TORNEO_LABELS[torneo]} — Edición activa</p>
            </div>
          </div>
          <ShieldAlert className="w-6 h-6 text-amber-400" />
        </div>
      </header>

      <main className="container py-8 max-w-3xl mx-auto px-4 space-y-6">
        {/* Title */}
        <div>
          <h2 className="font-display text-3xl font-bold text-foreground">
            Disciplina · <span className="text-gradient-gold">{TORNEO_LABELS[torneo]}</span>
          </h2>
          <p className="text-sm text-muted-foreground mt-1">Tarjetas y suspensiones de la edición activa</p>
        </div>

        {/* Summary */}
        {!loading && (
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-gradient-card border border-amber-500/20 rounded-xl p-4 text-center">
              <p className="text-2xl font-display font-bold text-amber-400">{totales.amarillas}</p>
              <p className="text-xs text-muted-foreground mt-1 uppercase tracking-wider">Amarillas</p>
            </div>
            <div className="bg-gradient-card border border-red-500/20 rounded-xl p-4 text-center">
              <p className="text-2xl font-display font-bold text-red-400">{totales.rojas}</p>
              <p className="text-xs text-muted-foreground mt-1 uppercase tracking-wider">Rojas</p>
            </div>
            <div className="bg-gradient-card border border-destructive/20 rounded-xl p-4 text-center">
              <p className="text-2xl font-display font-bold text-destructive">{totales.suspActivas}</p>
              <p className="text-xs text-muted-foreground mt-1 uppercase tracking-wider">Suspendidos</p>
            </div>
          </div>
        )}

        {loading && (
          <div className="py-20 text-center text-muted-foreground text-sm">Cargando...</div>
        )}

        {!loading && groups.length === 0 && (
          <div className="py-20 text-center text-muted-foreground text-sm">
            No hay tarjetas registradas para esta edición.
          </div>
        )}

        {/* Team cards */}
        {groups.map((team) => {
          const suspActivas = team.suspensiones.filter((s) => !s.cumplida);
          const suspCumplidas = team.suspensiones.filter((s) => s.cumplida);
          const playerAmarillas = groupAmarillasByPlayer(team.amarillas);

          return (
            <div
              key={team.nombre}
              className="bg-gradient-card border border-border/50 rounded-2xl overflow-hidden"
            >
              {/* Team header */}
              <div className="flex items-center gap-3 p-4 border-b border-border/30">
                <img
                  src={getLogo(team.nombre)}
                  alt={team.nombre}
                  className="w-10 h-10 rounded-full object-cover shrink-0 bg-muted"
                  onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }}
                />
                <span className="font-display font-bold text-foreground text-base flex-1">
                  {team.nombre}
                </span>
                <div className="flex items-center gap-2 shrink-0">
                  {suspActivas.length > 0 && (
                    <span className="text-[11px] font-bold bg-destructive/20 text-destructive border border-destructive/30 rounded-full px-2.5 py-0.5">
                      🚫 {suspActivas.length} susp.
                    </span>
                  )}
                  {team.amarillas.length > 0 && (
                    <span className="text-[11px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30 rounded-full px-2.5 py-0.5">
                      🟡 {team.amarillas.length}
                    </span>
                  )}
                  {team.rojas.length > 0 && (
                    <span className="text-[11px] font-bold bg-red-500/15 text-red-400 border border-red-500/30 rounded-full px-2.5 py-0.5">
                      🔴 {team.rojas.length}
                    </span>
                  )}
                </div>
              </div>

              <div className="p-4 space-y-5">
                {/* Suspensiones activas */}
                {suspActivas.length > 0 && (
                  <div>
                    <p className="text-[10px] font-bold text-destructive uppercase tracking-widest mb-2">
                      Suspensiones activas
                    </p>
                    <div className="space-y-1.5">
                      {suspActivas.map((s) => (
                        <div
                          key={s.id}
                          className="flex items-center justify-between gap-3 bg-destructive/5 border border-destructive/20 rounded-lg px-3 py-2"
                        >
                          <span className="text-sm font-medium text-foreground">{s.jugador_nombre}</span>
                          <div className="flex items-center gap-2 text-right shrink-0">
                            <span className="text-xs text-muted-foreground">{motivoSuspension(s.motivo)}</span>
                            <span className="text-[10px] font-bold text-destructive bg-destructive/10 rounded px-1.5 py-0.5">
                              ACTIVA
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Amarillas por jugador */}
                {playerAmarillas.length > 0 && (
                  <div>
                    <p className="text-[10px] font-bold text-amber-400 uppercase tracking-widest mb-2">
                      Tarjetas amarillas
                    </p>
                    <div className="space-y-2">
                      {playerAmarillas.map(([jugador, amas]) => {
                        const total = amas.length;
                        const alerta = total % 3 === 2;
                        const suspendido = total % 3 === 0 && total > 0;
                        return (
                          <div key={jugador} className="rounded-lg border border-border/30 overflow-hidden">
                            {/* Player row */}
                            <div className="flex items-center justify-between gap-3 px-3 py-2 bg-amber-500/5">
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="text-sm font-medium text-foreground truncate">{jugador}</span>
                                {alerta && (
                                  <span className="text-[10px] font-bold text-amber-400 bg-amber-500/15 border border-amber-500/30 rounded px-1.5 py-0.5 shrink-0">
                                    ⚠ 1 más
                                  </span>
                                )}
                                {suspendido && (
                                  <span className="text-[10px] font-bold text-destructive bg-destructive/10 border border-destructive/30 rounded px-1.5 py-0.5 shrink-0">
                                    🚨 Suspendido
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-0.5 shrink-0">
                                {Array.from({ length: total }).map((_, i) => (
                                  <span key={i} className="text-base leading-none">🟡</span>
                                ))}
                              </div>
                            </div>
                            {/* Individual cards */}
                            <div className="divide-y divide-border/20">
                              {amas.map((a) => (
                                <div
                                  key={a.id}
                                  className="flex items-center justify-between gap-3 px-3 py-1.5"
                                >
                                  <span className="text-xs text-muted-foreground">
                                    {formatJornada(a.jornada_label, a.fecha_partido)}
                                  </span>
                                  {a.multa_pagada ? (
                                    <span className="text-[10px] text-emerald-400">✓ Multa pagada</span>
                                  ) : null}
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Tarjetas rojas */}
                {team.rojas.length > 0 && (
                  <div>
                    <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest mb-2">
                      Tarjetas rojas
                    </p>
                    <div className="space-y-1.5">
                      {team.rojas.map((r) => (
                        <div
                          key={r.id}
                          className="flex items-center justify-between gap-3 bg-red-500/5 border border-red-500/20 rounded-lg px-3 py-2"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-base leading-none">🔴</span>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-foreground truncate">{r.jugador_nombre}</p>
                              <p className="text-xs text-muted-foreground">
                                {tipoRoja(r.tipo)} · {formatJornada(r.jornada_label, r.fecha_partido)}
                              </p>
                            </div>
                          </div>
                          {r.multa_pagada ? (
                            <span className="text-[10px] text-emerald-400 shrink-0">✓ Multa pagada</span>
                          ) : (
                            <span className="text-[10px] text-red-400/70 shrink-0">Multa pendiente</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Suspensiones cumplidas */}
                {suspCumplidas.length > 0 && (
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">
                      Suspensiones cumplidas
                    </p>
                    <div className="space-y-1.5">
                      {suspCumplidas.map((s) => (
                        <div
                          key={s.id}
                          className="flex items-center justify-between gap-3 opacity-50 px-3 py-1.5 border border-border/20 rounded-lg"
                        >
                          <span className="text-sm text-muted-foreground">{s.jugador_nombre}</span>
                          <div className="flex items-center gap-2 text-right shrink-0">
                            <span className="text-xs text-muted-foreground">{motivoSuspension(s.motivo)}</span>
                            <span className="text-[10px] text-muted-foreground">✓ Cumplida</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </main>

      {/* Footer */}
      <footer className="border-t border-primary/20 mt-10">
        <div className={`h-1 w-full bg-gradient-to-r ${accentColor}`} />
        <div className="container py-6 text-center text-sm text-muted-foreground">
          © 2025 Liga FRM — Disciplina {TORNEO_LABELS[torneo]}
        </div>
      </footer>
    </div>
  );
}
