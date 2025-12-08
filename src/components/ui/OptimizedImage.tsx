import React, { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { ImageOff } from "lucide-react";

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  fallback?: string;
  aspectRatio?: "square" | "video" | "portrait" | "auto";
  showSkeleton?: boolean;
  priority?: boolean;
}

const aspectRatioClasses = {
  square: "aspect-square",
  video: "aspect-video",
  portrait: "aspect-[3/4]",
  auto: "",
};

export const OptimizedImage = React.forwardRef<HTMLImageElement, OptimizedImageProps>(
  (
    {
      src,
      alt,
      fallback,
      aspectRatio = "auto",
      showSkeleton = true,
      priority = false,
      className,
      ...props
    },
    ref
  ) => {
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);
    const [isInView, setIsInView] = useState(priority);
    const imgRef = useRef<HTMLImageElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Intersection Observer for lazy loading
    useEffect(() => {
      if (priority) return;

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setIsInView(true);
              observer.disconnect();
            }
          });
        },
        {
          rootMargin: "100px",
          threshold: 0.1,
        }
      );

      if (containerRef.current) {
        observer.observe(containerRef.current);
      }

      return () => observer.disconnect();
    }, [priority]);

    const handleLoad = () => {
      setIsLoading(false);
      setHasError(false);
    };

    const handleError = () => {
      setIsLoading(false);
      setHasError(true);
    };

    // Try WebP if browser supports it
    const getSrcSet = (imageSrc: string) => {
      if (!imageSrc || imageSrc.includes("data:") || imageSrc.includes("blob:")) {
        return undefined;
      }
      
      // For Supabase storage URLs, we could add transformations here
      // For now, just return the original source
      return undefined;
    };

    const containerClasses = cn(
      "relative overflow-hidden bg-muted",
      aspectRatioClasses[aspectRatio],
      className
    );

    return (
      <div ref={containerRef} className={containerClasses}>
        {/* Skeleton loader */}
        {isLoading && showSkeleton && (
          <Skeleton className="absolute inset-0 w-full h-full" />
        )}

        {/* Error state */}
        {hasError && (
          <div 
            className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-muted text-muted-foreground"
            role="img"
            aria-label={`Afbeelding kon niet worden geladen: ${alt}`}
          >
            <ImageOff className="h-8 w-8" aria-hidden="true" />
            <span className="text-xs text-center px-2">Afbeelding niet beschikbaar</span>
          </div>
        )}

        {/* Image */}
        {isInView && !hasError && (
          <img
            ref={ref || imgRef}
            src={src}
            srcSet={getSrcSet(src)}
            alt={alt}
            loading={priority ? "eager" : "lazy"}
            decoding={priority ? "sync" : "async"}
            onLoad={handleLoad}
            onError={handleError}
            className={cn(
              "w-full h-full object-cover transition-opacity duration-300",
              isLoading ? "opacity-0" : "opacity-100"
            )}
            {...props}
          />
        )}
      </div>
    );
  }
);

OptimizedImage.displayName = "OptimizedImage";

// Preload critical images
export function preloadImage(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = src;
  });
}

// Preload multiple images
export function preloadImages(sources: string[]): Promise<void[]> {
  return Promise.all(sources.map(preloadImage));
}
