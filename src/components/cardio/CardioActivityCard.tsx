import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Activity, Clock, Ruler, Mountain, Flame, MapPin, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { CardioRouteMap } from "./CardioRouteMap";

interface CardioActivity {
  id: string;
  activity_type: string;
  name: string | null;
  duration_seconds: number | null;
  distance_meters: number | null;
  elevation_gain_meters: number | null;
  average_pace_seconds_per_km: number | null;
  average_speed_kmh: number | null;
  calories_burned: number | null;
  start_location: { lat: number; lng: number } | null;
  end_location: { lat: number; lng: number } | null;
  route_coordinates: { lat: number; lng: number }[] | null;
  notes: string | null;
  completed_at: string;
}

const CARDIO_ICONS: Record<string, string> = {
  running: "🏃",
  cycling: "🚴",
  walking: "🚶",
  swimming: "🏊",
  hiking: "🥾",
  rowing: "🚣",
  skiing: "⛷️",
  skating: "⛸️",
  elliptical: "🏋️",
  stairclimber: "🪜",
};

const CARDIO_LABELS: Record<string, string> = {
  running: "Hardlopen",
  cycling: "Fietsen",
  walking: "Wandelen",
  swimming: "Zwemmen",
  hiking: "Hiken",
  rowing: "Roeien",
  skiing: "Skiën",
  skating: "Schaatsen",
  elliptical: "Crosstrainer",
  stairclimber: "Trappenklimmen",
};

interface CardioActivityCardProps {
  activity: CardioActivity;
}

export const CardioActivityCard = ({ activity }: CardioActivityCardProps) => {
  const [showMap, setShowMap] = useState(false);

  const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) {
      return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    }
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const formatDistance = (meters: number) => {
    return (meters / 1000).toFixed(2);
  };

  const formatPace = (secondsPerKm: number) => {
    const m = Math.floor(secondsPerKm / 60);
    const s = Math.floor(secondsPerKm % 60);
    return `${m}:${s.toString().padStart(2, "0")} /km`;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("nl-NL", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const hasRoute = activity.start_location && activity.end_location;
  const icon = CARDIO_ICONS[activity.activity_type] || "🏃";
  const label = CARDIO_LABELS[activity.activity_type] || activity.activity_type;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <span className="text-lg">{icon}</span>
            {activity.name || label}
          </CardTitle>
          <Badge variant="secondary" className="text-xs">
            {label}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          {formatDate(activity.completed_at)}
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Stats grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {activity.distance_meters && (
            <div className="flex items-center gap-2">
              <Ruler className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">
                  {formatDistance(activity.distance_meters)} km
                </p>
                <p className="text-xs text-muted-foreground">Afstand</p>
              </div>
            </div>
          )}
          {activity.duration_seconds && (
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">
                  {formatDuration(activity.duration_seconds)}
                </p>
                <p className="text-xs text-muted-foreground">Tijd</p>
              </div>
            </div>
          )}
          {activity.average_pace_seconds_per_km && (
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">
                  {formatPace(activity.average_pace_seconds_per_km)}
                </p>
                <p className="text-xs text-muted-foreground">Tempo</p>
              </div>
            </div>
          )}
          {activity.elevation_gain_meters && (
            <div className="flex items-center gap-2">
              <Mountain className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">
                  {activity.elevation_gain_meters} m
                </p>
                <p className="text-xs text-muted-foreground">Hoogte</p>
              </div>
            </div>
          )}
          {activity.calories_burned && (
            <div className="flex items-center gap-2">
              <Flame className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">
                  {activity.calories_burned} kcal
                </p>
                <p className="text-xs text-muted-foreground">Calorieën</p>
              </div>
            </div>
          )}
        </div>

        {/* Notes */}
        {activity.notes && (
          <p className="text-sm text-muted-foreground italic">
            "{activity.notes}"
          </p>
        )}

        {/* Map toggle */}
        {hasRoute && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full gap-2"
            onClick={() => setShowMap(!showMap)}
          >
            <MapPin className="h-4 w-4" />
            {showMap ? "Route verbergen" : "Route bekijken"}
            {showMap ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        )}

        {/* Route map */}
        {showMap && hasRoute && (
          <CardioRouteMap
            startLocation={activity.start_location}
            endLocation={activity.end_location}
            routeCoordinates={activity.route_coordinates}
            distance={activity.distance_meters || undefined}
            duration={activity.duration_seconds || undefined}
            elevation={activity.elevation_gain_meters || undefined}
          />
        )}
      </CardContent>
    </Card>
  );
};
