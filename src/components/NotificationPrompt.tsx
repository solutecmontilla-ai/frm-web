import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { Bell, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { toast } from "sonner";

const DISMISS_KEY = "frm-push-prompt-dismissed";
const SNOOZE_MS = 7 * 24 * 60 * 60 * 1000;

function wasDismissedRecently() {
  try {
    const ts = Number(localStorage.getItem(DISMISS_KEY));
    return ts > 0 && Date.now() - ts < SNOOZE_MS;
  } catch {
    return false;
  }
}

// Aviso flotante para invitar a activar las notificaciones push
export function NotificationPrompt() {
  const { supported, subscribed, permission, subscribe, loading } = usePushNotifications();
  const { pathname } = useLocation();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!supported || subscribed || permission !== "default") return;
    if (pathname.startsWith("/admin") || wasDismissedRecently()) return;
    const t = setTimeout(() => setVisible(true), 2500);
    return () => clearTimeout(t);
  }, [supported, subscribed, permission, pathname]);

  if (!visible || subscribed) return null;

  function dismiss() {
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      /* sin storage: sólo se oculta en esta sesión */
    }
    setVisible(false);
  }

  async function handleActivate() {
    await subscribe();
    if (Notification.permission === "granted") toast.success("Notificaciones activadas");
    setVisible(false);
  }

  return (
    <div className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-md animate-fade-in rounded-2xl border border-primary/30 bg-card/95 p-4 shadow-2xl backdrop-blur">
      <button
        onClick={dismiss}
        className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
        aria-label="Cerrar"
      >
        <X className="h-4 w-4" />
      </button>
      <div className="flex items-start gap-3 pr-6">
        <div className="rounded-full bg-primary/15 p-2 text-primary">
          <Bell className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold">¿Te avisamos de los resultados?</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Recibe una notificación cada vez que se carguen resultados o la nueva programación.
          </p>
          <div className="mt-3 flex gap-2">
            <Button size="sm" onClick={handleActivate} disabled={loading}>
              Activar
            </Button>
            <Button size="sm" variant="ghost" onClick={dismiss}>
              Ahora no
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
