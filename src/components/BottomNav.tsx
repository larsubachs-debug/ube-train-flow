import { Link, useLocation } from "react-router-dom";
import { Calendar, Dumbbell, User, MessageCircle } from "lucide-react";
import { useTranslation } from "react-i18next";

const BottomNav = () => {
  const location = useLocation();
  const { t } = useTranslation();

  const navItems = [
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
          const isActive = location.pathname === item.path;
          
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
