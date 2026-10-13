import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAdmin } from "@/contexts/AdminContext";
import { adminFetch } from "@/lib/adminApi";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, Bell, Calendar, ClipboardList, RefreshCw, ShieldAlert } from "lucide-react";

interface Suspendido { id: number; jornada: number | null; jornadaLabel: string | null; local: string; visita: string; }
interface Proximo    { dia: string; hora: string; cancha: string; local: string; visita: string; }
interface TorneoResumen {
  torneo: "torneo40" | "torneo35";
  edicion: string | null;
  jugados?: number;
  ultimaJornada?: number | null;
  suspendidos?: Suspendido[];
  proximos?: Proximo[];
  sancionesPendientes?: number;
}
interface Resumen { torneos: TorneoResumen[]; suscriptores: number; }

const NOMBRE = { torneo40: "Liga +40", torneo35: "Liga +35" } as const;

function Stat({ label, value, icon: Icon }: { label: string; value: React.ReactNode; icon: typeof Calendar }) {
  return (
    <div className="rounded-lg bg-muted/30 border border-border/40 px-3 py-2">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-muted-foreground">
        <Icon className="w-3 h-3" /> {label}
      </div>
      <div className="mt-0.5 text-lg font-bold text-foreground">{value}</div>
    </div>
  );
}

export default function AdminInicio() {
  const { secret } = useAdmin();
  const [data, setData] = useState<Resumen | null>(null);
  const [error, setError] = useState<string | null>(null);

  const cargar = () => {
    setError(null);
    adminFetch(secret, "/resumen").then(setData).catch((e) => setError(e.message));
  };

  useEffect(cargar, [secret]);

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Inicio</h1>
          <p className="text-sm text-muted-foreground mt-1">Estado de los torneos y tareas pendientes</p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => { setData(null); cargar(); }} className="gap-1.5">
          <RefreshCw className="w-4 h-4" /> Actualizar
        </Button>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {/* Accesos rápidos */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {[
          { to: "/admin/resultado", label: "Cargar resultado", icon: ClipboardList },
          { to: "/admin/proximos", label: "Programar", icon: Calendar },
          { to: "/admin/roja", label: "Tarjeta roja", icon: ShieldAlert },
          { to: "/admin/notificaciones", label: "Notificar", icon: Bell },
        ].map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            className="flex flex-col items-center gap-1.5 rounded-xl border border-border/50 bg-gradient-card p-3 text-xs font-medium text-foreground hover:border-primary/50 hover:text-primary transition-colors"
          >
            <Icon className="w-5 h-5 text-primary" />
            {label}
          </Link>
        ))}
      </div>

      {!data && !error && (
        <div className="grid md:grid-cols-2 gap-4">
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      )}

      {data && (
        <>
          <div className="grid md:grid-cols-2 gap-4">
            {data.torneos.map((t) => (
              <div key={t.torneo} className="bg-gradient-card border border-border/50 rounded-xl p-4 space-y-4">
                <div>
                  <h2 className="text-xs font-bold text-primary uppercase tracking-widest font-display">
                    {NOMBRE[t.torneo]}
                  </h2>
                  <p className="text-sm text-foreground mt-0.5">{t.edicion ?? "Sin edición activa"}</p>
                </div>

                {t.edicion && (
                  <>
                    <div className="grid grid-cols-3 gap-2">
                      <Stat label="Jornada" value={t.ultimaJornada ?? "—"} icon={ClipboardList} />
                      <Stat label="Jugados" value={t.jugados} icon={ClipboardList} />
                      <Stat label="Sanciones" value={t.sancionesPendientes} icon={ShieldAlert} />
                    </div>

                    <div className="space-y-2">
                      <h3 className="flex items-center gap-1.5 text-xs font-semibold text-amber-400">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Suspendidos pendientes ({t.suspendidos!.length})
                      </h3>
                      {t.suspendidos!.length === 0 && (
                        <p className="text-xs text-muted-foreground">Ninguno 🎉</p>
                      )}
                      {t.suspendidos!.map((s) => (
                        <div key={s.id} className="flex items-center justify-between gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2">
                          <div className="min-w-0">
                            <div className="text-sm text-foreground truncate">{s.local} vs {s.visita}</div>
                            <div className="text-[11px] text-muted-foreground">{s.jornadaLabel ?? `Jornada ${s.jornada}`}</div>
                          </div>
                          <Button asChild size="sm" variant="outline" className="h-7 text-xs shrink-0">
                            <Link
                              to={`/admin/resultado?${new URLSearchParams({
                                torneo: t.torneo,
                                jornada: String(s.jornada ?? ""),
                                local: s.local,
                                visita: s.visita,
                              })}`}
                            >
                              Cargar
                            </Link>
                          </Button>
                        </div>
                      ))}
                    </div>

                    <div className="space-y-2">
                      <h3 className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                        <Calendar className="w-3.5 h-3.5 text-primary" />
                        Programados ({t.proximos!.length})
                      </h3>
                      {t.proximos!.length === 0 && (
                        <p className="text-xs text-muted-foreground">
                          No hay partidos programados. <Link to="/admin/proximos" className="text-primary underline">Programar</Link>
                        </p>
                      )}
                      <div className="space-y-1">
                        {t.proximos!.map((p, i) => (
                          <div key={i} className="flex items-center justify-between gap-2 text-xs">
                            <span className="text-foreground truncate">{p.local} vs {p.visita}</span>
                            <span className="text-muted-foreground shrink-0">{p.dia} · {p.hora}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between gap-3 bg-gradient-card border border-border/50 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-primary/15 p-2 text-primary"><Bell className="w-5 h-5" /></div>
              <div>
                <div className="text-sm font-semibold text-foreground">{data.suscriptores} suscritos a notificaciones</div>
                <div className="text-xs text-muted-foreground">Reciben aviso automático al cargar resultados y programación</div>
              </div>
            </div>
            <Button asChild size="sm"><Link to="/admin/notificaciones">Enviar aviso</Link></Button>
          </div>
        </>
      )}
    </div>
  );
}
