import { useState } from 'react';
import { Play, Trash2, ExternalLink } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface MediaItem {
  id: string;
  url: string;
  type: 'image' | 'video';
  name: string;
  size?: number;
  width?: number;
  height?: number;
  duration?: number;
}

interface MediaGalleryProps {
  items: MediaItem[];
  onDelete?: (id: string) => void;
  className?: string;
}

export const MediaGallery = ({ items, onDelete, className }: MediaGalleryProps) => {
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <>
      <div className={cn('grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4', className)}>
        {items.map((item) => (
          <Card key={item.id} className="overflow-hidden group">
            <CardContent className="p-0">
              <div className="relative aspect-square">
                {item.type === 'video' ? (
                  <>
                    <video
                      src={item.url}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <Play className="h-12 w-12 text-white" />
                    </div>
                  </>
                ) : (
                  <img
                    src={item.url}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                )}
                
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="absolute bottom-0 left-0 right-0 p-3 space-y-2">
                    <p className="text-white text-sm font-medium truncate">
                      {item.name}
                    </p>
                    <div className="flex items-center gap-1 text-white/80 text-xs">
                      {item.width && item.height && (
                        <span>{item.width} × {item.height}</span>
                      )}
                      {item.duration && (
                        <span> • {formatDuration(item.duration)}</span>
                      )}
                      {item.size && (
                        <span> • {formatFileSize(item.size)}</span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        className="flex-1"
                        onClick={() => setSelectedMedia(item)}
                      >
                        <ExternalLink className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      {onDelete && (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => onDelete(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={!!selectedMedia} onOpenChange={() => setSelectedMedia(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{selectedMedia?.name}</DialogTitle>
          </DialogHeader>
          {selectedMedia && (
            <div className="space-y-4">
              {selectedMedia.type === 'video' ? (
                <video
                  src={selectedMedia.url}
                  className="w-full rounded-lg"
                  controls
                  autoPlay
                />
              ) : (
                <img
                  src={selectedMedia.url}
                  alt={selectedMedia.name}
                  className="w-full rounded-lg"
                />
              )}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Type:</span>{' '}
                  <span className="font-medium">{selectedMedia.type}</span>
                </div>
                {selectedMedia.width && selectedMedia.height && (
                  <div>
                    <span className="text-muted-foreground">Dimensions:</span>{' '}
                    <span className="font-medium">
                      {selectedMedia.width} × {selectedMedia.height}
                    </span>
                  </div>
                )}
                {selectedMedia.duration && (
                  <div>
                    <span className="text-muted-foreground">Duration:</span>{' '}
                    <span className="font-medium">
                      {formatDuration(selectedMedia.duration)}
                    </span>
                  </div>
                )}
                {selectedMedia.size && (
                  <div>
                    <span className="text-muted-foreground">Size:</span>{' '}
                    <span className="font-medium">
                      {formatFileSize(selectedMedia.size)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
