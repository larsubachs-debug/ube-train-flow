import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MediaUploadZone } from '@/components/media/MediaUploadZone';
import { MediaGallery } from '@/components/media/MediaGallery';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import ubeLogo from '@/assets/ube-logo.png';

interface MediaItem {
  id: string;
  url: string;
  type: 'image' | 'video';
  name: string;
  size?: number;
  width?: number;
  height?: number;
  duration?: number;
  bucket: string;
}

export default function Media() {
  const [programMedia, setProgramMedia] = useState<MediaItem[]>([]);
  const [exerciseMedia, setExerciseMedia] = useState<MediaItem[]>([]);
  const [coachVideos, setCoachVideos] = useState<MediaItem[]>([]);
  const [communityMedia, setCommunityMedia] = useState<MediaItem[]>([]);
  const [checkinMedia, setCheckinMedia] = useState<MediaItem[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    loadAllMedia();
  }, []);

  const loadAllMedia = async () => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      const { data: mediaData, error } = await supabase
        .from('media')
        .select('*')
        .eq('user_id', user.user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const mappedMedia = mediaData?.map((item) => ({
        id: item.id,
        url: supabase.storage.from(item.bucket_name).getPublicUrl(item.file_path).data.publicUrl,
        type: item.mime_type?.startsWith('video/') ? 'video' as const : 'image' as const,
        name: item.file_name,
        size: item.file_size || undefined,
        width: item.width || undefined,
        height: item.height || undefined,
        duration: item.duration || undefined,
        bucket: item.bucket_name,
      })) || [];

      setProgramMedia(mappedMedia.filter((m) => m.bucket === 'program-images'));
      setExerciseMedia(mappedMedia.filter((m) => m.bucket === 'exercise-media'));
      setCoachVideos(mappedMedia.filter((m) => m.bucket === 'coach-videos'));
      setCommunityMedia(mappedMedia.filter((m) => m.bucket === 'community-uploads'));
      setCheckinMedia(mappedMedia.filter((m) => m.bucket === 'checkin-photos'));
    } catch (error: any) {
      toast({
        title: 'Error loading media',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from('media').delete().eq('id', id);
      if (error) throw error;

      toast({
        title: 'Media deleted',
        description: 'The media has been deleted successfully',
      });

      loadAllMedia();
    } catch (error: any) {
      toast({
        title: 'Error deleting media',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center mb-6">
          <img src={ubeLogo} alt="U.be" className="h-10" />
        </div>
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Media Management</h1>
          <p className="text-muted-foreground">
            Upload and manage all your training media
          </p>
        </div>

        <Tabs defaultValue="programs" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="programs">Programs</TabsTrigger>
            <TabsTrigger value="exercises">Exercises</TabsTrigger>
            <TabsTrigger value="coach">Coach</TabsTrigger>
            <TabsTrigger value="community">Community</TabsTrigger>
            <TabsTrigger value="checkins">Check-ins</TabsTrigger>
          </TabsList>

          <TabsContent value="programs" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Program Images</CardTitle>
                <CardDescription>
                  Upload header images, program tiles, and coaching images
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <h3 className="text-sm font-medium mb-2">Header Image (16:9)</h3>
                    <MediaUploadZone
                      bucket="program-images"
                      folder="headers"
                      accept="image"
                      aspectRatio="16:9"
                      onUploadComplete={loadAllMedia}
                    />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium mb-2">Program Tile (1:1)</h3>
                    <MediaUploadZone
                      bucket="program-images"
                      folder="tiles"
                      accept="image"
                      aspectRatio="1:1"
                      onUploadComplete={loadAllMedia}
                    />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium mb-2">Coaching Image (3:4)</h3>
                    <MediaUploadZone
                      bucket="program-images"
                      folder="coaching"
                      accept="image"
                      aspectRatio="3:4"
                      onUploadComplete={loadAllMedia}
                    />
                  </div>
                </div>
                <MediaGallery items={programMedia} onDelete={handleDelete} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="exercises" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Exercise Media</CardTitle>
                <CardDescription>
                  Upload technique videos and demonstration photos
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium mb-2">Exercise Video (1:1)</h3>
                    <MediaUploadZone
                      bucket="exercise-media"
                      folder="videos"
                      accept="video"
                      aspectRatio="1:1"
                      maxSizeMB={100}
                      onUploadComplete={loadAllMedia}
                    />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium mb-2">Exercise Photo (4:3)</h3>
                    <MediaUploadZone
                      bucket="exercise-media"
                      folder="photos"
                      accept="image"
                      aspectRatio="4:3"
                      onUploadComplete={loadAllMedia}
                    />
                  </div>
                </div>
                <MediaGallery items={exerciseMedia} onDelete={handleDelete} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="coach" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Coach Videos</CardTitle>
                <CardDescription>
                  Upload weekly focus videos and coaching content
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <MediaUploadZone
                  bucket="coach-videos"
                  accept="video"
                  aspectRatio="16:9"
                  maxSizeMB={200}
                  onUploadComplete={loadAllMedia}
                />
                <MediaGallery items={coachVideos} onDelete={handleDelete} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="community" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Community Uploads</CardTitle>
                <CardDescription>
                  User progress photos and coach feedback videos
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <MediaUploadZone
                  bucket="community-uploads"
                  accept="all"
                  aspectRatio="1:1"
                  onUploadComplete={loadAllMedia}
                />
                <MediaGallery items={communityMedia} onDelete={handleDelete} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="checkins" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Check-in Photos</CardTitle>
                <CardDescription>
                  Weekly progress tracking photos
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <MediaUploadZone
                  bucket="checkin-photos"
                  accept="image"
                  aspectRatio="3:4"
                  onUploadComplete={loadAllMedia}
                />
                <MediaGallery items={checkinMedia} onDelete={handleDelete} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
