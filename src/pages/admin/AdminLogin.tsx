import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAdmin } from "@/contexts/AdminContext";
import { adminFetch } from "@/lib/adminApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock } from "lucide-react";
import ligaLogo from "@/assets/liga-frm-logo.png";

export default function AdminLogin() {
  const { login } = useAdmin();
  const navigate = useNavigate();
  const [secret, setSecret] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await adminFetch(secret, "/ediciones/torneo40");
      login(secret);
      navigate("/admin/resultado");
    } catch {
      setError("Clave incorrecta");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center gap-4 mb-8">
          <img src={ligaLogo} alt="Liga FRM" className="w-20 h-20 object-contain" />
          <div className="text-center">
            <h1 className="font-display text-2xl font-bold text-foreground">Panel Admin</h1>
            <p className="text-sm text-muted-foreground">Liga FRM</p>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-gradient-card border border-border/50 rounded-xl p-6 space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="secret">Clave de acceso</Label>
            <Input
              id="secret"
              type="password"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              placeholder="••••••••"
              autoFocus
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading || !secret}>
            <Lock className="w-4 h-4 mr-2" />
            {loading ? "Verificando..." : "Ingresar"}
          </Button>
        </form>
      </div>
    </div>
  );
}
