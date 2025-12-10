import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// Layouts
import { AdminLayout } from "@/components/layout/AdminLayout";
import { ParticipantLayout } from "@/components/layout/ParticipantLayout";

// Pages
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

// Participant Pages
import ParticipantHome from "./pages/participant/ParticipantHome";
import NBackTask from "./pages/participant/NBackTask";
import StroopTask from "./pages/participant/StroopTask";
import ReactionTask from "./pages/participant/ReactionTask";
import BreakScreen from "./pages/participant/BreakScreen";
import SessionComplete from "./pages/participant/SessionComplete";

// Admin Pages
import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import ParticipantsList from "./pages/admin/ParticipantsList";
import ParticipantDetail from "./pages/admin/ParticipantDetail";
import MonitoringRoom from "./pages/admin/MonitoringRoom";
import LogBrowser from "./pages/admin/LogBrowser";
import ExperimentControl from "./pages/admin/ExperimentControl";
import AdminSettings from "./pages/admin/AdminSettings";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Home */}
          <Route path="/" element={<Index />} />

          {/* Participant Routes */}
          <Route path="/participant" element={<ParticipantLayout />}>
            <Route index element={<ParticipantHome />} />
            <Route path="nback" element={<NBackTask />} />
            <Route path="stroop" element={<StroopTask />} />
            <Route path="reaction" element={<ReactionTask />} />
            <Route path="break" element={<BreakScreen />} />
            <Route path="complete" element={<SessionComplete />} />
          </Route>

          {/* Admin Routes */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="participants" element={<ParticipantsList />} />
            <Route path="participants/:id" element={<ParticipantDetail />} />
            <Route path="monitoring" element={<MonitoringRoom />} />
            <Route path="logs" element={<LogBrowser />} />
            <Route path="control" element={<ExperimentControl />} />
            <Route path="settings" element={<AdminSettings />} />
          </Route>

          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
