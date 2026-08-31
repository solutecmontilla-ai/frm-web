import { useEffect, useState } from "react";

export interface TorneoHero {
  edicionNombre: string | null;
  numero: number | null;
  equiposCount: number | null;
  heroSubtitle: string | null;
  heroDescription: string | null;
  stats: { equipos: number; jornadas: number; goles: number; partidos: number };
}

export function useTorneoHero(torneo: "torneo40" | "torneo35") {
  const [hero, setHero] = useState<TorneoHero | null>(null);

  useEffect(() => {
    fetch(`/api/torneos/hero?t=${Date.now()}`)
      .then((r) => r.ok ? r.json() : null)
      .then((d) => {
        if (d?.torneos?.[torneo]) setHero(d.torneos[torneo]);
      })
      .catch(() => {});
  }, [torneo]);

  return hero;
}
