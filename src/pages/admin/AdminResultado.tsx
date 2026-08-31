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
import { Plus, X, Send } from "lucide-react";
import { useState } from "react";
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

interface TeamSectionProps {
  label: string;
  nombreReg: ReturnType<UseFormRegister<FormValues>>;
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
  nombreReg,
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
  return (
    <div className="bg-gradient-card border border-border/50 rounded-xl p-4 space-y-4">
      <h3 className="text-xs font-bold text-primary uppercase tracking-widest font-display">
        {label}
      </h3>

      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-2 space-y-1.5">
          <Label>Equipo</Label>
          <Input placeholder="Nombre del equipo" {...nombreReg} />
        </div>
        <div className="space-y-1.5">
          <Label>Goles</Label>
          <Input type="number" min={0} {...golesReg} />
        </div>
      </div>

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
            <Input placeholder="Jugador" className="flex-1"
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
            <Input placeholder="Jugador"
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
              <Input placeholder="Jugador"
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

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      torneo: "torneo40",
      jornada: 1,
      jornadaLabel: "Jornada 1",
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
  const jornada = watch("jornada");

  const onSubmit = async (data: FormValues) => {
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
              <Select value={torneo} onValueChange={(v) => setValue("torneo", v as any)}>
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
          nombreReg={register("localNombre")}
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
          nombreReg={register("visitaNombre")}
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

        <Button type="submit" className="w-full" disabled={loading}>
          <Send className="w-4 h-4 mr-2" />
          {loading ? "Registrando..." : "Registrar Resultado"}
        </Button>
      </form>
    </div>
  );
}
