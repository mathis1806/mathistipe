import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Comment } from "@db/schema";
import { Trash2 } from "lucide-react";

interface CommentSectionProps {
  entryId: number;
}

export function CommentSection({ entryId }: CommentSectionProps) {
  const [newComment, setNewComment] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: comments = [], isLoading } = useQuery<Comment[]>({
    queryKey: [`/api/entries/${entryId}/comments`],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment || !authorName) {
      toast({
        title: "Erreur",
        description: "Le nom et le commentaire sont requis",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await apiRequest("POST", `/api/entries/${entryId}/comments`, {
        content: newComment,
        authorName,
      });
      await queryClient.invalidateQueries({
        queryKey: [`/api/entries/${entryId}/comments`],
      });
      setNewComment("");
      setAuthorName("");
      toast({
        title: "Succès",
        description: "Votre commentaire a été ajouté",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter le commentaire",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (commentId: number) => {
    try {
      await apiRequest("DELETE", `/api/comments/${commentId}`);
      await queryClient.invalidateQueries({
        queryKey: [`/api/entries/${entryId}/comments`],
      });
      toast({
        title: "Succès",
        description: "Le commentaire a été supprimé",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le commentaire",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="mt-8">
      <h2 className="text-2xl font-bold mb-4">Commentaires des professeurs</h2>
      
      <Card className="mb-6">
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit}>
            <Input
              placeholder="Votre nom"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              className="mb-4"
            />
            <Textarea
              placeholder="Votre commentaire..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="mb-4"
            />
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Envoi..." : "Ajouter un commentaire"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {isLoading ? (
        <div>Chargement des commentaires...</div>
      ) : comments.length === 0 ? (
        <div className="text-center text-muted-foreground">
          Aucun commentaire pour le moment
        </div>
      ) : (
        comments.map((comment) => (
          <Card key={comment.id} className="mb-4">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <div className="font-semibold">{comment.authorName}</div>
                <div className="text-sm text-muted-foreground">
                  {format(new Date(comment.createdAt), "PPP 'à' HH:mm", {
                    locale: fr,
                  })}
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDelete(comment.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap">{comment.content}</p>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
