import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Pause, RotateCcw, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Coordinate {
  lat: number;
  lng: number;
}

interface CardioRouteMapProps {
  startLocation?: Coordinate | null;
  endLocation?: Coordinate | null;
  routeCoordinates?: Coordinate[] | null;
  distance?: number; // in meters
  duration?: number; // in seconds
  elevation?: number; // in meters
  isInteractive?: boolean;
  className?: string;
}

export const CardioRouteMap = ({
  startLocation,
  endLocation,
  routeCoordinates,
  distance,
  duration,
  elevation,
  isInteractive = false,
  className = "",
}: CardioRouteMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const animationRef = useRef<number | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationProgress, setAnimationProgress] = useState(0);
  const [mapboxToken, setMapboxToken] = useState<string | null>(null);
  const [isLoadingToken, setIsLoadingToken] = useState(true);
  const [tokenError, setTokenError] = useState(false);

  // Fetch Mapbox token from edge function
  useEffect(() => {
    const fetchToken = async () => {
      try {
        const { data, error } = await supabase.functions.invoke("get-mapbox-token");
        if (error) throw error;
        if (data?.token) {
          setMapboxToken(data.token);
        } else {
          setTokenError(true);
        }
      } catch (err) {
        console.error("Failed to fetch Mapbox token:", err);
        setTokenError(true);
      } finally {
        setIsLoadingToken(false);
      }
    };
    fetchToken();
  }, []);

  // Format duration to HH:MM:SS
  const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) {
      return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    }
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  // Format distance to km
  const formatDistance = (meters: number) => {
    return (meters / 1000).toFixed(2);
  };

  useEffect(() => {
    if (!mapContainer.current || !mapboxToken) return;

    const token = mapboxToken;
    
    if (!token) {
      console.warn("Mapbox token not configured");
      return;
    }

    mapboxgl.accessToken = token;

    // Determine center point
    let center: [number, number] = [4.4777, 51.9244]; // Rotterdam default
    if (startLocation) {
      center = [startLocation.lng, startLocation.lat];
    } else if (routeCoordinates && routeCoordinates.length > 0) {
      center = [routeCoordinates[0].lng, routeCoordinates[0].lat];
    }

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/dark-v11",
      center,
      zoom: 13,
      pitch: 0,
      interactive: isInteractive,
    });

    map.current.on("load", () => {
      if (!map.current) return;

      // If we have route coordinates, draw the full route
      if (routeCoordinates && routeCoordinates.length > 1) {
        const coordinates = routeCoordinates.map((c) => [c.lng, c.lat]);

        // Add the full route as a background (grey)
        map.current.addSource("route-background", {
          type: "geojson",
          data: {
            type: "Feature",
            properties: {},
            geometry: {
              type: "LineString",
              coordinates,
            },
          },
        });

        map.current.addLayer({
          id: "route-background-line",
          type: "line",
          source: "route-background",
          layout: {
            "line-join": "round",
            "line-cap": "round",
          },
          paint: {
            "line-color": "#666",
            "line-width": 4,
            "line-opacity": 0.4,
          },
        });

        // Add the animated route (orange)
        map.current.addSource("route-animated", {
          type: "geojson",
          data: {
            type: "Feature",
            properties: {},
            geometry: {
              type: "LineString",
              coordinates: [],
            },
          },
        });

        map.current.addLayer({
          id: "route-animated-line",
          type: "line",
          source: "route-animated",
          layout: {
            "line-join": "round",
            "line-cap": "round",
          },
          paint: {
            "line-color": "#ff6b00",
            "line-width": 5,
          },
        });

        // Fit bounds to route
        const bounds = new mapboxgl.LngLatBounds();
        coordinates.forEach((coord) => {
          bounds.extend(coord as [number, number]);
        });
        map.current.fitBounds(bounds, { padding: 40 });
      }

      // Add start marker
      if (startLocation) {
        new mapboxgl.Marker({ color: "#22c55e" })
          .setLngLat([startLocation.lng, startLocation.lat])
          .addTo(map.current!);
      }

      // Add end marker
      if (endLocation) {
        new mapboxgl.Marker({ color: "#ef4444" })
          .setLngLat([endLocation.lng, endLocation.lat])
          .addTo(map.current!);
      }
    });

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      map.current?.remove();
    };
  }, [startLocation, endLocation, routeCoordinates, isInteractive]);

  // Animation function
  const animateRoute = () => {
    if (!map.current || !routeCoordinates || routeCoordinates.length < 2) return;

    const coordinates = routeCoordinates.map((c) => [c.lng, c.lat]);
    const totalPoints = coordinates.length;
    let currentIndex = Math.floor(animationProgress * totalPoints);

    const animate = () => {
      if (!map.current || !isAnimating) return;

      currentIndex++;
      if (currentIndex > totalPoints) {
        setIsAnimating(false);
        setAnimationProgress(1);
        return;
      }

      const progress = currentIndex / totalPoints;
      setAnimationProgress(progress);

      const source = map.current.getSource("route-animated") as mapboxgl.GeoJSONSource;
      if (source) {
        source.setData({
          type: "Feature",
          properties: {},
          geometry: {
            type: "LineString",
            coordinates: coordinates.slice(0, currentIndex),
          },
        });
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    if (isAnimating) {
      animateRoute();
    }
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isAnimating]);

  const handlePlayPause = () => {
    if (isAnimating) {
      setIsAnimating(false);
    } else {
      if (animationProgress >= 1) {
        setAnimationProgress(0);
      }
      setIsAnimating(true);
    }
  };

  const handleReset = () => {
    setIsAnimating(false);
    setAnimationProgress(0);
    
    if (map.current && routeCoordinates) {
      const source = map.current.getSource("route-animated") as mapboxgl.GeoJSONSource;
      if (source) {
        source.setData({
          type: "Feature",
          properties: {},
          geometry: {
            type: "LineString",
            coordinates: [],
          },
        });
      }
    }
  };

  // Show loading state
  if (isLoadingToken) {
    return (
      <Card className={`overflow-hidden ${className}`}>
        <div className="w-full h-64 flex items-center justify-center bg-muted">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
        <div className="p-4 bg-card border-t border-border">
          <div className="grid grid-cols-3 gap-4 text-center">
            {distance !== undefined && (
              <div>
                <p className="text-xs text-muted-foreground">Afstand</p>
                <p className="text-lg font-bold">{formatDistance(distance)} km</p>
              </div>
            )}
            {duration !== undefined && (
              <div>
                <p className="text-xs text-muted-foreground">Tijd</p>
                <p className="text-lg font-bold">{formatDuration(duration)}</p>
              </div>
            )}
            {elevation !== undefined && (
              <div>
                <p className="text-xs text-muted-foreground">Hoogte</p>
                <p className="text-lg font-bold">{elevation} m</p>
              </div>
            )}
          </div>
        </div>
      </Card>
    );
  }

  // Show error state
  if (tokenError) {
    return (
      <Card className={`overflow-hidden ${className}`}>
        <div className="w-full h-64 flex items-center justify-center bg-muted">
          <p className="text-sm text-muted-foreground">
            Kaart niet beschikbaar
          </p>
        </div>
        <div className="p-4 bg-card border-t border-border">
          <div className="grid grid-cols-3 gap-4 text-center">
            {distance !== undefined && (
              <div>
                <p className="text-xs text-muted-foreground">Afstand</p>
                <p className="text-lg font-bold">{formatDistance(distance)} km</p>
              </div>
            )}
            {duration !== undefined && (
              <div>
                <p className="text-xs text-muted-foreground">Tijd</p>
                <p className="text-lg font-bold">{formatDuration(duration)}</p>
              </div>
            )}
            {elevation !== undefined && (
              <div>
                <p className="text-xs text-muted-foreground">Hoogte</p>
                <p className="text-lg font-bold">{elevation} m</p>
              </div>
            )}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className={`overflow-hidden ${className}`}>
      <div ref={mapContainer} className="w-full h-64 relative" />
      
      {/* Stats overlay */}
      <div className="p-4 bg-card border-t border-border">
        <div className="grid grid-cols-3 gap-4 text-center">
          {distance !== undefined && (
            <div>
              <p className="text-xs text-muted-foreground">Afstand</p>
              <p className="text-lg font-bold">{formatDistance(distance)} km</p>
            </div>
          )}
          {duration !== undefined && (
            <div>
              <p className="text-xs text-muted-foreground">Tijd</p>
              <p className="text-lg font-bold">{formatDuration(duration)}</p>
            </div>
          )}
          {elevation !== undefined && (
            <div>
              <p className="text-xs text-muted-foreground">Hoogte</p>
              <p className="text-lg font-bold">{elevation} m</p>
            </div>
          )}
        </div>

        {/* Animation controls */}
        {routeCoordinates && routeCoordinates.length > 1 && (
          <div className="flex items-center justify-center gap-2 mt-4">
            <Button
              variant="outline"
              size="icon"
              onClick={handleReset}
              className="h-8 w-8"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
            <Button
              variant="default"
              size="icon"
              onClick={handlePlayPause}
              className="h-10 w-10"
            >
              {isAnimating ? (
                <Pause className="h-5 w-5" />
              ) : (
                <Play className="h-5 w-5" />
              )}
            </Button>
            <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden ml-2">
              <div
                className="h-full bg-primary transition-all duration-100"
                style={{ width: `${animationProgress * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};
