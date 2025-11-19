import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { SplashScreen } from "./components/SplashScreen";
import Onboarding from "./pages/Onboarding";
import Home from "./pages/Home";
import Programs from "./pages/Programs";
import ProgramDetail from "./pages/ProgramDetail";
import WorkoutDetail from "./pages/WorkoutDetail";
import CheckIn from "./pages/CheckIn";
import Community from "./pages/Community";
import Account from "./pages/Account";
import Education from "./pages/Education";
import Membership from "./pages/Membership";
import Media from "./pages/Media";
import Achievements from "./pages/Achievements";
import Leaderboard from "./pages/Leaderboard";
import AdminPrograms from "./pages/AdminPrograms";
import Auth from "./pages/Auth";
import BottomNav from "./components/BottomNav";
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
              <Routes>
                <Route path="/auth" element={<Auth />} />
                <Route path="/onboarding" element={<Onboarding />} />
                <Route path="/" element={<ProtectedRoute><Home /><BottomNav /></ProtectedRoute>} />
                <Route path="/programs" element={<ProtectedRoute><Programs /><BottomNav /></ProtectedRoute>} />
                <Route path="/program/:programId" element={<ProtectedRoute><ProgramDetail /><BottomNav /></ProtectedRoute>} />
                <Route path="/workout/:workoutId" element={<ProtectedRoute><WorkoutDetail /><BottomNav /></ProtectedRoute>} />
                <Route path="/check-in" element={<ProtectedRoute><CheckIn /><BottomNav /></ProtectedRoute>} />
                <Route path="/community" element={<ProtectedRoute><Community /><BottomNav /></ProtectedRoute>} />
                <Route path="/account" element={<ProtectedRoute><Account /><BottomNav /></ProtectedRoute>} />
                <Route path="/education" element={<ProtectedRoute><Education /><BottomNav /></ProtectedRoute>} />
                <Route path="/membership" element={<ProtectedRoute><Membership /><BottomNav /></ProtectedRoute>} />
                <Route path="/media" element={<ProtectedRoute><Media /><BottomNav /></ProtectedRoute>} />
                <Route path="/achievements" element={<ProtectedRoute><Achievements /><BottomNav /></ProtectedRoute>} />
                <Route path="/leaderboard" element={<ProtectedRoute><Leaderboard /><BottomNav /></ProtectedRoute>} />
                <Route path="/admin/programs" element={<ProtectedRoute requiredRole="coach"><AdminPrograms /><BottomNav /></ProtectedRoute>} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </div>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
