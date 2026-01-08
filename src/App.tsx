import { useState, useEffect, lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createBrowserRouter, RouterProvider, Outlet } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ThemeProvider } from "./components/ThemeProvider";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { SplashScreen } from "./components/SplashScreen";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { SkipLink } from "./components/ui/SkipLink";
import { PageLoading } from "./components/ui/LoadingSpinner";
import { PWAUpdatePrompt } from "./components/pwa/PWAUpdatePrompt";
import { PWAInstallBanner } from "./components/pwa/PWAInstallBanner";
import TopNav from "./components/TopNav";
import { UbyFeedbackWidget } from "./components/beta/UbyFeedbackWidget";

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
const AdminFeedback = lazy(() => import("./pages/AdminFeedback"));
const CoachDashboard = lazy(() => import("./pages/CoachDashboard"));
const CoachClients = lazy(() => import("./pages/CoachClients"));
const CoachNotifications = lazy(() => import("./pages/CoachNotifications"));
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
const Agenda = lazy(() => import("./pages/Agenda"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Nutrition = lazy(() => import("./pages/Nutrition"));
const Habits = lazy(() => import("./pages/Habits"));
const Reports = lazy(() => import("./pages/Reports"));

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

// Layout component with TopNav
const AppLayout = () => (
  <>
    <TopNav />
    <main id="main-content" tabIndex={-1}>
      <Suspense fallback={<PageLoading />}>
        <Outlet />
      </Suspense>
    </main>
  </>
);

// Create router with future flags to eliminate warnings
const router = createBrowserRouter(
  [
    {
      element: <AppLayout />,
      children: [
        { path: "/auth", element: <Auth /> },
        { path: "/reset-password", element: <ResetPassword /> },
        { path: "/pending-approval", element: <PendingApproval /> },
        { path: "/onboarding", element: <Onboarding /> },
        { path: "/", element: <ProtectedRoute><Home /></ProtectedRoute> },
        { path: "/programs", element: <ProtectedRoute><Programs /></ProtectedRoute> },
        { path: "/programs/:programId", element: <ProtectedRoute><ProgramDetail /></ProtectedRoute> },
        { path: "/programs/:programId/workout/:workoutId", element: <ProtectedRoute><WorkoutDetail /></ProtectedRoute> },
        { path: "/program/:programId", element: <ProtectedRoute><ProgramDetail /></ProtectedRoute> },
        { path: "/workout/:workoutId", element: <ProtectedRoute><WorkoutDetail /></ProtectedRoute> },
        { path: "/check-in", element: <ProtectedRoute><CheckIn /></ProtectedRoute> },
        { path: "/community", element: <ProtectedRoute><Community /></ProtectedRoute> },
        { path: "/account", element: <ProtectedRoute><Account /></ProtectedRoute> },
        { path: "/education", element: <ProtectedRoute><Education /></ProtectedRoute> },
        { path: "/education/:id", element: <ProtectedRoute><EducationDetail /></ProtectedRoute> },
        { path: "/membership", element: <ProtectedRoute><Membership /></ProtectedRoute> },
        { path: "/media", element: <ProtectedRoute><Media /></ProtectedRoute> },
        { path: "/achievements", element: <ProtectedRoute><Achievements /></ProtectedRoute> },
        { path: "/leaderboard", element: <ProtectedRoute><Leaderboard /></ProtectedRoute> },
        { path: "/dashboard", element: <ProtectedRoute><Dashboard /></ProtectedRoute> },
        { path: "/agenda", element: <ProtectedRoute><Agenda /></ProtectedRoute> },
        { path: "/analytics", element: <ProtectedRoute><Analytics /></ProtectedRoute> },
        { path: "/nutrition", element: <ProtectedRoute><Nutrition /></ProtectedRoute> },
        { path: "/habits", element: <ProtectedRoute><Habits /></ProtectedRoute> },
        { path: "/reports", element: <ProtectedRoute><Reports /></ProtectedRoute> },
        { path: "/admin/programs", element: <ProtectedRoute requiredRole="coach"><AdminPrograms /></ProtectedRoute> },
        { path: "/admin/members", element: <ProtectedRoute requiredRole="coach"><AdminMembers /></ProtectedRoute> },
        { path: "/admin/checkins", element: <ProtectedRoute requiredRole="coach"><AdminCheckins /></ProtectedRoute> },
        { path: "/admin/tasks", element: <ProtectedRoute requiredRole="coach"><AdminTasks /></ProtectedRoute> },
        { path: "/admin/branding", element: <ProtectedRoute requiredRole="coach"><AdminBranding /></ProtectedRoute> },
        { path: "/admin/feedback", element: <ProtectedRoute requiredRole="coach"><AdminFeedback /></ProtectedRoute> },
        { path: "/coach/dashboard", element: <ProtectedRoute requiredRole="coach"><CoachDashboard /></ProtectedRoute> },
        { path: "/coach/clients", element: <ProtectedRoute requiredRole="coach"><CoachClients /></ProtectedRoute> },
        { path: "/coach/notifications", element: <ProtectedRoute requiredRole="coach"><CoachNotifications /></ProtectedRoute> },
        { path: "/coach/chat/:memberId", element: <ProtectedRoute requiredRole="coach"><CoachChat /></ProtectedRoute> },
        { path: "/chat", element: <ProtectedRoute><Chat /></ProtectedRoute> },
        { path: "/install", element: <Install /> },
        { path: "/privacy", element: <Privacy /> },
        { path: "/terms", element: <Terms /> },
        { path: "*", element: <NotFound /> },
      ],
    },
  ],
  {
    future: {
      v7_relativeSplatPath: true,
    },
  }
);

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
                <RouterProvider router={router} />
                <PWAUpdatePrompt />
                <PWAInstallBanner />
                <UbyFeedbackWidget />
              </div>
            </TooltipProvider>
          </AuthProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
};

export default App;