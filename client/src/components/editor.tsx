import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface EditorProps {
  onSave: () => void;
  initialTitle?: string;
  initialContent?: string;
  isEdit?: boolean;
  entryId?: number;
}

export function Editor({ onSave, initialTitle = "", initialContent = "", isEdit = false, entryId }: EditorProps) {
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

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
        await apiRequest("PATCH", `/api/entries/${entryId}`, { title, content });
      } else {
        await apiRequest("POST", "/api/entries", { title, content });
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
      <Textarea
        placeholder="Contenu de votre entrée..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="min-h-[200px] mb-4"
      />
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? "Sauvegarde..." : isEdit ? "Mettre à jour" : "Publier"}
        </Button>
      </div>
    </Card>
  );
}
