import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import type { Entry, Media } from "@db/schema";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, MessageSquare, Tag, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";

interface EntryCardProps {
  entry: Entry;
  onEdit: (entry: Entry) => void;
}

export function EntryCard({ entry, onEdit }: EntryCardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: comments = [] } = useQuery({
    queryKey: [`/api/entries/${entry.id}/comments`],
  });

  const { data: media = [] } = useQuery<Media[]>({
    queryKey: [`/api/entries/${entry.id}/media`],
  });

  const handleDelete = async () => {
    try {
      await apiRequest("DELETE", `/api/entries/${entry.id}`);
      await queryClient.invalidateQueries({ queryKey: ["/api/entries"] });
      toast({
        title: "Succès",
        description: "L'entrée a été supprimée",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer l'entrée",
        variant: "destructive",
      });
    }
  };

  const renderMediaPreview = () => {
    if (media.length === 0) return null;

    const firstMedia = media[0];
    switch (firstMedia.type) {
      case 'image':
        return (
          <div className="relative mt-4 group">
            <img
              src={firstMedia.url}
              alt="Aperçu"
              className="w-full h-48 object-cover rounded-md"
            />
            {media.length > 1 && (
              <div className="absolute bottom-2 right-2 bg-black/75 text-white px-2 py-1 rounded-md text-sm">
                +{media.length - 1}
              </div>
            )}
          </div>
        );
      case 'video':
        return (
          <div className="mt-4 relative group">
            <video
              src={firstMedia.url}
              className="w-full h-48 object-cover rounded-md"
            />
            {media.length > 1 && (
              <div className="absolute bottom-2 right-2 bg-black/75 text-white px-2 py-1 rounded-md text-sm">
                +{media.length - 1}
              </div>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Card className="mb-4">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <CardTitle>{entry.title}</CardTitle>
          {entry.categoryId && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <Tag className="h-3 w-3" />
              {entry.category?.name}
            </Badge>
          )}
        </div>
        <div className="flex gap-2">
          <Link href={`/entry/${entry.id}`}>
            <Button variant="outline" size="icon">
              <ExternalLink className="h-4 w-4" />
            </Button>
          </Link>
          <Link href={`/entry/${entry.id}`}>
            <Button variant="outline" size="icon" className="relative">
              <MessageSquare className="h-4 w-4" />
              {comments.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {comments.length}
                </span>
              )}
            </Button>
          </Link>
          <Button variant="outline" size="icon" onClick={() => onEdit(entry)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="destructive" size="icon" onClick={handleDelete}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-sm text-muted-foreground mb-2">
          {format(new Date(entry.date), "PPP", { locale: fr })}
        </div>
        <p className="whitespace-pre-wrap">{entry.content}</p>
        {renderMediaPreview()}
      </CardContent>
    </Card>
  );
}