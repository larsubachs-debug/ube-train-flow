import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Calendar, Dumbbell, User, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useBranding } from "@/hooks/useBranding";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import ubeLogo from "@/assets/ube-logo.png";

const TopNav = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const { data: branding } = useBranding();
  const { t } = useTranslation();

  const navItems = [
    { path: "/", icon: Calendar, labelKey: 'time.today' },
    { path: "/programs", icon: Dumbbell, labelKey: 'nav.programs' },
    { path: "/account", icon: User, labelKey: 'nav.account' },
  ];

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="fixed top-0 left-0 right-0 z-50">
        <div className="flex items-center justify-center p-4 bg-background border-b border-border" data-tour="navigation">
          <CollapsibleTrigger asChild>
            <button className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <img
                src={branding?.logo_url || ubeLogo}
                alt={branding?.app_name || "U.be"}
                className="h-8 w-auto"
              />
            </button>
          </CollapsibleTrigger>
        </div>

        <CollapsibleContent className="bg-card border-b border-border animate-accordion-down">
          <div className="flex flex-col p-4 space-y-2 max-w-lg mx-auto">
            <div className="flex items-center justify-between">
              <LanguageSwitcher />
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
                aria-label={t('common.close')}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? "bg-accent text-accent-foreground"
                      : "hover:bg-muted"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-lg font-medium">{t(item.labelKey)}</span>
                </Link>
              );
            })}
          </div>
        </CollapsibleContent>
      </div>
      
      {/* Spacer to prevent content from being hidden under fixed nav */}
      <div className="h-[72px]" />
    </Collapsible>
  );
};

export default TopNav;
