import { useEffect, useRef, useState } from "react";
import { useAdmin } from "@/contexts/AdminContext";
import { adminFetch, adminUploadLogo } from "@/lib/adminApi";
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
import { Plus, Save, RefreshCw, ImagePlus } from "lucide-react";

interface Equipo {
  id: number;
  nombre: string;
  slug: string;
  seed: number | null;
  logo_url: string | null;
}

type Torneo = "torneo40" | "torneo35";

export default function AdminEquipos() {
  const { secret } = useAdmin();
  const [torneo, setTorneo]     = useState<Torneo>("torneo40");
  const [equipos, setEquipos]   = useState<Equipo[]>([]);
  const [loading, setLoading]   = useState(false);
  const [seeds, setSeeds]       = useState<Record<number, string>>({});

  // Nuevo equipo
  const [nuevoNombre, setNuevoNombre] = useState("");
  const [nuevoSeed, setNuevoSeed]     = useState("");
  const [saving, setSaving]           = useState(false);
  const [uploadingId, setUploadingId] = useState<number | null>(null);
  const fileInputs                    = useRef<Record<number, HTMLInputElement | null>>({});

  const fetchEquipos = async () => {
    setLoading(true);
    try {
      const data = await adminFetch(secret, `/equipos/${torneo}?all=1`);
      setEquipos(data.equipos);
      const seedMap: Record<number, string> = {};
      data.equipos.forEach((e: Equipo) => {
        seedMap[e.id] = e.seed !== null ? String(e.seed) : "";
      });
      setSeeds(seedMap);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchEquipos(); }, [torneo]);

  const handleAgregar = async () => {
    if (!nuevoNombre.trim()) return;
    setSaving(true);
    try {
      const res = await adminFetch(secret, "/equipo", {
        method: "POST",
        body: JSON.stringify({
          torneo,
          nombre: nuevoNombre.trim(),
          seed: nuevoSeed ? Number(nuevoSeed) : null,
        }),
      });
      toast.success(
        res.action === "created"
          ? `Equipo "${nuevoNombre}" creado`
          : `Seed de "${nuevoNombre}" actualizado`
      );
      setNuevoNombre("");
      setNuevoSeed("");
      fetchEquipos();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleUploadLogo = async (equipo: Equipo, file: File) => {
    setUploadingId(equipo.id);
    try {
      const up = await adminUploadLogo(secret, file);
      await adminFetch(secret, "/equipo", {
        method: "POST",
        body: JSON.stringify({
          torneo,
          nombre: equipo.nombre,
          seed: equipo.seed,
          logoUrl: up.url,
        }),
      });
      toast.success(`Logo de ${equipo.nombre} actualizado`);
      fetchEquipos();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setUploadingId(null);
      if (fileInputs.current[equipo.id]) fileInputs.current[equipo.id]!.value = "";
    }
  };

  const handleUpdateSeed = async (equipo: Equipo) => {
    const seed = seeds[equipo.id];
    try {
      await adminFetch(secret, "/equipo", {
        method: "POST",
        body: JSON.stringify({
          torneo,
          nombre: equipo.nombre,
          seed: seed !== "" ? Number(seed) : null,
        }),
      });
      toast.success(`Seed de ${equipo.nombre} actualizado`);
      fetchEquipos();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Equipos</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Agrega equipos y configura sus seeds para el playoff
          </p>
        </div>
        <Button variant="ghost" size="icon" onClick={fetchEquipos} disabled={loading}>
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {/* Selector torneo */}
      <div className="bg-gradient-card border border-border/50 rounded-xl p-4">
        <div className="space-y-1.5">
          <Label>Torneo</Label>
          <Select value={torneo} onValueChange={(v) => setTorneo(v as Torneo)}>
            <SelectTrigger className="max-w-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="torneo40">Liga +40</SelectItem>
              <SelectItem value="torneo35">Liga +35</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Agregar equipo */}
      <div className="bg-gradient-card border border-border/50 rounded-xl p-4 space-y-4">
        <h3 className="text-xs font-bold text-primary uppercase tracking-widest font-display">
          Agregar / Actualizar Equipo
        </h3>
        <div className="grid grid-cols-[1fr_100px_auto] gap-3 items-end">
          <div className="space-y-1.5">
            <Label>Nombre del equipo</Label>
            <Input
              placeholder="Ej: Real Maracay"
              value={nuevoNombre}
              onChange={(e) => setNuevoNombre(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAgregar()}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Seed</Label>
            <Input
              type="number"
              min={1}
              placeholder="—"
              value={nuevoSeed}
              onChange={(e) => setNuevoSeed(e.target.value)}
            />
          </div>
          <Button
            onClick={handleAgregar}
            disabled={saving || !nuevoNombre.trim()}
            className="mb-0"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            {saving ? "..." : "Agregar"}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Si el equipo ya existe, actualiza su seed. El seed determina el orden en el bracket del playoff.
        </p>
      </div>

      {/* Lista de equipos */}
      <div className="bg-gradient-card border border-border/50 rounded-xl p-4 space-y-3">
        <h3 className="text-xs font-bold text-primary uppercase tracking-widest font-display mb-2">
          Equipos Registrados ({equipos.length})
        </h3>

        {loading && (
          <div className="text-center py-6 text-muted-foreground text-sm">Cargando...</div>
        )}

        {!loading && equipos.length === 0 && (
          <div className="text-center py-6 text-muted-foreground text-sm">
            No hay equipos registrados para este torneo.
          </div>
        )}

        {!loading && equipos.map((eq) => (
          <div
            key={eq.id}
            className="flex items-center gap-3 py-2 border-b border-border/30 last:border-0"
          >
            {/* Logo preview */}
            <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center overflow-hidden shrink-0 border border-border/30">
              {eq.logo_url ? (
                <img
                  src={eq.logo_url}
                  alt={eq.nombre}
                  className="w-full h-full object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }}
                />
              ) : (
                <ImagePlus className="w-4 h-4 text-muted-foreground" />
              )}
            </div>

            {/* Seed badge */}
            <div className="w-7 h-7 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
              <span className="text-[11px] font-bold text-primary">
                {eq.seed ?? "—"}
              </span>
            </div>

            {/* Nombre */}
            <span className="flex-1 text-sm font-medium text-foreground truncate">
              {eq.nombre}
            </span>

            {/* Upload logo */}
            <div className="shrink-0">
              <input
                ref={(el) => { fileInputs.current[eq.id] = el; }}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleUploadLogo(eq, f);
                }}
              />
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => fileInputs.current[eq.id]?.click()}
                disabled={uploadingId === eq.id}
                title={eq.logo_url ? "Reemplazar logo" : "Subir logo"}
              >
                {uploadingId === eq.id ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <ImagePlus className="w-3.5 h-3.5" />
                )}
              </Button>
            </div>

            {/* Edit seed inline */}
            <div className="flex items-center gap-2 shrink-0">
              <Input
                type="number"
                min={1}
                placeholder="Seed"
                className="w-20 h-8 text-xs"
                value={seeds[eq.id] ?? ""}
                onChange={(e) =>
                  setSeeds((prev) => ({ ...prev, [eq.id]: e.target.value }))
                }
              />
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => handleUpdateSeed(eq)}
                title="Guardar seed"
              >
                <Save className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
