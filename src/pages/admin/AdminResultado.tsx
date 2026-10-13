import { useForm, useFieldArray, UseFieldArrayReturn } from "react-hook-form";
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
import { Plus, X, Send, AlertTriangle } from "lucide-react";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { UseFormRegister } from "react-hook-form";

const golerSchema  = z.object({ name: z.string().min(1), goals: z.coerce.number().min(1) });
const amarillaSchema = z.object({ name: z.string().min(1) });
const rojaSchema   = z.object({ name: z.string().min(1), tipo: z.enum(["directa", "segunda_amarilla"]) });

const schema = z.object({
  torneo: z.enum(["torneo40", "torneo35"]),
  jornada: z.coerce.number().min(1),
  jornadaLabel: z.string().min(1),
  localNombre: z.string().min(1, "Requerido"),
  localGoles: z.coerce.number().min(0),
  golesLocal: z.array(golerSchema),
  amarillasLocal: z.array(amarillaSchema),
  rojasLocal: z.array(rojaSchema),
  visitaNombre: z.string().min(1, "Requerido"),
  visitaGoles: z.coerce.number().min(0),
  golesVisita: z.array(golerSchema),
  amarillasVisita: z.array(amarillaSchema),
  rojasVisita: z.array(rojaSchema),
});

type FormValues = z.infer<typeof schema>;

interface Equipo { id: number; nombre: string; }

interface TeamSectionProps {
  label: string;
  campoNombre: "localNombre" | "visitaNombre";
  equipos: Equipo[];
  jugadores: string[];
  golesReg: ReturnType<UseFormRegister<FormValues>>;
  golesArr: UseFieldArrayReturn<FormValues, any>;
  amarillasArr: UseFieldArrayReturn<FormValues, any>;
  rojasArr: UseFieldArrayReturn<FormValues, any>;
  register: UseFormRegister<FormValues>;
  prefix: "golesLocal" | "golesVisita";
  prefixAma: "amarillasLocal" | "amarillasVisita";
  prefixRoja: "rojasLocal" | "rojasVisita";
  watch: (name: string) => any;
  setValue: (name: string, value: any) => void;
}

