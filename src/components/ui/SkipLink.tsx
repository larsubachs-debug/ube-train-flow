import React from "react";
import { cn } from "@/lib/utils";

interface SkipLinkProps {
  href?: string;
  children?: React.ReactNode;
}

export const SkipLink: React.FC<SkipLinkProps> = ({
  href = "#main-content",
  children = "Ga naar hoofdinhoud",
}) => {
  return (
    <a
      href={href}
      className={cn(
        "sr-only focus:not-sr-only",
        "focus:fixed focus:top-4 focus:left-4 focus:z-50",
        "focus:px-4 focus:py-2 focus:bg-background focus:text-foreground",
        "focus:border focus:border-border focus:rounded-md",
        "focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-ring",
        "transition-all"
      )}
    >
      {children}
    </a>
  );
};
