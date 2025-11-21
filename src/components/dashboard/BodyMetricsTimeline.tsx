import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useBodyMetrics } from "@/hooks/useBodyMetrics";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { Calendar, Weight, Activity, Droplets } from "lucide-react";

interface BodyMetricsTimelineProps {
  userId: string;
}

export const BodyMetricsTimeline = ({ userId }: BodyMetricsTimelineProps) => {
  const { metrics, isLoading } = useBodyMetrics(userId);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Progressie Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[600px]" />
        </CardContent>
      </Card>
    );
  }

  if (!metrics || metrics.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Progressie Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            Nog geen metingen beschikbaar
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Progressie Timeline</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative space-y-8">
          {/* Timeline line */}
          <div className="absolute left-[19px] top-2 bottom-2 w-0.5 bg-border" />

          {metrics.map((metric, index) => (
            <div key={metric.id} className="relative pl-12">
              {/* Timeline dot */}
              <div className="absolute left-0 top-1 w-10 h-10 rounded-full bg-primary/10 border-2 border-primary flex items-center justify-center">
                <Calendar className="w-5 h-5 text-primary" />
              </div>

              <div className="space-y-3">
                {/* Date header */}
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold">
                    {format(new Date(metric.recorded_at), 'dd MMMM yyyy', { locale: nl })}
                  </p>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(metric.recorded_at), 'HH:mm', { locale: nl })}
                  </span>
                </div>

                {/* Metrics grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {metric.weight && (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                      <Weight className="w-4 h-4 text-primary" />
                      <div>
                        <p className="text-xs text-muted-foreground">Gewicht</p>
                        <p className="text-sm font-medium">{metric.weight} kg</p>
                      </div>
                    </div>
                  )}

                  {metric.body_fat_percentage && (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                      <Droplets className="w-4 h-4 text-primary" />
                      <div>
                        <p className="text-xs text-muted-foreground">Vetpercentage</p>
                        <p className="text-sm font-medium">{metric.body_fat_percentage}%</p>
                      </div>
                    </div>
                  )}

                  {metric.muscle_mass && (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                      <Activity className="w-4 h-4 text-primary" />
                      <div>
                        <p className="text-xs text-muted-foreground">Spiermassa</p>
                        <p className="text-sm font-medium">{metric.muscle_mass} kg</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Photos */}
                {(metric.front_photo_url || metric.side_photo_url || metric.back_photo_url) && (
                  <div className="grid grid-cols-3 gap-2 mt-3">
                    {metric.front_photo_url && (
                      <div className="aspect-[3/4] relative rounded-lg overflow-hidden bg-muted">
                        <img 
                          src={metric.front_photo_url} 
                          alt="Voorkant"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute bottom-0 left-0 right-0 bg-black/50 py-1 text-center">
                          <p className="text-xs text-white">Voor</p>
                        </div>
                      </div>
                    )}
                    {metric.side_photo_url && (
                      <div className="aspect-[3/4] relative rounded-lg overflow-hidden bg-muted">
                        <img 
                          src={metric.side_photo_url} 
                          alt="Zijkant"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute bottom-0 left-0 right-0 bg-black/50 py-1 text-center">
                          <p className="text-xs text-white">Zij</p>
                        </div>
                      </div>
                    )}
                    {metric.back_photo_url && (
                      <div className="aspect-[3/4] relative rounded-lg overflow-hidden bg-muted">
                        <img 
                          src={metric.back_photo_url} 
                          alt="Achterkant"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute bottom-0 left-0 right-0 bg-black/50 py-1 text-center">
                          <p className="text-xs text-white">Achter</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Notes */}
                {metric.notes && (
                  <div className="p-3 rounded-lg bg-muted/50 border-l-2 border-primary">
                    <p className="text-sm text-muted-foreground">{metric.notes}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
