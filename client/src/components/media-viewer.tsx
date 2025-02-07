import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, ExternalLink, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useQueryClient } from "@tanstack/react-query";
import type { Media } from "@db/schema";

interface MediaViewerProps {
  media: Media;
  entryId: number;
}

export function MediaViewer({ media, entryId }: MediaViewerProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleDelete = async () => {
    try {
      await apiRequest("DELETE", `/api/media/${media.id}`);
      await queryClient.invalidateQueries({
        queryKey: [`/api/entries/${entryId}/media`],
      });
      toast({
        title: "Succès",
        description: "Le fichier a été supprimé",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le fichier",
        variant: "destructive",
      });
    }
  };

  const renderMedia = () => {
    switch (media.type) {
      case 'image':
        return (
          <img
            src={media.url}
            alt="Media"
            className="w-full h-48 object-cover rounded-md"
          />
        );
      case 'video':
        return (
          <video
            src={media.url}
            controls
            className="w-full h-48 object-cover rounded-md"
          />
        );
      case 'pdf':
        return (
          <div className="flex items-center justify-center h-48 bg-muted rounded-md">
            <FileText className="h-12 w-12 text-muted-foreground" />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Card>
      <CardContent className="p-4">
        {renderMedia()}
        <div className="flex justify-end gap-2 mt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(media.url, '_blank')}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Ouvrir
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDelete}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Supprimer
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
