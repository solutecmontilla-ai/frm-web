import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAdmin } from "@/contexts/AdminContext";
import { adminFetch } from "@/lib/adminApi";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Send } from "lucide-react";

interface Partido {
  id: number;
  jornada_label: string;
  fase: string;
  local_nombre: string;
  visita_nombre: string;
  goles_local: number;
  goles_visita: number;
}

const schema = z.object({
  torneo:        z.enum(["torneo40", "torneo35"]),
  partidoId:     z.coerce.number().min(1, "Selecciona un partido"),
  equipoNombre:  z.string().min(1, "Requerido"),
  jugadorNombre: z.string().min(1, "Requerido"),
  tipo:          z.enum(["directa", "segunda_amarilla"]),
});

type FormValues = z.infer<typeof schema>;

export default function AdminRoja() {
  const { secret } = useAdmin();
  const [loading, setLoading]   = useState(false);
  const [partidos, setPartidos] = useState<Partido[]>([]);
  const [loadingP, setLoadingP] = useState(false);

  const { register, handleSubmit, watch, setValue, reset } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      torneo: "torneo40",
      partidoId: 0,
      equipoNombre: "",
      jugadorNombre: "",
      tipo: "directa",
    },
  });

  const torneo    = watch("torneo");
  const partidoId = watch("partidoId");
  const tipo      = watch("tipo");

  const selectedPartido = partidos.find((p) => p.id === Number(partidoId));

  useEffect(() => {
    setLoadingP(true);
    setPartidos([]);
    setValue("partidoId", 0);
    setValue("equipoNombre", "");
    adminFetch(secret, `/partidos/${torneo}`)
      .then((d) => setPartidos(d.partidos))
      .catch(() => toast.error("Error cargando partidos"))
      .finally(() => setLoadingP(false));
  }, [torneo, secret]);

  const onSubmit = async (data: FormValues) => {
    setLoading(true);
    try {
      await adminFetch(secret, "/roja", {
        method: "POST",
        body: JSON.stringify({
          torneo:        data.torneo,
          partidoId:     data.partidoId,
          equipoNombre:  data.equipoNombre,
          jugadorNombre: data.jugadorNombre,
          tipo:          data.tipo,
        }),
      });
      const tipoLabel = data.tipo === "directa" ? "Roja directa" : "2da amarilla";
      toast.success(`${tipoLabel}: ${data.jugadorNombre} (${data.equipoNombre}) — suspensión automática registrada`);
      reset({ torneo: data.torneo, partidoId: 0, equipoNombre: "", jugadorNombre: "", tipo: "directa" });
      setValue("partidoId", 0);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  const faseLabel = (fase: string) => {
    const map: Record<string, string> = { regular: "", QF: " · QF", SF: " · SF", F: " · Final", TP: " · 3er Lugar" };
    return map[fase] ?? "";
  };

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Tarjeta Roja</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Registra la expulsión y genera suspensión automática
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Torneo */}
        <div className="bg-gradient-card border border-border/50 rounded-xl p-4 space-y-4">
          <div className="space-y-1.5">
            <Label>Torneo</Label>
            <Select value={torneo} onValueChange={(v) => setValue("torneo", v as any)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="torneo40">Liga +40</SelectItem>
                <SelectItem value="torneo35">Liga +35</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Partido */}
          <div className="space-y-1.5">
            <Label>Partido</Label>
            <Select
              value={partidoId ? String(partidoId) : ""}
              onValueChange={(v) => {
                setValue("partidoId", Number(v));
                setValue("equipoNombre", "");
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder={loadingP ? "Cargando..." : "Selecciona el partido"} />
              </SelectTrigger>
              <SelectContent>
                {partidos.map((p) => (
                  <SelectItem key={p.id} value={String(p.id)}>
                    {p.local_nombre} {p.goles_local}–{p.goles_visita} {p.visita_nombre}
                    {p.jornada_label ? ` · ${p.jornada_label}` : ""}
                    {faseLabel(p.fase)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Equipo — botones del partido seleccionado */}
        {selectedPartido && (
          <div className="bg-gradient-card border border-border/50 rounded-xl p-4 space-y-3">
            <Label>Equipo</Label>
            <div className="grid grid-cols-2 gap-3">
              {[selectedPartido.local_nombre, selectedPartido.visita_nombre].map((equipo) => (
                <button
                  key={equipo}
                  type="button"
                  onClick={() => setValue("equipoNombre", equipo)}
                  className={`px-3 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                    watch("equipoNombre") === equipo
                      ? "bg-destructive/20 border-destructive/60 text-destructive"
                      : "bg-muted/30 border-border/50 text-muted-foreground hover:border-border hover:text-foreground"
                  }`}
                >
                  {equipo}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Jugador + Tipo */}
        <div className="bg-gradient-card border border-border/50 rounded-xl p-4 space-y-4">
          <div className="space-y-1.5">
            <Label>Jugador expulsado</Label>
            <Input placeholder="Nombre del jugador" {...register("jugadorNombre")} />
          </div>

          <div className="space-y-1.5">
            <Label>Tipo</Label>
            <div className="grid grid-cols-2 gap-3">
              {(["directa", "segunda_amarilla"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setValue("tipo", t)}
                  className={`px-3 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                    tipo === t
                      ? "bg-destructive/20 border-destructive/60 text-destructive"
                      : "bg-muted/30 border-border/50 text-muted-foreground hover:border-border hover:text-foreground"
                  }`}
                >
                  {t === "directa" ? "Roja directa" : "2da amarilla"}
                </button>
              ))}
            </div>
          </div>
        </div>

        <Button
          type="submit"
          variant="destructive"
          className="w-full"
          disabled={loading || !partidoId || !watch("equipoNombre")}
        >
          <Send className="w-4 h-4 mr-2" />
          {loading ? "Registrando..." : "Registrar Expulsión"}
        </Button>
      </form>
    </div>
  );
}
