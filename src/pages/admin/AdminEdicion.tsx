import { useEffect, useRef, useState } from "react";
import { useAdmin } from "@/contexts/AdminContext";
import { adminFetch, adminUploadLogo } from "@/lib/adminApi";
import { getLogo40, getLogo35 } from "@/lib/teamLogos";
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
import { AlertTriangle, Check, ImagePlus, Plus, Trash2, X, Save } from "lucide-react";

type Torneo = "torneo40" | "torneo35";

interface Equipo {
  id: number;
  nombre: string;
  slug: string;
  seed: number | null;
  logo_url: string | null;
}

interface NuevoEquipo {
  nombre: string;
  seed: string;
  file: File | null;
  preview: string;
}

export default function AdminEdicion() {
  const { secret } = useAdmin();

  // Datos de la edición
  const [torneo, setTorneo] = useState<Torneo>("torneo40");
  const [nombre, setNombre] = useState("");
  const [numero, setNumero] = useState("10");
  const [submitting, setSubmitting] = useState(false);

  // Equipos existentes con checkboxes
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [loadingEq, setLoadingEq] = useState(false);
  const [seleccionados, setSeleccionados] = useState<Set<number>>(new Set());

  // Nuevo equipo a agregar
  const [nuevoNombre, setNuevoNombre] = useState("");
  const [nuevoSeed, setNuevoSeed] = useState("");
  const [nuevoFile, setNuevoFile] = useState<File | null>(null);
  const [nuevoPreview, setNuevoPreview] = useState("");
  const [nuevosEquipos, setNuevosEquipos] = useState<NuevoEquipo[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  // Hero (edición activa)
  const [heroEdicionId, setHeroEdicionId] = useState<number | null>(null);
  const [heroEquiposCount, setHeroEquiposCount] = useState("");
  const [heroSubtitle, setHeroSubtitle] = useState("");
  const [heroDescription, setHeroDescription] = useState("");
  const [savingHero, setSavingHero] = useState(false);
  const [savingActivos, setSavingActivos] = useState(false);

  const getLogo = torneo === "torneo40" ? getLogo40 : getLogo35;

  useEffect(() => {
    setLoadingEq(true);
    // Cargar todos los equipos del torneo + los actualmente vinculados a la edición activa
    Promise.all([
      adminFetch(secret, `/equipos/${torneo}?all=1`),
      adminFetch(secret, `/equipos/${torneo}`).catch(() => ({ equipos: [] })),
    ])
      .then(([all, activos]) => {
        setEquipos(all.equipos);
        setSeleccionados(new Set(activos.equipos.map((e: Equipo) => e.id)));
      })
      .catch(() => setEquipos([]))
      .finally(() => setLoadingEq(false));

    // Cargar hero de edición activa del torneo seleccionado
    adminFetch(secret, `/ediciones/${torneo}`)
      .then((d) => {
        const activa = d.ediciones.find((e: any) => e.activa);
        if (activa) {
          setHeroEdicionId(activa.id);
          setHeroEquiposCount(activa.equipos_count != null ? String(activa.equipos_count) : "");
          setHeroSubtitle(activa.hero_subtitle ?? "");
          setHeroDescription(activa.hero_description ?? "");
        } else {
          setHeroEdicionId(null);
        }
      })
      .catch(() => setHeroEdicionId(null));
  }, [torneo]);

  async function guardarEquiposActivos() {
    if (!heroEdicionId) {
      toast.error("No hay edición activa");
      return;
    }
    setSavingActivos(true);
    try {
      await adminFetch(secret, "/edicion-equipos", {
        method: "POST",
        body: JSON.stringify({
          edicionId: heroEdicionId,
          equipoIds: Array.from(seleccionados),
        }),
      });
      toast.success(`${seleccionados.size} equipo(s) vinculado(s) a la edición activa`);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSavingActivos(false);
    }
  }

  async function guardarHero() {
    if (!heroEdicionId) return;
    setSavingHero(true);
    try {
      await adminFetch(secret, `/edicion/${heroEdicionId}/hero`, {
        method: "PATCH",
        body: JSON.stringify({
          equiposCount: heroEquiposCount ? Number(heroEquiposCount) : null,
          heroSubtitle: heroSubtitle.trim() || null,
          heroDescription: heroDescription.trim() || null,
        }),
      });
      toast.success("Hero actualizado");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSavingHero(false);
    }
  }

  function toggleSeleccion(id: number) {
    setSeleccionados((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setNuevoFile(file);
    setNuevoPreview(file ? URL.createObjectURL(file) : "");
  }

  function agregarNuevoEquipo() {
    if (!nuevoNombre.trim()) return;
    setNuevosEquipos((prev) => [
      ...prev,
      { nombre: nuevoNombre.trim(), seed: nuevoSeed, file: nuevoFile, preview: nuevoPreview },
    ]);
    setNuevoNombre("");
    setNuevoSeed("");
    setNuevoFile(null);
    setNuevoPreview("");
    if (fileRef.current) fileRef.current.value = "";
  }

  function quitarNuevoEquipo(i: number) {
    setNuevosEquipos((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function handleSubmit() {
    if (!nombre.trim()) { toast.error("Indica el nombre de la edición"); return; }
    const numEdicion = parseInt(numero);
    if (!numEdicion || numEdicion < 1) { toast.error("Número de edición inválido"); return; }

    const label = torneo === "torneo40" ? "Liga +40" : "Liga +35";
    if (
      !confirm(
        `¿Crear "${nombre}" para ${label}?\n\nLa edición actual quedará archivada y todos los endpoints mostrarán datos de la nueva edición.`
      )
    ) return;

    setSubmitting(true);
    try {
      // 1. Crear la edición
      const res = await adminFetch(secret, "/edicion", {
        method: "POST",
        body: JSON.stringify({ torneo, nombre: nombre.trim(), numero: numEdicion }),
      });

      // 2. Crear nuevos equipos (con logo si se subió)
      const nuevosIds: number[] = [];
      for (const eq of nuevosEquipos) {
        let logoUrl: string | null = null;
        if (eq.file) {
          try {
            const up = await adminUploadLogo(secret, eq.file);
            logoUrl = up.url;
          } catch {
            toast.error(`No se pudo subir el logo de "${eq.nombre}" — equipo creado sin logo`);
          }
        }
        const eqRes = await adminFetch(secret, "/equipo", {
          method: "POST",
          body: JSON.stringify({
            torneo,
            nombre: eq.nombre,
            seed: eq.seed ? Number(eq.seed) : null,
            logoUrl,
          }),
        });
        if (eqRes.id) nuevosIds.push(eqRes.id);
      }

      // 3. Persistir equipos que continúan: existentes seleccionados + nuevos creados
      const equipoIds = [...Array.from(seleccionados), ...nuevosIds];
      await adminFetch(secret, "/edicion-equipos", {
        method: "POST",
        body: JSON.stringify({ edicionId: res.edicionId, equipoIds }),
      });

      toast.success(
        `Edición "${res.nombre}" creada (ID: ${res.edicionId}) · ${equipoIds.length} equipo(s) vinculado(s)`
      );
      setNombre("");
      setNumero(String(numEdicion + 1));
      setNuevosEquipos([]);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Nueva Edición</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Inicia una nueva temporada para el torneo
        </p>
      </div>

      {/* ── 0. Hero de la edición activa ── */}
      <div className="bg-gradient-card border border-border/50 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-primary uppercase tracking-widest font-display">
            Hero del Torneo (edición activa)
          </h3>
          {!heroEdicionId && (
            <span className="text-xs text-muted-foreground">Sin edición activa</span>
          )}
        </div>

        <div className="space-y-1.5">
          <Label>Torneo</Label>
          <Select value={torneo} onValueChange={(v) => setTorneo(v as Torneo)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="torneo40">Liga +40</SelectItem>
              <SelectItem value="torneo35">Liga +35</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-[1fr_120px] gap-3">
          <div className="space-y-1.5">
            <Label>Subtítulo</Label>
            <Input
              placeholder="Ej: Novena Edición • 2025"
              value={heroSubtitle}
              onChange={(e) => setHeroSubtitle(e.target.value)}
              disabled={!heroEdicionId}
            />
          </div>
          <div className="space-y-1.5">
            <Label># Equipos</Label>
            <Input
              type="number"
              min={0}
              placeholder="11"
              value={heroEquiposCount}
              onChange={(e) => setHeroEquiposCount(e.target.value)}
              disabled={!heroEdicionId}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>Descripción</Label>
          <Input
            placeholder="Ej: Categoría mayores de 40 años"
            value={heroDescription}
            onChange={(e) => setHeroDescription(e.target.value)}
            disabled={!heroEdicionId}
          />
        </div>

        <Button
          type="button"
          onClick={guardarHero}
          disabled={!heroEdicionId || savingHero}
          className="w-full"
          variant="outline"
        >
          <Save className="w-4 h-4 mr-2" />
          {savingHero ? "Guardando..." : "Guardar hero"}
        </Button>
      </div>

      {/* ── 1. Datos de la edición ── */}
      <div className="bg-gradient-card border border-border/50 rounded-xl p-5 space-y-4">
        <h3 className="text-xs font-bold text-primary uppercase tracking-widest font-display">
          Crear Nueva Edición (Torneo: {torneo === "torneo40" ? "Liga +40" : "Liga +35"})
        </h3>

        <div className="grid grid-cols-[1fr_120px] gap-3">
          <div className="space-y-1.5">
            <Label>Nombre de la edición</Label>
            <Input
              placeholder="Ej: 10ma Edición"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Número</Label>
            <Input
              type="number"
              min={1}
              value={numero}
              onChange={(e) => setNumero(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* ── 2. Equipos que continúan ── */}
      <div className="bg-gradient-card border border-border/50 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-primary uppercase tracking-widest font-display">
            Equipos en la Edición Activa
          </h3>
          <span className="text-xs text-muted-foreground">
            {seleccionados.size} / {equipos.length} seleccionados
          </span>
        </div>

        {loadingEq && (
          <p className="text-sm text-muted-foreground text-center py-3">Cargando equipos...</p>
        )}

        {!loadingEq && equipos.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-3">
            No hay equipos registrados para este torneo.
          </p>
        )}

        {!loadingEq && equipos.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {equipos.map((eq) => {
              const checked = seleccionados.has(eq.id);
              const logo = eq.logo_url ?? getLogo(eq.nombre);
              return (
                <button
                  key={eq.id}
                  type="button"
                  onClick={() => toggleSeleccion(eq.id)}
                  className={`flex items-center gap-2 p-2.5 rounded-lg border text-left transition-colors ${
                    checked
                      ? "border-primary/50 bg-primary/10 text-foreground"
                      : "border-border/30 bg-background/30 text-muted-foreground opacity-50"
                  }`}
                >
                  <img
                    src={logo}
                    alt={eq.nombre}
                    className="w-7 h-7 rounded-full object-cover shrink-0 bg-muted"
                    onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }}
                  />
                  <span className="text-xs font-medium leading-tight flex-1 truncate">
                    {eq.nombre}
                  </span>
                  <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                    checked ? "bg-primary border-primary" : "border-border"
                  }`}>
                    {checked && <Check className="w-2.5 h-2.5 text-primary-foreground" />}
                  </div>
                </button>
              );
            })}
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          Marca los equipos que participan en la edición activa. Aparecerán en la tabla pública con 0-0-0-0 hasta que jueguen.
        </p>

        <Button
          type="button"
          onClick={guardarEquiposActivos}
          disabled={!heroEdicionId || savingActivos}
          className="w-full"
          variant="outline"
        >
          <Save className="w-4 h-4 mr-2" />
          {savingActivos ? "Guardando..." : "Guardar equipos de la edición activa"}
        </Button>
      </div>

      {/* ── 3. Agregar equipos nuevos ── */}
      <div className="bg-gradient-card border border-border/50 rounded-xl p-5 space-y-4">
        <h3 className="text-xs font-bold text-primary uppercase tracking-widest font-display">
          Agregar Equipos Nuevos
        </h3>

        <div className="grid grid-cols-[1fr_80px] gap-3">
          <div className="space-y-1.5">
            <Label>Nombre del equipo</Label>
            <Input
              placeholder="Ej: Atlético Maracay"
              value={nuevoNombre}
              onChange={(e) => setNuevoNombre(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && agregarNuevoEquipo()}
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
        </div>

        {/* Logo upload */}
        <div className="space-y-2">
          <Label>Logo del equipo</Label>
          <div className="flex items-center gap-3">
            {nuevoPreview ? (
              <div className="relative w-12 h-12 shrink-0">
                <img
                  src={nuevoPreview}
                  alt="preview"
                  className="w-12 h-12 rounded-full object-cover border border-border"
                />
                <button
                  type="button"
                  onClick={() => { setNuevoFile(null); setNuevoPreview(""); if (fileRef.current) fileRef.current.value = ""; }}
                  className="absolute -top-1 -right-1 w-4 h-4 bg-destructive rounded-full flex items-center justify-center"
                >
                  <X className="w-2.5 h-2.5 text-white" />
                </button>
              </div>
            ) : (
              <div className="w-12 h-12 rounded-full border border-dashed border-border flex items-center justify-center shrink-0 bg-muted/20">
                <ImagePlus className="w-5 h-5 text-muted-foreground" />
              </div>
            )}
            <div className="flex-1">
              <input
                ref={fileRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={handleFileChange}
                className="block w-full text-xs text-muted-foreground file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer"
              />
              <p className="text-[11px] text-muted-foreground mt-1">PNG, JPG o WEBP · máx 5 MB</p>
            </div>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={agregarNuevoEquipo}
          disabled={!nuevoNombre.trim()}
          className="w-full"
        >
          <Plus className="w-4 h-4 mr-2" />
          Agregar a la lista
        </Button>

        {/* Lista de nuevos equipos pendientes */}
        {nuevosEquipos.length > 0 && (
          <div className="space-y-2 pt-1">
            <p className="text-xs text-muted-foreground font-medium">
              Se crearán al guardar ({nuevosEquipos.length}):
            </p>
            {nuevosEquipos.map((eq, i) => (
              <div
                key={i}
                className="flex items-center gap-3 py-2 px-3 rounded-lg bg-background/40 border border-border/30"
              >
                {eq.preview ? (
                  <img src={eq.preview} alt={eq.nombre} className="w-8 h-8 rounded-full object-cover shrink-0" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                    <span className="text-[10px] font-bold text-muted-foreground">
                      {eq.nombre.slice(0, 2).toUpperCase()}
                    </span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{eq.nombre}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {eq.seed ? `Seed ${eq.seed}` : "Sin seed"} · {eq.file ? "Con logo" : "Sin logo"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => quitarNuevoEquipo(i)}
                  className="text-muted-foreground hover:text-destructive transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Advertencia ── */}
      <div className="flex gap-3 bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 text-sm text-amber-300">
        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
        <span>
          Al crear una nueva edición la tabla, goleadores y resultados actuales quedarán
          archivados. Los próximos partidos deberán volver a programarse.
        </span>
      </div>

      <Button className="w-full" onClick={handleSubmit} disabled={submitting}>
        <Plus className="w-4 h-4 mr-2" />
        {submitting ? "Creando..." : "Crear Nueva Edición"}
      </Button>
    </div>
  );
}
