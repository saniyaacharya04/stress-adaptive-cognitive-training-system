import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import RequireAdminAuth from "@/components/auth/RequireAdminAuth";

import { AdminLayout } from "@/components/layout/AdminLayout";
import { ParticipantLayout } from "@/components/layout/ParticipantLayout";

import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

import ParticipantHome from "./pages/participant/ParticipantHome";
import NBackTask from "./pages/participant/NBackTask";
import StroopTask from "./pages/participant/StroopTask";
import ReactionTask from "./pages/participant/ReactionTask";
import BreakScreen from "./pages/participant/BreakScreen";
import SessionComplete from "./pages/participant/SessionComplete";

import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import ParticipantsList from "./pages/admin/ParticipantsList";
import ParticipantDetail from "./pages/admin/ParticipantDetail";
import LogBrowser from "./pages/admin/LogBrowser";
import AdminSettings from "./pages/admin/AdminSettings";

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />

        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />

            <Route path="/participant" element={<ParticipantLayout />}>
              <Route index element={<ParticipantHome />} />
              <Route path="nback" element={<NBackTask />} />
              <Route path="stroop" element={<StroopTask />} />
              <Route path="reaction" element={<ReactionTask />} />
              <Route path="break" element={<BreakScreen />} />
              <Route path="complete" element={<SessionComplete />} />
            </Route>

            <Route path="/admin/login" element={<AdminLogin />} />

            <Route
              path="/admin"
              element={
                <RequireAdminAuth>
                  <AdminLayout />
                </RequireAdminAuth>
              }
            >
              <Route index element={<AdminDashboard />} />
              <Route path="participants" element={<ParticipantsList />} />
              <Route path="participants/:id" element={<ParticipantDetail />} />
              <Route path="logs" element={<LogBrowser />} />
              <Route path="settings" element={<AdminSettings />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}
