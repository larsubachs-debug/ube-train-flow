import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ThemeProvider } from "./components/ThemeProvider";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { SplashScreen } from "./components/SplashScreen";
import { ErrorBoundary } from "./components/ErrorBoundary";
import Onboarding from "./pages/Onboarding";
import Home from "./pages/Home";
import Programs from "./pages/Programs";
import ProgramDetail from "./pages/ProgramDetail";
import WorkoutDetail from "./pages/WorkoutDetail";
import CheckIn from "./pages/CheckIn";
import Community from "./pages/Community";
import Account from "./pages/Account";
import Education from "./pages/Education";
import EducationDetail from "./pages/EducationDetail";
import Membership from "./pages/Membership";
import Media from "./pages/Media";
import Achievements from "./pages/Achievements";
import Leaderboard from "./pages/Leaderboard";
import AdminPrograms from "./pages/AdminPrograms";
import AdminMembers from "./pages/AdminMembers";
import AdminCheckins from "./pages/AdminCheckins";
import AdminTasks from "./pages/AdminTasks";
import AdminBranding from "./pages/AdminBranding";
import CoachDashboard from "./pages/CoachDashboard";
import Chat from "./pages/Chat";
import CoachChat from "./pages/CoachChat";
import Auth from "./pages/Auth";
import PendingApproval from "./pages/PendingApproval";
import Dashboard from "./pages/Dashboard";
import Analytics from "./pages/Analytics";
import TopNav from "./components/TopNav";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [hasShownSplash, setHasShownSplash] = useState(false);

  useEffect(() => {
    // Check if splash has been shown in this session
    const splashShown = sessionStorage.getItem('splashShown');
    if (splashShown === 'true') {
      setShowSplash(false);
      setHasShownSplash(true);
    }
  }, []);

  const handleSplashComplete = () => {
    sessionStorage.setItem('splashShown', 'true');
    setShowSplash(false);
    setHasShownSplash(true);
  };

  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="system" storageKey="ube-theme">
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
            {showSplash && !hasShownSplash && (
              <SplashScreen onComplete={handleSplashComplete} />
            )}
            <div className={showSplash ? 'invisible' : 'visible'}>
              <BrowserRouter>
                <TopNav />
                <Routes>
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/pending-approval" element={<PendingApproval />} />
                  <Route path="/onboarding" element={<Onboarding />} />
                  <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
                  <Route path="/programs" element={<ProtectedRoute><Programs /></ProtectedRoute>} />
                  <Route path="/program/:programId" element={<ProtectedRoute><ProgramDetail /></ProtectedRoute>} />
                  <Route path="/workout/:workoutId" element={<ProtectedRoute><WorkoutDetail /></ProtectedRoute>} />
                  <Route path="/check-in" element={<ProtectedRoute><CheckIn /></ProtectedRoute>} />
                  <Route path="/community" element={<ProtectedRoute><Community /></ProtectedRoute>} />
                  <Route path="/account" element={<ProtectedRoute><Account /></ProtectedRoute>} />
                  <Route path="/education" element={<ProtectedRoute><Education /></ProtectedRoute>} />
                  <Route path="/education/:id" element={<ProtectedRoute><EducationDetail /></ProtectedRoute>} />
                  <Route path="/membership" element={<ProtectedRoute><Membership /></ProtectedRoute>} />
                  <Route path="/media" element={<ProtectedRoute><Media /></ProtectedRoute>} />
                  <Route path="/achievements" element={<ProtectedRoute><Achievements /></ProtectedRoute>} />
                  <Route path="/leaderboard" element={<ProtectedRoute><Leaderboard /></ProtectedRoute>} />
                  <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                  <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
                  <Route path="/admin/programs" element={<ProtectedRoute requiredRole="coach"><AdminPrograms /></ProtectedRoute>} />
                  <Route path="/admin/members" element={<ProtectedRoute requiredRole="coach"><AdminMembers /></ProtectedRoute>} />
                  <Route path="/admin/checkins" element={<ProtectedRoute requiredRole="coach"><AdminCheckins /></ProtectedRoute>} />
                  <Route path="/admin/tasks" element={<ProtectedRoute requiredRole="coach"><AdminTasks /></ProtectedRoute>} />
                  <Route path="/admin/branding" element={<ProtectedRoute requiredRole="coach"><AdminBranding /></ProtectedRoute>} />
                  <Route path="/coach/dashboard" element={<ProtectedRoute requiredRole="coach"><CoachDashboard /></ProtectedRoute>} />
                  <Route path="/coach/chat/:memberId" element={<ProtectedRoute requiredRole="coach"><CoachChat /></ProtectedRoute>} />
                  <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
            </div>
            </TooltipProvider>
          </AuthProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
};

export default App;
