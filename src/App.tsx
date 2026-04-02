import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import Actualizaciones from "./pages/Actualizaciones";
import Valoraciones from "./pages/Valoraciones";
import Discord from "./pages/Discord";
import Votar from "./pages/Votar";
import Admin from "./pages/Admin";
import Login from "./pages/Login";
import Staff from "./pages/Staff";
import Tickets from "./pages/Tickets";
import Aplicaciones from "./pages/Aplicaciones";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/actualizaciones" element={<Actualizaciones />} />
            <Route path="/valoraciones" element={<Valoraciones />} />
            <Route path="/discord" element={<Discord />} />
            <Route path="/votar" element={<Votar />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/login" element={<Login />} />
            <Route path="/staff" element={<Staff />} />
            <Route path="/tickets" element={<Tickets />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
