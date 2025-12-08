import { ReactNode } from "react";
import { RefreshCw } from "lucide-react";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { cn } from "@/lib/utils";

interface PullToRefreshProps {
  children: ReactNode;
  onRefresh: () => Promise<void>;
  className?: string;
}

export const PullToRefresh = ({
  children,
  onRefresh,
  className,
}: PullToRefreshProps) => {
  const { pullDistance, isRefreshing, pullProgress } = usePullToRefresh({
    onRefresh,
  });

  return (
    <div className={cn("relative", className)}>
      {/* Pull indicator */}
      <div
        className="absolute left-0 right-0 flex justify-center overflow-hidden pointer-events-none z-50"
        style={{
          top: 0,
          height: pullDistance,
          transition: pullDistance === 0 ? "height 0.2s ease-out" : "none",
        }}
      >
        <div
          className={cn(
            "flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 backdrop-blur-sm border border-border shadow-sm",
            isRefreshing && "animate-spin"
          )}
          style={{
            transform: `translateY(${pullDistance - 48}px) rotate(${pullProgress * 360}deg)`,
            opacity: Math.min(pullProgress * 2, 1),
          }}
        >
          <RefreshCw
            className={cn(
              "w-5 h-5 text-primary",
              isRefreshing && "animate-spin"
            )}
          />
        </div>
      </div>

      {/* Content */}
      <div
        style={{
          transform: `translateY(${pullDistance}px)`,
          transition: pullDistance === 0 ? "transform 0.2s ease-out" : "none",
        }}
      >
        {children}
      </div>
    </div>
  );
};
