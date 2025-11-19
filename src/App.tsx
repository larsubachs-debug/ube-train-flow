import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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
import BottomNav from "./components/BottomNav";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/" element={<><Home /><BottomNav /></>} />
          <Route path="/programs" element={<><Programs /><BottomNav /></>} />
          <Route path="/program/:programId" element={<><ProgramDetail /><BottomNav /></>} />
          <Route path="/workout/:workoutId" element={<><WorkoutDetail /><BottomNav /></>} />
          <Route path="/check-in" element={<><CheckIn /><BottomNav /></>} />
          <Route path="/community" element={<><Community /><BottomNav /></>} />
          <Route path="/account" element={<><Account /><BottomNav /></>} />
          <Route path="/education" element={<><Education /><BottomNav /></>} />
          <Route path="/membership" element={<><Membership /><BottomNav /></>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