function TeamSection({
  label,
  campoNombre,
  equipos,
  jugadores,
  golesReg,
  golesArr,
  amarillasArr,
  rojasArr,
  register,
  prefix,
  prefixAma,
  prefixRoja,
  watch,
  setValue,
}: TeamSectionProps) {
  const nombre = watch(campoNombre);
  const listId = `jugadores-${campoNombre}`;
  return (
    <div className="bg-gradient-card border border-border/50 rounded-xl p-4 space-y-4">
      <h3 className="text-xs font-bold text-primary uppercase tracking-widest font-display">
        {label}
      </h3>

      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-2 space-y-1.5">
          <Label>Equipo</Label>
          {equipos.length > 0 ? (
            <Select value={nombre || undefined} onValueChange={(v) => setValue(campoNombre, v)}>
              <SelectTrigger><SelectValue placeholder="Elegir equipo" /></SelectTrigger>
              <SelectContent>
                {equipos.map((eq) => <SelectItem key={eq.id} value={eq.nombre}>{eq.nombre}</SelectItem>)}
              </SelectContent>
            </Select>
          ) : (
            <Input placeholder="Nombre del equipo" {...register(campoNombre)} />
          )}
        </div>
        <div className="space-y-1.5">
          <Label>Goles</Label>
          <Input type="number" min={0} {...golesReg} />
        </div>
      </div>

      <datalist id={listId}>
        {jugadores.map((j) => <option key={j} value={j} />)}
      </datalist>

      {/* Goleadores */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs">Goleadores</Label>
          <Button type="button" variant="ghost" size="sm" className="h-6 text-xs gap-1"
            onClick={() => golesArr.append({ name: "", goals: 1 })}>
            <Plus className="w-3 h-3" /> Agregar
          </Button>
        </div>
        {golesArr.fields.map((field, i) => (
          <div key={field.id} className="flex gap-2 items-center">
            <Input placeholder="Jugador" className="flex-1" list={listId} autoComplete="off"
              {...register(`${prefix}.${i}.name` as any)} />
            <Input type="number" min={1} className="w-16 shrink-0"
              {...register(`${prefix}.${i}.goals` as any)} />
            <Button type="button" variant="ghost" size="icon" className="h-8 w-8 shrink-0"
              onClick={() => golesArr.remove(i)}>
              <X className="w-3.5 h-3.5" />
            </Button>
          </div>
        ))}
      </div>

      {/* Amarillas */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs text-amber-400">Amarillas</Label>
          <Button type="button" variant="ghost" size="sm"
            className="h-6 text-xs gap-1 text-amber-400 hover:text-amber-300"
            onClick={() => amarillasArr.append({ name: "" })}>
            <Plus className="w-3 h-3" /> Agregar
          </Button>
        </div>
        {amarillasArr.fields.map((field, i) => (
          <div key={field.id} className="flex gap-2 items-center">
            <Input placeholder="Jugador" list={listId} autoComplete="off"
              className="flex-1 border-amber-500/30 focus-visible:ring-amber-500/30"
              {...register(`${prefixAma}.${i}.name` as any)} />
            <Button type="button" variant="ghost" size="icon" className="h-8 w-8 shrink-0"
              onClick={() => amarillasArr.remove(i)}>
              <X className="w-3.5 h-3.5" />
            </Button>
          </div>
        ))}
      </div>

      {/* Rojas */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs text-destructive">Tarjetas Rojas</Label>
          <Button type="button" variant="ghost" size="sm"
            className="h-6 text-xs gap-1 text-destructive hover:text-destructive/80"
            onClick={() => rojasArr.append({ name: "", tipo: "directa" })}>
            <Plus className="w-3 h-3" /> Agregar
          </Button>
        </div>
        {rojasArr.fields.map((field, i) => {
          const tipoVal = watch(`${prefixRoja}.${i}.tipo`);
          return (
            <div key={field.id} className="flex gap-2 items-center">
              <Input placeholder="Jugador" list={listId} autoComplete="off"
                className="flex-1 border-destructive/30 focus-visible:ring-destructive/30"
                {...register(`${prefixRoja}.${i}.name` as any)} />
              <div className="flex gap-1 shrink-0">
                {(["directa", "segunda_amarilla"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setValue(`${prefixRoja}.${i}.tipo`, t)}
                    className={`text-[10px] px-2 py-1 rounded border font-medium transition-all ${
                      tipoVal === t
                        ? "bg-destructive/20 border-destructive/60 text-destructive"
                        : "bg-muted/30 border-border/40 text-muted-foreground"
                    }`}
                  >
                    {t === "directa" ? "Directa" : "2ª Amarilla"}
                  </button>
                ))}
              </div>
              <Button type="button" variant="ghost" size="icon" className="h-8 w-8 shrink-0"
                onClick={() => rojasArr.remove(i)}>
                <X className="w-3.5 h-3.5" />
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function AdminResultado() {
  const { secret } = useAdmin();
  const [loading, setLoading] = useState(false);
  const [suspendiendo, setSuspendiendo] = useState(false);
  const [params] = useSearchParams();
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [jugadoresLocal, setJugadoresLocal] = useState<string[]>([]);
  const [jugadoresVisita, setJugadoresVisita] = useState<string[]>([]);

  // Valores iniciales desde el link "Cargar" del Inicio (partido suspendido)
  const jornadaParam = Number(params.get("jornada")) || 1;

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      torneo: params.get("torneo") === "torneo35" ? "torneo35" : "torneo40",
      jornada: jornadaParam,
      jornadaLabel: `Jornada ${jornadaParam}`,
      localNombre: params.get("local") ?? "",
      localGoles: 0,
      golesLocal: [],
      amarillasLocal: [],
      rojasLocal: [],
      visitaNombre: params.get("visita") ?? "",
      visitaGoles: 0,
      golesVisita: [],
      amarillasVisita: [],
      rojasVisita: [],
    },
  });

  const { register, handleSubmit, watch, setValue, reset } = form;

  const golesLocalArr    = useFieldArray({ control: form.control, name: "golesLocal" });
  const amarillasLocalArr = useFieldArray({ control: form.control, name: "amarillasLocal" });
  const rojasLocalArr    = useFieldArray({ control: form.control, name: "rojasLocal" });
  const golesVisitaArr   = useFieldArray({ control: form.control, name: "golesVisita" });
  const amarillasVisitaArr = useFieldArray({ control: form.control, name: "amarillasVisita" });
  const rojasVisitaArr   = useFieldArray({ control: form.control, name: "rojasVisita" });

  const torneo = watch("torneo");
  const localNombre = watch("localNombre");
  const visitaNombre = watch("visitaNombre");

  useEffect(() => {
    adminFetch(secret, `/equipos/${torneo}`)
      .then((d) => setEquipos(d.equipos))
      .catch(() => setEquipos([]));
  }, [torneo, secret]);

  useEffect(() => {
    const cargar = (equipo: string, set: (j: string[]) => void) => {
      if (!equipo) return set([]);
      adminFetch(secret, `/jugadores/${torneo}?equipo=${encodeURIComponent(equipo)}`)
        .then((d) => set(d.jugadores))
        .catch(() => set([]));
    };
    cargar(localNombre, setJugadoresLocal);
    cargar(visitaNombre, setJugadoresVisita);
  }, [torneo, localNombre, visitaNombre, secret]);

  const marcarSuspendido = async () => {
    const { torneo, jornada, jornadaLabel, localNombre, visitaNombre } = form.getValues();
    if (!localNombre || !visitaNombre) return toast.error("Elige los dos equipos");
    if (localNombre === visitaNombre) return toast.error("Local y visita no pueden ser el mismo equipo");
    setSuspendiendo(true);
    try {
      await adminFetch(secret, "/suspendido", {
        method: "POST",
        body: JSON.stringify({ torneo, jornada: Number(jornada), jornadaLabel, localNombre, visitaNombre }),
      });
      toast.success(`Suspendido: ${localNombre} vs ${visitaNombre} (${jornadaLabel})`);
      setValue("localNombre", "");
      setValue("visitaNombre", "");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSuspendiendo(false);
    }
  };

  const onSubmit = async (data: FormValues) => {
    if (data.localNombre === data.visitaNombre)
      return toast.error("Local y visita no pueden ser el mismo equipo");
    const sumaLocal = data.golesLocal.reduce((n, g) => n + Number(g.goals), 0);
    const sumaVisita = data.golesVisita.reduce((n, g) => n + Number(g.goals), 0);
    if (sumaLocal > data.localGoles || sumaVisita > data.visitaGoles)
      return toast.error("Hay más goles en los goleadores que en el marcador");
    setLoading(true);
    try {
      await adminFetch(secret, "/resultado", {
        method: "POST",
        body: JSON.stringify({
          ...data,
          golesLocal:      data.golesLocal.map((g) => ({ name: g.name, goals: g.goals })),
          golesVisita:     data.golesVisita.map((g) => ({ name: g.name, goals: g.goals })),
          amarillasLocal:  data.amarillasLocal.map((a) => a.name),
          amarillasVisita: data.amarillasVisita.map((a) => a.name),
          rojasLocal:      data.rojasLocal,
          rojasVisita:     data.rojasVisita,
        }),
      });
      toast.success(
        `${data.localNombre} ${data.localGoles} – ${data.visitaGoles} ${data.visitaNombre}`
      );
      reset({
        torneo: data.torneo,
        jornada: data.jornada,
        jornadaLabel: data.jornadaLabel,
        localNombre: "",
        localGoles: 0,
        golesLocal: [],
        amarillasLocal: [],
        rojasLocal: [],
        visitaNombre: "",
        visitaGoles: 0,
        golesVisita: [],
        amarillasVisita: [],
        rojasVisita: [],
      });
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Registrar Resultado</h1>
        <p className="text-sm text-muted-foreground mt-1">Temporada regular</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Torneo + Jornada */}
        <div className="bg-gradient-card border border-border/50 rounded-xl p-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Torneo</Label>
              <Select
                value={torneo}
                onValueChange={(v) => {
                  setValue("torneo", v as any);
                  setValue("localNombre", "");
                  setValue("visitaNombre", "");
                }}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="torneo40">Liga +40</SelectItem>
                  <SelectItem value="torneo35">Liga +35</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Número de jornada</Label>
              <Input
                type="number"
                min={1}
                {...register("jornada")}
                onChange={(e) => {
                  register("jornada").onChange(e);
                  setValue("jornadaLabel", `Jornada ${e.target.value}`);
                }}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Etiqueta</Label>
            <Input placeholder="Ej: Jornada 10 / Fecha 10" {...register("jornadaLabel")} />
          </div>
        </div>

        <TeamSection
          label="Local"
          campoNombre="localNombre"
          equipos={equipos}
          jugadores={jugadoresLocal}
          golesReg={register("localGoles")}
          golesArr={golesLocalArr}
          amarillasArr={amarillasLocalArr}
          rojasArr={rojasLocalArr}
          register={register}
          prefix="golesLocal"
          prefixAma="amarillasLocal"
          prefixRoja="rojasLocal"
          watch={watch}
          setValue={setValue}
        />

        <TeamSection
          label="Visita"
          campoNombre="visitaNombre"
          equipos={equipos}
          jugadores={jugadoresVisita}
          golesReg={register("visitaGoles")}
          golesArr={golesVisitaArr}
          amarillasArr={amarillasVisitaArr}
          rojasArr={rojasVisitaArr}
          register={register}
          prefix="golesVisita"
          prefixAma="amarillasVisita"
          prefixRoja="rojasVisita"
          watch={watch}
          setValue={setValue}
        />

        <p className="text-[11px] text-muted-foreground">
          Si un goleador no aparece (autogol), deja el gol solo en el marcador. Si el partido ya estaba cargado
          o suspendido en esa jornada, se actualiza.
        </p>

        <div className="grid grid-cols-[1fr_auto] gap-2">
          <Button type="submit" disabled={loading || suspendiendo}>
            <Send className="w-4 h-4 mr-2" />
            {loading ? "Registrando..." : "Registrar Resultado"}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="border-amber-500/40 text-amber-400 hover:bg-amber-500/10 hover:text-amber-300"
            disabled={loading || suspendiendo}
            onClick={marcarSuspendido}
          >
            <AlertTriangle className="w-4 h-4 mr-2" />
            {suspendiendo ? "..." : "Suspendido"}
          </Button>
        </div>
      </form>
    </div>
  );
}
