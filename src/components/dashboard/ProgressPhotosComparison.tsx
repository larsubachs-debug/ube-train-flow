import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useBodyMetrics } from "@/hooks/useBodyMetrics";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { Camera, ArrowRight } from "lucide-react";
import { PhotoUploadDialog } from "./PhotoUploadDialog";

interface ProgressPhotosComparisonProps {
  userId: string;
}

export const ProgressPhotosComparison = ({ userId }: ProgressPhotosComparisonProps) => {
  const { metrics, isLoading } = useBodyMetrics(userId);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Voor & Na Foto's</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[400px]" />
        </CardContent>
      </Card>
    );
  }

  // Get first and latest metrics with photos
  const metricsWithPhotos = metrics?.filter(m => 
    m.front_photo_url || m.side_photo_url || m.back_photo_url
  ) || [];

  const firstMetric = metricsWithPhotos[metricsWithPhotos.length - 1];
  const latestMetric = metricsWithPhotos[0];

  if (metricsWithPhotos.length === 0) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Voor & Na Foto's</CardTitle>
          <PhotoUploadDialog userId={userId} />
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Camera className="w-16 h-16 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">
              Nog geen progress foto's. Upload foto's om je transformatie te volgen!
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const PhotoSet = ({ metric, label }: { metric: typeof firstMetric; label: string }) => (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">
          {format(new Date(metric.recorded_at), 'dd MMM yyyy', { locale: nl })}
        </p>
      </div>
      <div className="grid grid-cols-3 gap-2">
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
    </div>
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Voor & Na Foto's</CardTitle>
        <PhotoUploadDialog userId={userId} />
      </CardHeader>
      <CardContent className="space-y-6">
        {firstMetric && latestMetric && firstMetric.id !== latestMetric.id ? (
          <>
            <PhotoSet metric={firstMetric} label="Start" />
            <div className="flex items-center justify-center">
              <ArrowRight className="w-6 h-6 text-accent" />
            </div>
            <PhotoSet metric={latestMetric} label="Huidig" />
          </>
        ) : (
          <PhotoSet metric={latestMetric} label="Huidig" />
        )}
      </CardContent>
    </Card>
  );
};
