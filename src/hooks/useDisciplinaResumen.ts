import { useState, useEffect } from "react";

interface AmarillaRaw {
  jugador_nombre: string;
  equipo: string;
}

interface SuspensionRaw {
  jugador_nombre: string;
  equipo: string;
  cumplida: number;
}

interface DisciplinaRaw {
  amarillas: AmarillaRaw[];
  suspensiones: SuspensionRaw[];
}

export interface TeamDisciplina {
  suspendidos: string[];
  alertas: string[];    // un amarilla más = suspensión
}

export function useDisciplinaResumen(torneo: "torneo40" | "torneo35") {
  const [resumen, setResumen] = useState<Record<string, TeamDisciplina>>({});

  useEffect(() => {
    fetch(`/api/${torneo}/disciplina?t=${Date.now()}`)
      .then((r) => r.json())
      .then((data: DisciplinaRaw) => {
        const map: Record<string, TeamDisciplina> = {};

        // Suspensiones activas por equipo
        for (const s of data.suspensiones ?? []) {
          if (s.cumplida) continue;
          if (!map[s.equipo]) map[s.equipo] = { suspendidos: [], alertas: [] };
          if (!map[s.equipo].suspendidos.includes(s.jugador_nombre)) {
            map[s.equipo].suspendidos.push(s.jugador_nombre);
          }
        }

        // Contador de amarillas por jugador/equipo → alerta si count % 3 === 2
        const conteo: Record<string, number> = {};
        for (const a of data.amarillas ?? []) {
          const key = `${a.equipo}||${a.jugador_nombre}`;
          conteo[key] = (conteo[key] ?? 0) + 1;
        }
        for (const [key, total] of Object.entries(conteo)) {
          if (total % 3 === 2) {
            const [equipo, jugador] = key.split("||");
            if (!map[equipo]) map[equipo] = { suspendidos: [], alertas: [] };
            if (!map[equipo].alertas.includes(jugador)) {
              map[equipo].alertas.push(jugador);
            }
          }
        }

        setResumen(map);
      })
      .catch(() => {});
  }, [torneo]);

  return resumen;
}
