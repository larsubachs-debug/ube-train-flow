// CSS-only luxury background - no 3D libraries needed for React 19 compatibility

export const LuxuryBackground = () => {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {/* Base gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-accent/10" />
      
      {/* Animated orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-pulse" 
           style={{ animationDuration: '4s' }} />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent/15 rounded-full blur-3xl animate-pulse" 
           style={{ animationDuration: '5s', animationDelay: '1s' }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-accent/10 rounded-full blur-3xl animate-pulse" 
           style={{ animationDuration: '6s', animationDelay: '2s' }} />
      
      {/* Floating shapes */}
      <div className="absolute top-20 right-20 w-32 h-32 border border-accent/20 rounded-full animate-spin"
           style={{ animationDuration: '20s' }} />
      <div className="absolute bottom-32 left-16 w-24 h-24 border border-foreground/10 rotate-45 animate-spin"
           style={{ animationDuration: '25s', animationDirection: 'reverse' }} />
      
      {/* Gradient overlay for depth */}
      <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-background/50" />
    </div>
  );
};
