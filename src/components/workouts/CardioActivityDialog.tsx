import { useState } from "react";
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
import { Activity, MapPin, Timer, Ruler, Mountain } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";

const CARDIO_TYPES = [
  { value: "running", label: "Hardlopen", icon: "🏃" },
  { value: "cycling", label: "Fietsen", icon: "🚴" },
  { value: "walking", label: "Wandelen", icon: "🚶" },
  { value: "swimming", label: "Zwemmen", icon: "🏊" },
  { value: "hiking", label: "Hiken", icon: "🥾" },
  { value: "rowing", label: "Roeien", icon: "🚣" },
  { value: "skiing", label: "Skiën", icon: "⛷️" },
  { value: "skating", label: "Schaatsen", icon: "⛸️" },
  { value: "elliptical", label: "Crosstrainer", icon: "🏋️" },
  { value: "stairclimber", label: "Trappenklimmen", icon: "🪜" },
];

interface Coordinate {
  lat: number;
  lng: number;
}

interface CardioActivityDialogProps {
  autoOpen?: boolean;
  onClose?: () => void;
}

export const CardioActivityDialog = ({ autoOpen = false, onClose }: CardioActivityDialogProps) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(autoOpen);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  // Form state
  const [activityType, setActivityType] = useState("running");
  const [name, setName] = useState("");
  const [hours, setHours] = useState("");
  const [minutes, setMinutes] = useState("");
  const [seconds, setSeconds] = useState("");
  const [distance, setDistance] = useState("");
  const [elevation, setElevation] = useState("");
  const [calories, setCalories] = useState("");
  const [notes, setNotes] = useState("");
  const [startLocation, setStartLocation] = useState<Coordinate | null>(null);
  const [endLocation, setEndLocation] = useState<Coordinate | null>(null);

  const resetForm = () => {
    setActivityType("running");
    setName("");
    setHours("");
    setMinutes("");
    setSeconds("");
    setDistance("");
    setElevation("");
    setCalories("");
    setNotes("");
    setStartLocation(null);
    setEndLocation(null);
  };

  const getCurrentLocation = async (type: "start" | "end") => {
    if (!navigator.geolocation) {
      toast.error("Geolocatie wordt niet ondersteund door je browser");
      return;
    }

    setIsGettingLocation(true);
    try {
      const position = await new Promise<GeolocationPosition>(
        (resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
          });
        }
      );

      const coord: Coordinate = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      };

      if (type === "start") {
        setStartLocation(coord);
        toast.success("Startlocatie opgeslagen!");
      } else {
        setEndLocation(coord);
        toast.success("Eindlocatie opgeslagen!");
      }
    } catch (error) {
      toast.error("Kon locatie niet ophalen");
    } finally {
      setIsGettingLocation(false);
    }
  };

  const handleSubmit = async () => {
    if (!user) return;

    // Calculate total duration in seconds
    const totalSeconds =
      (parseInt(hours) || 0) * 3600 +
      (parseInt(minutes) || 0) * 60 +
      (parseInt(seconds) || 0);

    if (totalSeconds === 0 && !distance) {
      toast.error("Vul minimaal tijd of afstand in");
      return;
    }

    setIsSubmitting(true);
    try {
      // Calculate pace and speed
      const distanceMeters = parseFloat(distance) * 1000 || 0;
      let averagePace = null;
      let averageSpeed = null;

      if (distanceMeters > 0 && totalSeconds > 0) {
        averagePace = totalSeconds / (distanceMeters / 1000); // seconds per km
        averageSpeed = (distanceMeters / 1000) / (totalSeconds / 3600); // km/h
      }

      // Generate a simple route if we have start and end points
      let routeCoordinates = null;
      if (startLocation && endLocation) {
        // Create a simple interpolated route
        const numPoints = 20;
        routeCoordinates = [];
        for (let i = 0; i <= numPoints; i++) {
          const t = i / numPoints;
          routeCoordinates.push({
            lat: startLocation.lat + t * (endLocation.lat - startLocation.lat),
            lng: startLocation.lng + t * (endLocation.lng - startLocation.lng),
          });
        }
      }

      const { error } = await supabase.from("cardio_activities" as any).insert({
        user_id: user.id,
        activity_type: activityType,
        name: name.trim() || CARDIO_TYPES.find(t => t.value === activityType)?.label || activityType,
        duration_seconds: totalSeconds || null,
        distance_meters: distanceMeters || null,
        elevation_gain_meters: parseFloat(elevation) || null,
        average_pace_seconds_per_km: averagePace,
        average_speed_kmh: averageSpeed,
        calories_burned: parseInt(calories) || null,
        start_location: startLocation,
        end_location: endLocation,
        route_coordinates: routeCoordinates,
        notes: notes.trim() || null,
      } as any);

      if (error) throw error;

      toast.success("Cardio activiteit opgeslagen! 🏃");
      resetForm();
      setOpen(false);
    } catch (error: any) {
      toast.error("Fout bij opslaan: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedType = CARDIO_TYPES.find((t) => t.value === activityType);

  const handleOpenChange = (o: boolean) => {
    setOpen(o);
    if (!o) onClose?.();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {!autoOpen && (
        <DialogTrigger asChild>
          <Button className="w-full gap-2" variant="outline">
            <Activity className="w-4 h-4" />
            Cardio activiteit loggen
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-accent" />
            Cardio Activiteit
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Activity Type */}
          <div className="space-y-2">
            <Label>Type activiteit</Label>
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

          {/* Name (optional) */}
          <div className="space-y-2">
            <Label htmlFor="name">Naam (optioneel)</Label>
            <Input
              id="name"
              placeholder={`bijv. Ochtend ${selectedType?.label?.toLowerCase()}`}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* Duration */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1">
              <Timer className="w-4 h-4" />
              Duur
            </Label>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <Input
                  type="number"
                  placeholder="0"
                  value={hours}
                  onChange={(e) => setHours(e.target.value)}
                  min="0"
                />
                <span className="text-xs text-muted-foreground">uur</span>
              </div>
              <div>
                <Input
                  type="number"
                  placeholder="0"
                  value={minutes}
                  onChange={(e) => setMinutes(e.target.value)}
                  min="0"
                  max="59"
                />
                <span className="text-xs text-muted-foreground">min</span>
              </div>
              <div>
                <Input
                  type="number"
                  placeholder="0"
                  value={seconds}
                  onChange={(e) => setSeconds(e.target.value)}
                  min="0"
                  max="59"
                />
                <span className="text-xs text-muted-foreground">sec</span>
              </div>
            </div>
          </div>

          {/* Distance & Elevation */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                <Ruler className="w-4 h-4" />
                Afstand (km)
              </Label>
              <Input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={distance}
                onChange={(e) => setDistance(e.target.value)}
              />
            </div>
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
          </div>

          {/* Calories */}
          <div className="space-y-2">
            <Label>Calorieën (optioneel)</Label>
            <Input
              type="number"
              placeholder="0"
              value={calories}
              onChange={(e) => setCalories(e.target.value)}
            />
          </div>

          {/* Location tracking */}
          <Card className="p-3 space-y-3">
            <Label className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              Route (optioneel)
            </Label>
            <p className="text-xs text-muted-foreground">
              Markeer je start- en eindpunt voor een route animatie
            </p>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant={startLocation ? "default" : "outline"}
                size="sm"
                onClick={() => getCurrentLocation("start")}
                disabled={isGettingLocation}
                className="text-xs"
              >
                {startLocation ? "✓ Start" : "📍 Start markeren"}
              </Button>
              <Button
                type="button"
                variant={endLocation ? "default" : "outline"}
                size="sm"
                onClick={() => getCurrentLocation("end")}
                disabled={isGettingLocation}
                className="text-xs"
              >
                {endLocation ? "✓ Einde" : "🏁 Einde markeren"}
              </Button>
            </div>
            {startLocation && endLocation && (
              <p className="text-xs text-green-600 dark:text-green-400">
                Route punten opgeslagen! Je kunt de animatie bekijken na opslaan.
              </p>
            )}
          </Card>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="cardio-notes">Notities (optioneel)</Label>
            <Textarea
              id="cardio-notes"
              placeholder="Hoe ging het? Hoe voelde je je?"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>

          {/* Submit */}
          <Button
            className="w-full"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Opslaan..." : "Activiteit opslaan"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
