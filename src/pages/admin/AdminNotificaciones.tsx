import { useEffect, useState } from "react";
import { useAdmin } from "@/contexts/AdminContext";
import { adminFetch } from "@/lib/adminApi";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Bell, Send } from "lucide-react";
import ligaLogo from "@/assets/liga-frm-logo.png";

const PLANTILLAS = [
  { label: "Recordatorio", title: "📢 Liga FRM — Recordatorio", body: "" },
  { label: "Resultados al día", title: "⚽ Liga FRM", body: "Todos los resultados están al día. ¡Gracias por participar en nuestro torneo!" },
  { label: "Partido suspendido", title: "⚠️ Liga FRM — Partido suspendido", body: "" },
  { label: "Programación", title: "📅 Liga FRM — Nueva programación", body: "Ya está publicada la programación de la próxima jornada." },
];

const DESTINOS = [
  { value: "/", label: "Inicio" },
  { value: "/torneo-40", label: "Liga +40" },
  { value: "/torneo-35", label: "Liga +35" },
];

const MAX_BODY = 180;

export default function AdminNotificaciones() {
  const { secret } = useAdmin();
  const [title, setTitle] = useState(PLANTILLAS[0].title);
  const [body, setBody] = useState("");
  const [url, setUrl] = useState("/");
  const [subs, setSubs] = useState<number | null>(null);
  const [confirm, setConfirm] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    adminFetch(secret, "/resumen").then((d) => setSubs(d.suscriptores)).catch(() => setSubs(null));
  }, [secret]);

  const valido = title.trim().length > 0 && body.trim().length > 0;

  const enviar = async () => {
    setSending(true);
    try {
      const res = await adminFetch(secret, "/notificar", {
        method: "POST",
        body: JSON.stringify({ title, body, url }),
      });
      setSubs(res.suscriptores);
      toast.success(`Notificación enviada a ${res.suscriptores} suscritos`);
      setBody("");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSending(false);
      setConfirm(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Notificaciones</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Envía un aviso a todos los que activaron las notificaciones
          {subs !== null && <> · <span className="text-primary font-semibold">{subs} suscritos</span></>}
        </p>
      </div>

      <div className="bg-gradient-card border border-border/50 rounded-xl p-4 space-y-4">
        <div className="space-y-1.5">
          <Label className="text-xs">Plantillas</Label>
          <div className="flex flex-wrap gap-1.5">
            {PLANTILLAS.map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => { setTitle(p.title); if (p.body) setBody(p.body); }}
                className="text-xs px-2.5 py-1 rounded-full border border-border/50 bg-muted/30 text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>Título</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={60} />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label>Mensaje</Label>
            <span className={`text-[11px] ${body.length > MAX_BODY ? "text-amber-400" : "text-muted-foreground"}`}>
              {body.length}/{MAX_BODY}
            </span>
          </div>
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={4}
            placeholder="Ej: El miércoles todos los equipos deben enviar la nómina definitiva…"
          />
          {body.length > MAX_BODY && (
            <p className="text-[11px] text-amber-400">En el teléfono se puede cortar; mejor un mensaje corto.</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label>Al tocarla abre</Label>
          <Select value={url} onValueChange={setUrl}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {DESTINOS.map((d) => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Vista previa */}
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Vista previa</Label>
        <div className="flex gap-3 rounded-2xl bg-muted/40 border border-border/40 p-3">
          <img src={ligaLogo} alt="" className="w-9 h-9 rounded-full object-contain bg-background p-1 shrink-0" />
          <div className="min-w-0">
            <div className="text-sm font-semibold text-foreground truncate">{title || "Título"}</div>
            <div className="text-xs text-muted-foreground whitespace-pre-line line-clamp-3">{body || "Mensaje…"}</div>
          </div>
        </div>
      </div>

      <Button className="w-full" disabled={!valido || sending} onClick={() => setConfirm(true)}>
        <Send className="w-4 h-4 mr-2" />
        {sending ? "Enviando..." : "Enviar notificación"}
      </Button>

      <AlertDialog open={confirm} onOpenChange={setConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2"><Bell className="w-4 h-4" /> ¿Enviar a todos?</AlertDialogTitle>
            <AlertDialogDescription>
              Le llegará a {subs ?? "todos los"} suscritos (+40 y +35). No se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={sending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction disabled={sending} onClick={(e) => { e.preventDefault(); enviar(); }}>
              Enviar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
