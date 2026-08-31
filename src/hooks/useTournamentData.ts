import { useState, useEffect } from "react";

type Tournament = "torneo40" | "torneo35";
type DataType = "tabla" | "resultados" | "goleadores" | "amarillas" | "proximos" | "playoff" | "ediciones";

export function useTournamentData<T>(tournament: Tournament, dataType: DataType) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/${tournament}/${dataType}?t=${Date.now()}`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((d) => {
        setData(d);
        setError(null);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [tournament, dataType]);

  return { data, loading, error };
}
