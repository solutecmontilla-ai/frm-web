import { Bell, BellOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { toast } from "sonner";

export function NotificationButton() {
  const { supported, subscribed, permission, subscribe, unsubscribe, loading } =
    usePushNotifications();

  if (!supported) return null;
  if (permission === "denied") return null;

  async function handleClick() {
    if (subscribed) {
      await unsubscribe();
      toast.info("Notificaciones desactivadas");
    } else {
      await subscribe();
      if (Notification.permission === "granted") {
        toast.success("Notificaciones activadas");
      }
    }
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className={`h-9 w-9 rounded-full transition-colors ${
        subscribed
          ? "text-primary bg-primary/10 hover:bg-primary/20"
          : "text-muted-foreground hover:text-foreground"
      }`}
      onClick={handleClick}
      disabled={loading}
      title={subscribed ? "Desactivar notificaciones" : "Activar notificaciones"}
    >
      {subscribed ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
    </Button>
  );
}
