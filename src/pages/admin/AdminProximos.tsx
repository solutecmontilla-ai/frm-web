import { useEffect, useState } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
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
import { Plus, X, Send, Trash2 } from "lucide-react";

const matchSchema = z.object({
  localNombre:  z.string().min(1, "Requerido"),
  visitaNombre: z.string().min(1, "Requerido"),
  hora:         z.string().min(1, "Requerido"),
  cancha:       z.string().min(1, "Requerido"),
});

const schema = z.object({
  torneo:   z.enum(["torneo40", "torneo35"]),
  dia:      z.string().min(1, "Requerido"),
  partidos: z.array(matchSchema).min(1),
});

type FormValues = z.infer<typeof schema>;

interface Equipo { id: number; nombre: string; }
interface Sede   { id: number; nombre: string; maps_url: string | null; }

export default function AdminProximos() {
  const { secret } = useAdmin();
  const [loading, setLoading]   = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [equipos, setEquipos]   = useState<Equipo[]>([]);
  const [sedes, setSedes]       = useState<Sede[]>([]);

  const { register, handleSubmit, watch, setValue, control, reset } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      torneo:   "torneo40",
      dia:      "",
      partidos: [{ localNombre: "", visitaNombre: "", hora: "", cancha: "La Trinidad" }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "partidos" });
  const torneo = watch("torneo");

  // Cargar equipos al cambiar de torneo
  useEffect(() => {
    adminFetch(secret, `/equipos/${torneo}`)
      .then((d) => setEquipos(d.equipos))
      .catch(() => setEquipos([]));
  }, [torneo, secret]);

  // Cargar sedes una vez
  useEffect(() => {
    adminFetch(secret, "/sedes")
      .then((d) => setSedes(d.sedes))
      .catch(() => setSedes([]));
  }, [secret]);

  const onSubmit = async (data: FormValues) => {
    setLoading(true);
    try {
      const res = await adminFetch(secret, "/proximos/bulk", {
        method: "POST",
        body: JSON.stringify({
          torneo:   data.torneo,
          dia:      data.dia,
          partidos: data.partidos,
        }),
      });
      toast.success(`${res.count} partido(s) programado(s) para ${data.dia}`);
      reset({
        torneo:   data.torneo,
        dia:      "",
        partidos: [{ localNombre: "", visitaNombre: "", hora: "", cancha: data.partidos[0]?.cancha ?? "La Trinidad" }],
      });
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBorrar = async () => {
    const label = torneo === "torneo40" ? "Liga +40" : "Liga +35";
    if (!confirm(`¿Borrar todos los próximos de ${label}?`)) return;
    setDeleting(true);
    try {
      await adminFetch(secret, `/proximos/${torneo}`, { method: "DELETE" });
      toast.success(`Próximos de ${label} borrados`);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Próximos Partidos</h1>
          <p className="text-sm text-muted-foreground mt-1">Programar jornada completa</p>
        </div>
        <Button variant="destructive" size="sm" onClick={handleBorrar} disabled={deleting}>
          <Trash2 className="w-4 h-4 mr-1.5" />
          {deleting ? "Borrando..." : "Borrar todos"}
        </Button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Torneo + Día */}
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
              <Label>Día</Label>
              <Input placeholder="Ej: Sábado 10 de Mayo" {...register("dia")} />
            </div>
          </div>
        </div>

        {/* Partidos */}
        <div className="bg-gradient-card border border-border/50 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-primary uppercase tracking-widest font-display">
              Partidos
            </h3>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 text-xs gap-1"
              onClick={() => append({ localNombre: "", visitaNombre: "", hora: "", cancha: fields[0]?.cancha ?? "La Trinidad" })}
            >
              <Plus className="w-3 h-3" /> Agregar partido
            </Button>
          </div>

          {equipos.length === 0 && (
            <p className="text-xs text-amber-400">
              No hay equipos cargados para este torneo. Crea equipos en /admin/equipos antes de programar.
            </p>
          )}
          {sedes.length === 0 && (
            <p className="text-xs text-amber-400">
              No hay sedes registradas. Crea sedes en /admin/sedes.
            </p>
          )}

          {fields.map((field, i) => (
            <div key={field.id} className="grid grid-cols-1 md:grid-cols-[1fr_1fr_110px_140px_auto] gap-2 items-end pb-3 border-b border-border/20 last:border-0">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Local</Label>
                <Controller
                  control={control}
                  name={`partidos.${i}.localNombre`}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger><SelectValue placeholder="Equipo local" /></SelectTrigger>
                      <SelectContent>
                        {equipos.map((eq) => (
                          <SelectItem key={eq.id} value={eq.nombre}>{eq.nombre}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Visita</Label>
                <Controller
                  control={control}
                  name={`partidos.${i}.visitaNombre`}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger><SelectValue placeholder="Equipo visita" /></SelectTrigger>
                      <SelectContent>
                        {equipos.map((eq) => (
                          <SelectItem key={eq.id} value={eq.nombre}>{eq.nombre}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Hora</Label>
                <Input placeholder="10:00 AM" {...register(`partidos.${i}.hora`)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Sede</Label>
                <Controller
                  control={control}
                  name={`partidos.${i}.cancha`}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger><SelectValue placeholder="Sede" /></SelectTrigger>
                      <SelectContent>
                        {sedes.map((s) => (
                          <SelectItem key={s.id} value={s.nombre}>{s.nombre}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              {fields.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9"
                  onClick={() => remove(i)}
                >
                  <X className="w-3.5 h-3.5" />
                </Button>
              )}
            </div>
          ))}
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          <Send className="w-4 h-4 mr-2" />
          {loading ? "Guardando..." : "Programar Partidos"}
        </Button>
      </form>
    </div>
  );
}
