import { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAdmin } from "@/contexts/AdminContext";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  ClipboardList,
  Calendar,
  Plus,
  LogOut,
  Swords,
  Menu,
  Users,
  ShieldAlert,
  MapPin,
} from "lucide-react";
import ligaLogo from "@/assets/liga-frm-logo.png";

const NAV = [
  { to: "/admin/resultado", label: "Resultado",     icon: ClipboardList },
  { to: "/admin/playoff",   label: "Playoff",       icon: Swords },
  { to: "/admin/roja",      label: "Tarjeta Roja",  icon: ShieldAlert },
  { to: "/admin/proximos",  label: "Próximos",      icon: Calendar },
  { to: "/admin/equipos",   label: "Equipos",       icon: Users },
  { to: "/admin/sedes",     label: "Sedes",         icon: MapPin },
  { to: "/admin/edicion",   label: "Edición / Hero", icon: Plus },
];

export default function AdminLayout() {
  const { isAuthed, logout } = useAdmin();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!isAuthed) navigate("/admin/login");
  }, [isAuthed, navigate]);

  const handleLogout = () => {
    logout();
    navigate("/admin/login");
  };

  const SidebarContent = () => (
    <>
      <div className="p-4 border-b border-border/50 flex items-center gap-3">
        <img src={ligaLogo} alt="Liga FRM" className="w-9 h-9 object-contain" />
        <div>
          <div className="font-display font-bold text-sm text-foreground">Liga FRM</div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-widest">Admin</div>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {NAV.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={() => setOpen(false)}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-colors",
                isActive
                  ? "bg-primary/20 text-primary font-semibold"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )
            }
          >
            <Icon className="w-4 h-4 shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="p-3 border-t border-border/50">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-muted-foreground hover:text-foreground gap-2"
          onClick={handleLogout}
        >
          <LogOut className="w-4 h-4" />
          Salir
        </Button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar desktop */}
      <aside className="hidden md:flex w-56 border-r border-border/50 flex-col bg-gradient-card shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/60 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar mobile */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-56 flex flex-col bg-gradient-card border-r border-border/50 transition-transform duration-200 md:hidden",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <SidebarContent />
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <header className="md:hidden flex items-center gap-3 px-4 py-3 border-b border-border/50 bg-gradient-card">
          <Button variant="ghost" size="icon" onClick={() => setOpen(true)}>
            <Menu className="w-5 h-5" />
          </Button>
          <img src={ligaLogo} alt="Liga FRM" className="w-7 h-7 object-contain" />
          <span className="font-display font-bold text-sm text-foreground">Admin</span>
        </header>

        <main className="flex-1 overflow-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
