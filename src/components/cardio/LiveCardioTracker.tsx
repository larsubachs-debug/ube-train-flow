import { useState, useEffect, useRef, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Play, Square, MapPin, Timer, Ruler, Mountain, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { useQueryClient } from "@tanstack/react-query";

const CARDIO_TYPES = [
  { value: "running", label: "Hardlopen", icon: "🏃" },
  { value: "cycling", label: "Fietsen", icon: "🚴" },
  { value: "walking", label: "Wandelen", icon: "🚶" },
  { value: "swimming", label: "Zwemmen", icon: "🏊" },
  { value: "hiking", label: "Hiken", icon: "🥾" },
  { value: "rowing", label: "Roeien", icon: "🚣" },
];

interface Coordinate {
  lat: number;
  lng: number;
}

export const LiveCardioTracker = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [isTracking, setIsTracking] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isStopping, setIsStopping] = useState(false);

  // Tracking state
  const [activityType, setActivityType] = useState("running");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [startLocation, setStartLocation] = useState<Coordinate | null>(null);
  const [currentLocation, setCurrentLocation] = useState<Coordinate | null>(null);
  const [routeCoordinates, setRouteCoordinates] = useState<Coordinate[]>([]);
  const [totalDistance, setTotalDistance] = useState(0);

  // Form state (after stopping)
  const [name, setName] = useState("");
  const [elevation, setElevation] = useState("");
  const [calories, setCalories] = useState("");
  const [notes, setNotes] = useState("");
  const [isPublic, setIsPublic] = useState(false);

  // Refs
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const watchIdRef = useRef<number | null>(null);

  // Calculate distance between two coordinates (Haversine formula)
  const calculateDistance = (coord1: Coordinate, coord2: Coordinate): number => {
    const R = 6371000; // Earth's radius in meters
    const dLat = ((coord2.lat - coord1.lat) * Math.PI) / 180;
    const dLng = ((coord2.lng - coord1.lng) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((coord1.lat * Math.PI) / 180) *
        Math.cos((coord2.lat * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Format time
  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) {
      return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    }
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // Start tracking
  const handleStart = async () => {
    if (!navigator.geolocation) {
      toast.error("Geolocatie wordt niet ondersteund");
      return;
    }

    try {
      // Get initial position
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
        });
      });

      const initialCoord: Coordinate = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      };

      setStartLocation(initialCoord);
      setCurrentLocation(initialCoord);
      setRouteCoordinates([initialCoord]);
      setElapsedSeconds(0);
      setTotalDistance(0);
      setIsTracking(true);

      // Start timer
      timerRef.current = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);

      // Start watching position
      watchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          const newCoord: Coordinate = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          };

          setCurrentLocation(newCoord);
          setRouteCoordinates((prev) => {
            const lastCoord = prev[prev.length - 1];
            if (lastCoord) {
              const dist = calculateDistance(lastCoord, newCoord);
              // Only add if moved more than 5 meters (filter GPS noise)
              if (dist > 5) {
                setTotalDistance((d) => d + dist);
                return [...prev, newCoord];
              }
            }
            return prev;
          });
        },
        (error) => {
          console.error("GPS error:", error);
        },
        {
          enableHighAccuracy: true,
          maximumAge: 3000,
          timeout: 10000,
        }
      );

      toast.success("Tracking gestart! 🏃");
    } catch (error) {
      toast.error("Kon locatie niet ophalen");
    }
  };

  // Stop tracking
  const handleStop = () => {
    setIsStopping(true);
    setIsTracking(false);

    // Stop timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // Stop watching position
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  };

  // Save activity
  const handleSave = async () => {
    if (!user || !startLocation) return;

    setIsSubmitting(true);
    try {
      const endLocation = routeCoordinates[routeCoordinates.length - 1] || currentLocation;
      const distanceMeters = totalDistance;
      
      let averagePace = null;
      let averageSpeed = null;
      if (distanceMeters > 0 && elapsedSeconds > 0) {
        averagePace = elapsedSeconds / (distanceMeters / 1000);
        averageSpeed = (distanceMeters / 1000) / (elapsedSeconds / 3600);
      }

      const selectedType = CARDIO_TYPES.find((t) => t.value === activityType);

      const { error } = await supabase.from("cardio_activities" as any).insert({
        user_id: user.id,
        activity_type: activityType,
        name: name.trim() || `${selectedType?.label || activityType} ${new Date().toLocaleDateString("nl-NL")}`,
        duration_seconds: elapsedSeconds,
        distance_meters: distanceMeters,
        elevation_gain_meters: parseFloat(elevation) || null,
        average_pace_seconds_per_km: averagePace,
        average_speed_kmh: averageSpeed,
        calories_burned: parseInt(calories) || null,
        start_location: startLocation,
        end_location: endLocation,
        route_coordinates: routeCoordinates.length > 1 ? routeCoordinates : null,
        notes: notes.trim() || null,
        is_public: isPublic,
      } as any);

      if (error) throw error;

      toast.success("Activiteit opgeslagen! 🎉");
      queryClient.invalidateQueries({ queryKey: ["cardio-activities"] });
      queryClient.invalidateQueries({ queryKey: ["cardio-stats"] });
      queryClient.invalidateQueries({ queryKey: ["cardio-leaderboard"] });
      resetAll();
      setOpen(false);
    } catch (error: any) {
      toast.error("Fout bij opslaan: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetAll = () => {
    setIsTracking(false);
    setIsStopping(false);
    setElapsedSeconds(0);
    setStartLocation(null);
    setCurrentLocation(null);
    setRouteCoordinates([]);
    setTotalDistance(0);
    setName("");
    setElevation("");
    setCalories("");
    setNotes("");
    setIsPublic(false);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  const selectedType = CARDIO_TYPES.find((t) => t.value === activityType);

  return (
    <Dialog open={open} onOpenChange={(o) => {
      if (!o && isTracking) {
        toast.error("Stop eerst de tracking voordat je sluit");
        return;
      }
      setOpen(o);
      if (!o) resetAll();
    }}>
      <DialogTrigger asChild>
        <Button className="w-full gap-2 bg-accent hover:bg-accent/90">
          <Play className="w-4 h-4" />
          Live Cardio Starten
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {selectedType?.icon} Live Tracking
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Activity Type Selection - only before starting */}
          {!isTracking && !isStopping && (
            <div className="space-y-2">
              <Label>Activiteit type</Label>
              <Select value={activityType} onValueChange={setActivityType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CARDIO_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <span className="flex items-center gap-2">
                        <span>{type.icon}</span>
                        <span>{type.label}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Live Stats */}
          {(isTracking || isStopping) && (
            <Card className="p-4 bg-muted/50">
              <div className="text-center space-y-4">
                {/* Timer */}
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Tijd</p>
                  <p className="text-4xl font-mono font-bold tabular-nums">
                    {formatTime(elapsedSeconds)}
                  </p>
                </div>

                {/* Distance and Pace */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                      <Ruler className="w-3 h-3" /> Afstand
                    </p>
                    <p className="text-2xl font-bold">
                      {(totalDistance / 1000).toFixed(2)} <span className="text-sm">km</span>
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                      <Timer className="w-3 h-3" /> Tempo
                    </p>
                    <p className="text-2xl font-bold">
                      {totalDistance > 0
                        ? `${Math.floor(elapsedSeconds / (totalDistance / 1000) / 60)}:${Math.floor((elapsedSeconds / (totalDistance / 1000)) % 60).toString().padStart(2, "0")}`
                        : "--:--"}
                      <span className="text-sm"> /km</span>
                    </p>
                  </div>
                </div>

                {/* Location indicator */}
                {isTracking && (
                  <div className="flex items-center justify-center gap-2 text-xs text-green-600 dark:text-green-400">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </span>
                    GPS actief • {routeCoordinates.length} punten
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Start/Stop Button */}
          {!isStopping && (
            <Button
              className={`w-full h-14 text-lg gap-2 ${isTracking ? "bg-destructive hover:bg-destructive/90" : "bg-accent hover:bg-accent/90"}`}
              onClick={isTracking ? handleStop : handleStart}
            >
              {isTracking ? (
                <>
                  <Square className="w-5 h-5" />
                  Stop Tracking
                </>
              ) : (
                <>
                  <Play className="w-5 h-5" />
                  Start {selectedType?.label}
                </>
              )}
            </Button>
          )}

          {/* After stopping - save form */}
          {isStopping && (
            <>
              <div className="space-y-2">
                <Label>Naam (optioneel)</Label>
                <Input
                  placeholder={`${selectedType?.label} ${new Date().toLocaleDateString("nl-NL")}`}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="flex items-center gap-1">
                    <Mountain className="w-4 h-4" />
                    Hoogte (m)
                  </Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={elevation}
                    onChange={(e) => setElevation(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Calorieën</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={calories}
                    onChange={(e) => setCalories(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Notities</Label>
                <Textarea
                  placeholder="Hoe ging het?"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div>
                  <p className="text-sm font-medium">Deel op leaderboard</p>
                  <p className="text-xs text-muted-foreground">Anderen kunnen je activiteit zien</p>
                </div>
                <Switch checked={isPublic} onCheckedChange={setIsPublic} />
              </div>

              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={resetAll}>
                  Annuleren
                </Button>
                <Button className="flex-1" onClick={handleSave} disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Opslaan
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
