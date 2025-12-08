import { useState, useEffect, lazy, Suspense } from "react";
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
import { SkipLink } from "./components/ui/SkipLink";
import { PageLoading } from "./components/ui/LoadingSpinner";
import TopNav from "./components/TopNav";

// Lazy load all pages for better bundle splitting
const Onboarding = lazy(() => import("./pages/Onboarding"));
const Home = lazy(() => import("./pages/Home"));
const Programs = lazy(() => import("./pages/Programs"));
const ProgramDetail = lazy(() => import("./pages/ProgramDetail"));
const WorkoutDetail = lazy(() => import("./pages/WorkoutDetail"));
const CheckIn = lazy(() => import("./pages/CheckIn"));
const Community = lazy(() => import("./pages/Community"));
const Account = lazy(() => import("./pages/Account"));
const Education = lazy(() => import("./pages/Education"));
const EducationDetail = lazy(() => import("./pages/EducationDetail"));
const Membership = lazy(() => import("./pages/Membership"));
const Media = lazy(() => import("./pages/Media"));
const Achievements = lazy(() => import("./pages/Achievements"));
const Leaderboard = lazy(() => import("./pages/Leaderboard"));
const AdminPrograms = lazy(() => import("./pages/AdminPrograms"));
const AdminMembers = lazy(() => import("./pages/AdminMembers"));
const AdminCheckins = lazy(() => import("./pages/AdminCheckins"));
const AdminTasks = lazy(() => import("./pages/AdminTasks"));
const AdminBranding = lazy(() => import("./pages/AdminBranding"));
const CoachDashboard = lazy(() => import("./pages/CoachDashboard"));
const Chat = lazy(() => import("./pages/Chat"));
const CoachChat = lazy(() => import("./pages/CoachChat"));
const Auth = lazy(() => import("./pages/Auth"));
const PendingApproval = lazy(() => import("./pages/PendingApproval"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Analytics = lazy(() => import("./pages/Analytics"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Install = lazy(() => import("./pages/Install"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Terms = lazy(() => import("./pages/Terms"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes (formerly cacheTime)
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

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
              <SkipLink />
              <Toaster />
              <Sonner />
              {showSplash && !hasShownSplash && (
                <SplashScreen onComplete={handleSplashComplete} />
              )}
              <div className={showSplash ? 'invisible' : 'visible'}>
                <BrowserRouter>
                  <TopNav />
                  <main id="main-content" tabIndex={-1}>
                    <Suspense fallback={<PageLoading />}>
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
                        <Route path="/install" element={<Install />} />
                        <Route path="/privacy" element={<Privacy />} />
                        <Route path="/terms" element={<Terms />} />
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </Suspense>
                  </main>
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
