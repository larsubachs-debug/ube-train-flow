import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Upload, X, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ProgramImageEditorProps {
  programId: string;
  programName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const ProgramImageEditor = ({
  programId,
  programName,
  open,
  onOpenChange,
  onSuccess,
}: ProgramImageEditorProps) => {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [currentImage, setCurrentImage] = useState<string>("");

  useEffect(() => {
    if (open) {
      loadCurrentImage();
    }
  }, [open, programId]);

  const loadCurrentImage = async () => {
    try {
      const { data: programMedia } = await supabase
        .from('program_media')
        .select('media_id, media(file_path)')
        .eq('program_id', programId)
        .eq('media_type', 'tile')
        .single();

      if (programMedia?.media) {
        const mediaData = programMedia.media as any;
        setCurrentImage(mediaData.file_path);
      }
    } catch (error) {
      console.error('Error loading current image:', error);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!imageFile) {
      toast({
        title: "Geen afbeelding",
        description: "Selecteer eerst een afbeelding",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      // Upload nieuwe afbeelding
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${programId}-${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('program-images')
        .upload(fileName, imageFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('program-images')
        .getPublicUrl(fileName);

      // Maak media record aan
      const { data: userData } = await supabase.auth.getUser();
      
      const { data: mediaData, error: mediaError } = await supabase
        .from('media')
        .insert([{
          user_id: userData.user!.id,
          file_name: imageFile.name,
          file_path: publicUrl,
          bucket_name: 'program-images',
          mime_type: imageFile.type,
        }])
        .select()
        .single();

      if (mediaError) throw mediaError;

      // Verwijder oude program_media relatie als die bestaat
      await supabase
        .from('program_media')
        .delete()
        .eq('program_id', programId)
        .eq('media_type', 'tile');

      // Maak nieuwe program_media relatie
      const { error: programMediaError } = await supabase
        .from('program_media')
        .insert([{
          program_id: programId,
          media_id: mediaData.id,
          media_type: 'tile',
          display_order: 0,
        }]);

      if (programMediaError) throw programMediaError;

      toast({
        title: "Succes!",
        description: "Programma afbeelding bijgewerkt",
      });

      setImageFile(null);
      setImagePreview("");
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Programma Afbeelding Bewerken</DialogTitle>
          <DialogDescription>
            Verander de afbeelding voor "{programName}"
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Huidige afbeelding */}
          {currentImage && !imagePreview && (
            <div>
              <Label>Huidige Afbeelding</Label>
              <Card className="mt-2 overflow-hidden">
                <img
                  src={currentImage}
                  alt="Current program"
                  className="w-full h-48 object-cover"
                />
              </Card>
            </div>
          )}

          {/* Preview van nieuwe afbeelding */}
          {imagePreview && (
            <div>
              <Label>Nieuwe Afbeelding</Label>
              <Card className="mt-2 overflow-hidden relative">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-48 object-cover"
                />
                <Button
                  size="sm"
                  variant="destructive"
                  className="absolute top-2 right-2"
                  onClick={() => {
                    setImageFile(null);
                    setImagePreview("");
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </Card>
            </div>
          )}

          {/* Upload button */}
          <div>
            <Label htmlFor="image-upload" className="cursor-pointer">
              <Card className="p-8 border-2 border-dashed hover:border-primary transition-colors">
                <div className="flex flex-col items-center gap-2 text-center">
                  <Upload className="h-8 w-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    {imageFile ? imageFile.name : "Klik om afbeelding te selecteren"}
                  </p>
                </div>
              </Card>
              <input
                id="image-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageSelect}
              />
            </Label>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Annuleren
          </Button>
          <Button onClick={handleSave} disabled={saving || !imageFile}>
            <Save className="mr-2 h-4 w-4" />
            {saving ? "Opslaan..." : "Opslaan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
