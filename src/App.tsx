import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import Torneo40 from "./pages/Torneo40";
import Torneo35 from "./pages/Torneo35";
import NotFound from "./pages/NotFound";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminResultado from "./pages/admin/AdminResultado";
import AdminPlayoff from "./pages/admin/AdminPlayoff";
import AdminProximos from "./pages/admin/AdminProximos";
import AdminEdicion from "./pages/admin/AdminEdicion";
import AdminRoja from "./pages/admin/AdminRoja";
import AdminEquipos from "./pages/admin/AdminEquipos";
import AdminSedes from "./pages/admin/AdminSedes";
import { AdminProvider } from "./contexts/AdminContext";
import Historial from "./pages/Historial";
import DisciplinaPage from "./pages/DisciplinaPage";
import Privacidad from "./pages/Privacidad";
import { NotificationPrompt } from "./components/NotificationPrompt";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AdminProvider>
        <BrowserRouter>
          <NotificationPrompt />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/torneo-40" element={<Torneo40 />} />
            <Route path="/torneo-35" element={<Torneo35 />} />
            <Route path="/historial" element={<Historial />} />
            <Route path="/privacidad" element={<Privacidad />} />
            <Route path="/disciplina/:torneo" element={<DisciplinaPage />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Navigate to="/admin/resultado" replace />} />
              <Route path="resultado" element={<AdminResultado />} />
              <Route path="playoff"   element={<AdminPlayoff />} />
              <Route path="proximos"  element={<AdminProximos />} />
              <Route path="roja"      element={<AdminRoja />} />
              <Route path="equipos"   element={<AdminEquipos />} />
              <Route path="sedes"     element={<AdminSedes />} />
              <Route path="edicion"   element={<AdminEdicion />} />
            </Route>
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AdminProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
