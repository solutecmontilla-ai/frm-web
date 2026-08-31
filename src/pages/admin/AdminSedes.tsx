import { useEffect, useState } from "react";
import { useAdmin } from "@/contexts/AdminContext";
import { adminFetch } from "@/lib/adminApi";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapPin, Plus, Trash2, ExternalLink, Save, X } from "lucide-react";

interface Sede {
  id: number;
  nombre: string;
  maps_url: string | null;
}

export default function AdminSedes() {
  const { secret } = useAdmin();
  const [sedes, setSedes] = useState<Sede[]>([]);
  const [loading, setLoading] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState("");
  const [nuevaUrl, setNuevaUrl] = useState("");
  const [editId, setEditId] = useState<number | null>(null);
  const [editNombre, setEditNombre] = useState("");
  const [editUrl, setEditUrl] = useState("");

  async function cargar() {
    setLoading(true);
    try {
      const data = await adminFetch(secret, "/sedes");
      setSedes(data.sedes);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { cargar(); }, []);

  async function crear() {
    if (!nuevoNombre.trim()) return;
    try {
      await adminFetch(secret, "/sedes", {
        method: "POST",
        body: JSON.stringify({ nombre: nuevoNombre.trim(), mapsUrl: nuevaUrl.trim() || null }),
      });
      toast.success("Sede creada");
      setNuevoNombre("");
      setNuevaUrl("");
      cargar();
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  async function guardarEdicion(id: number) {
    try {
      await adminFetch(secret, `/sedes/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ nombre: editNombre.trim(), mapsUrl: editUrl.trim() || null }),
      });
      toast.success("Sede actualizada");
      setEditId(null);
      cargar();
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  async function eliminar(id: number, nombre: string) {
    if (!confirm(`¿Eliminar la sede "${nombre}"?`)) return;
    try {
      await adminFetch(secret, `/sedes/${id}`, { method: "DELETE" });
      toast.success("Sede eliminada");
      cargar();
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  function iniciarEdicion(s: Sede) {
    setEditId(s.id);
    setEditNombre(s.nombre);
    setEditUrl(s.maps_url ?? "");
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Sedes</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Canchas disponibles para programar partidos
        </p>
      </div>

      {/* Crear nueva */}
      <div className="bg-gradient-card border border-border/50 rounded-xl p-5 space-y-4">
        <h3 className="text-xs font-bold text-primary uppercase tracking-widest font-display">
          Nueva Sede
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-3">
          <div className="space-y-1.5">
            <Label>Nombre</Label>
            <Input
              placeholder="Ej: La Trinidad"
              value={nuevoNombre}
              onChange={(e) => setNuevoNombre(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && crear()}
            />
          </div>
          <div className="space-y-1.5">
            <Label>URL Google Maps</Label>
            <Input
              placeholder="https://maps.google.com/..."
              value={nuevaUrl}
              onChange={(e) => setNuevaUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && crear()}
            />
          </div>
          <div className="flex items-end">
            <Button onClick={crear} disabled={!nuevoNombre.trim()}>
              <Plus className="w-4 h-4 mr-1.5" /> Crear
            </Button>
          </div>
        </div>
      </div>

      {/* Listado */}
      <div className="bg-gradient-card border border-border/50 rounded-xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-primary uppercase tracking-widest font-display">
            Sedes registradas
          </h3>
          <span className="text-xs text-muted-foreground">{sedes.length} sede(s)</span>
        </div>

        {loading && (
          <p className="text-sm text-muted-foreground text-center py-3">Cargando...</p>
        )}

        {!loading && sedes.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-3">
            Aún no hay sedes registradas.
          </p>
        )}

        {!loading && sedes.map((s) => (
          <div key={s.id} className="bg-background/40 border border-border/30 rounded-lg p-3">
            {editId === s.id ? (
              <div className="space-y-2">
                <Input
                  value={editNombre}
                  onChange={(e) => setEditNombre(e.target.value)}
                  placeholder="Nombre"
                />
                <Input
                  value={editUrl}
                  onChange={(e) => setEditUrl(e.target.value)}
                  placeholder="URL Maps"
                />
                <div className="flex gap-2 justify-end">
                  <Button size="sm" variant="ghost" onClick={() => setEditId(null)}>
                    <X className="w-3.5 h-3.5 mr-1" /> Cancelar
                  </Button>
                  <Button size="sm" onClick={() => guardarEdicion(s.id)}>
                    <Save className="w-3.5 h-3.5 mr-1" /> Guardar
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <MapPin className="w-4 h-4 text-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{s.nombre}</p>
                  {s.maps_url ? (
                    <a
                      href={s.maps_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline inline-flex items-center gap-1"
                    >
                      Ver en Maps <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : (
                    <p className="text-xs text-muted-foreground">Sin URL Maps</p>
                  )}
                </div>
                <Button size="sm" variant="ghost" onClick={() => iniciarEdicion(s)}>
                  Editar
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={() => eliminar(s.id, s.nombre)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
