import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { CategorySelect } from "@/components/category-select";
import { MediaUpload } from "@/components/media-upload";
import { MediaViewer } from "@/components/media-viewer";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { Media } from "@db/schema";

interface EditorProps {
  onSave: () => void;
  initialTitle?: string;
  initialContent?: string;
  initialCategoryId?: number | null;
  isEdit?: boolean;
  entryId?: number;
}

export function Editor({ 
  onSave, 
  initialTitle = "", 
  initialContent = "", 
  initialCategoryId = null,
  isEdit = false, 
  entryId 
}: EditorProps) {
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);
  const [categoryId, setCategoryId] = useState<number | null>(initialCategoryId);
  const [isSaving, setIsSaving] = useState(false);
  const [savedEntryId, setSavedEntryId] = useState<number | undefined>(entryId);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: media = [], refetch: refetchMedia } = useQuery<Media[]>({
    queryKey: [`/api/entries/${savedEntryId}/media`],
    enabled: !!savedEntryId,
  });

  const handleSave = async () => {
    if (!title || !content) {
      toast({
        title: "Erreur",
        description: "Le titre et le contenu sont requis",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      if (isEdit && entryId) {
        await apiRequest("PATCH", `/api/entries/${entryId}`, { 
          title, 
          content,
          categoryId 
        });
      } else {
        const response = await apiRequest("POST", "/api/entries", { 
          title, 
          content,
          categoryId 
        });
        const newEntry = await response.json();
        setSavedEntryId(newEntry.id);
      }
      toast({
        title: "Succès",
        description: "Votre entrée a été sauvegardée",
      });
      onSave();
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder l'entrée",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="p-4">
      <Input
        placeholder="Titre de l'entrée"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="mb-4 text-xl font-semibold"
      />
      <div className="mb-4">
        <CategorySelect value={categoryId} onChange={setCategoryId} />
      </div>
      <Textarea
        placeholder="Contenu de votre entrée..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="min-h-[200px] mb-4"
      />
      {savedEntryId && (
        <div className="space-y-4 mb-4">
          <h3 className="text-lg font-semibold">Fichiers joints</h3>
          <MediaUpload entryId={savedEntryId} onUploadComplete={refetchMedia} />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {media.map((item) => (
              <MediaViewer key={item.id} media={item} entryId={savedEntryId} />
            ))}
          </div>
        </div>
      )}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? "Sauvegarde..." : isEdit ? "Mettre à jour" : "Publier"}
        </Button>
      </div>
    </Card>
  );
}