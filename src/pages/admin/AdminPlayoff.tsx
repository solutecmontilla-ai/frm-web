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
import { Switch } from "@/components/ui/switch";
import { Send } from "lucide-react";
import { useState } from "react";

const schema = z.object({
  torneo: z.enum(["torneo40", "torneo35"]),
  fase: z.enum(["QF", "SF", "F", "TP"]),
  localNombre: z.string().min(1, "Requerido"),
  localGoles: z.coerce.number().min(0),
  visitaNombre: z.string().min(1, "Requerido"),
  visitaGoles: z.coerce.number().min(0),
  penales: z.boolean(),
  penalesLocal: z.coerce.number().min(0).optional(),
  penalesVisita: z.coerce.number().min(0).optional(),
});

type FormValues = z.infer<typeof schema>;

const FASES = [
  { value: "QF", label: "Cuartos de Final" },
  { value: "SF", label: "Semifinal" },
  { value: "TP", label: "Tercer Lugar" },
  { value: "F",  label: "Gran Final" },
];

export default function AdminPlayoff() {
  const { secret } = useAdmin();
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, watch, setValue, reset } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      torneo: "torneo40",
      fase: "QF",
      localNombre: "",
      localGoles: 0,
      visitaNombre: "",
      visitaGoles: 0,
      penales: false,
    },
  });

  const torneo = watch("torneo");
  const fase = watch("fase");
  const penales = watch("penales");

  const onSubmit = async (data: FormValues) => {
    setLoading(true);
    try {
      const res = await adminFetch(secret, "/playoff", {
        method: "POST",
        body: JSON.stringify({
          torneo: data.torneo,
          fase: data.fase,
          localNombre: data.localNombre,
          localGoles: data.localGoles,
          visitaNombre: data.visitaNombre,
          visitaGoles: data.visitaGoles,
          penalesLocal:  data.penales ? data.penalesLocal  : null,
          penalesVisita: data.penales ? data.penalesVisita : null,
        }),
      });
      const faseLab = FASES.find((f) => f.value === data.fase)?.label ?? data.fase;
      toast.success(
        `${faseLab}: ${data.localNombre} ${data.localGoles}–${data.visitaGoles} ${data.visitaNombre}${data.penales ? ` (pen ${data.penalesLocal}-${data.penalesVisita})` : ""} → Gana ${res.ganador}`
      );
      reset({ torneo: data.torneo, fase: data.fase, localNombre: "", localGoles: 0, visitaNombre: "", visitaGoles: 0, penales: false });
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Resultado Playoff</h1>
        <p className="text-sm text-muted-foreground mt-1">Cuartos, Semifinales, 3er Lugar y Final</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Torneo + Fase */}
        <div className="bg-gradient-card border border-border/50 rounded-xl p-4">
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
              <Label>Fase</Label>
              <Select value={fase} onValueChange={(v) => setValue("fase", v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {FASES.map((f) => (
                    <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Local */}
        <div className="bg-gradient-card border border-border/50 rounded-xl p-4 space-y-3">
          <h3 className="text-xs font-bold text-primary uppercase tracking-widest font-display">Local</h3>
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2 space-y-1.5">
              <Label>Equipo</Label>
              <Input placeholder="Nombre" {...register("localNombre")} />
            </div>
            <div className="space-y-1.5">
              <Label>Goles</Label>
              <Input type="number" min={0} {...register("localGoles")} />
            </div>
          </div>
        </div>

        {/* Visita */}
        <div className="bg-gradient-card border border-border/50 rounded-xl p-4 space-y-3">
          <h3 className="text-xs font-bold text-primary uppercase tracking-widest font-display">Visita</h3>
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2 space-y-1.5">
              <Label>Equipo</Label>
              <Input placeholder="Nombre" {...register("visitaNombre")} />
            </div>
            <div className="space-y-1.5">
              <Label>Goles</Label>
              <Input type="number" min={0} {...register("visitaGoles")} />
            </div>
          </div>
        </div>

        {/* Penales */}
        <div className="bg-gradient-card border border-border/50 rounded-xl p-4 space-y-4">
          <div className="flex items-center justify-between">
            <Label>Definición por penales</Label>
            <Switch
              checked={penales}
              onCheckedChange={(v) => setValue("penales", v)}
            />
          </div>
          {penales && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Penales Local</Label>
                <Input type="number" min={0} {...register("penalesLocal")} />
              </div>
              <div className="space-y-1.5">
                <Label>Penales Visita</Label>
                <Input type="number" min={0} {...register("penalesVisita")} />
              </div>
            </div>
          )}
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          <Send className="w-4 h-4 mr-2" />
          {loading ? "Registrando..." : "Registrar Playoff"}
        </Button>
      </form>
    </div>
  );
}
