import { useBranding } from "@/hooks/useBranding";
import ubeLogo from "@/assets/ube-logo.png";

const TopNav = () => {
  const { data: branding } = useBranding();

  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-50">
        <div className="flex items-center justify-center p-4 bg-background border-b border-border">
          <img
            src={branding?.logo_url || ubeLogo}
            alt={branding?.app_name || "U.be"}
            className="h-8 w-auto"
          />
        </div>
      </div>
      
      {/* Spacer to prevent content from being hidden under fixed nav */}
      <div className="h-[72px]" />
    </>
  );
};

export default TopNav;
