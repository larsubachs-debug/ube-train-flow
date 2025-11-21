import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useBodyMetrics } from "@/hooks/useBodyMetrics";
import { supabase } from "@/integrations/supabase/client";
import { Camera, Upload } from "lucide-react";
import { toast } from "sonner";

interface PhotoUploadDialogProps {
  userId: string;
  metricId?: string;
}

export const PhotoUploadDialog = ({ userId, metricId }: PhotoUploadDialogProps) => {
  const { addMetric, updateMetric } = useBodyMetrics(userId);
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [photos, setPhotos] = useState<{
    front: File | null;
    side: File | null;
    back: File | null;
  }>({
    front: null,
    side: null,
    back: null,
  });

  const uploadPhoto = async (file: File, type: string): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${Date.now()}_${type}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('body-composition')
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('body-composition')
      .getPublicUrl(fileName);

    return publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);

    try {
      const photoUrls: {
        front_photo_url?: string;
        side_photo_url?: string;
        back_photo_url?: string;
      } = {};

      if (photos.front) {
        photoUrls.front_photo_url = await uploadPhoto(photos.front, 'front');
      }
      if (photos.side) {
        photoUrls.side_photo_url = await uploadPhoto(photos.side, 'side');
      }
      if (photos.back) {
        photoUrls.back_photo_url = await uploadPhoto(photos.back, 'back');
      }

      if (metricId) {
        await updateMetric.mutateAsync({
          id: metricId,
          ...photoUrls,
        });
      } else {
        await addMetric.mutateAsync({
          recorded_at: new Date().toISOString(),
          weight: null,
          body_fat_percentage: null,
          muscle_mass: null,
          notes: "Progress foto's",
          front_photo_url: photoUrls.front_photo_url || null,
          side_photo_url: photoUrls.side_photo_url || null,
          back_photo_url: photoUrls.back_photo_url || null,
        });
      }

      setPhotos({ front: null, side: null, back: null });
      setOpen(false);
      toast.success("Foto's succesvol geüpload!");
    } catch (error: any) {
      toast.error("Fout bij uploaden: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Camera className="w-4 h-4 mr-2" />
          Foto's Uploaden
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Progress Foto's Uploaden</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="front">Voorkant Foto</Label>
            <Input
              id="front"
              type="file"
              accept="image/*"
              onChange={(e) => setPhotos({ ...photos, front: e.target.files?.[0] || null })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="side">Zijkant Foto</Label>
            <Input
              id="side"
              type="file"
              accept="image/*"
              onChange={(e) => setPhotos({ ...photos, side: e.target.files?.[0] || null })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="back">Achterkant Foto</Label>
            <Input
              id="back"
              type="file"
              accept="image/*"
              onChange={(e) => setPhotos({ ...photos, back: e.target.files?.[0] || null })}
            />
          </div>
          <Button 
            type="submit" 
            className="w-full" 
            disabled={uploading || (!photos.front && !photos.side && !photos.back)}
          >
            {uploading ? (
              <>
                <Upload className="w-4 h-4 mr-2 animate-spin" />
                Uploaden...
              </>
            ) : (
              "Uploaden"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// Add missing Input import
import { Input } from "@/components/ui/input";
