import { Link, useLocation } from "react-router-dom";
import { Calendar, Dumbbell, User, MessageCircle, Users, LayoutGrid, ListChecks, Bell } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";

const BottomNav = () => {
  const location = useLocation();
  const { t } = useTranslation();
  const { hasRole } = useAuth();
  
  const isCoach = hasRole("coach");

  // Coach navigation matches the design: Dashboard, Clients, Check-ins, Notifications
  const navItems = isCoach
    ? [
        { path: "/coach/dashboard", icon: LayoutGrid, labelKey: "nav.dashboard" },
        { path: "/coach/clients", icon: Users, labelKey: "coach.clients" },
        { path: "/admin/checkins", icon: ListChecks, labelKey: "coach.checkins" },
        { path: "/coach/notifications", icon: Bell, labelKey: "nav.notifications" },
      ]
    : [
        { path: "/", icon: Calendar, labelKey: "time.today" },
        { path: "/programs", icon: Dumbbell, labelKey: "nav.programs" },
        { path: "/chat", icon: MessageCircle, labelKey: "nav.chat" },
        { path: "/account", icon: User, labelKey: "nav.account" },
      ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path || 
            (item.path === "/coach/dashboard" && location.pathname.startsWith("/coach"));
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-colors ${
                isActive
                  ? "text-accent"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs font-medium">{t(item.labelKey)}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
