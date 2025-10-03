import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import AdminDashboard from "./pages/AdminDashboard";
import SatpamDashboard from "./pages/SatpamDashboard";
import SupervisorDashboard from "./pages/SupervisorDashboard";
import { AuthProvider } from "./contexts/AuthContext";
import Navbar from "./components/Navbar";
import { SessionProvider } from "./integrations/supabase/SessionContext";

const queryClient = new QueryClient();

const App = () => {
  console.log("App rendering...");

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <SessionProvider> {/* ✅ wrap everything with SessionProvider */}
          <BrowserRouter>
            <AuthProvider>
              <Navbar />
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/login" element={<Login />} />
                <Route path="/admin/dashboard" element={<AdminDashboard />} />
                <Route path="/satpam/dashboard" element={<SatpamDashboard />} />
                <Route path="/supervisor/dashboard" element={<SupervisorDashboard />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </AuthProvider>
          </BrowserRouter>
        </SessionProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
