import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { Editor } from "@/components/editor";
import { CommentSection } from "@/components/comment-section";
import type { Entry } from "@db/schema";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function EntryPage() {
  const [, params] = useRoute("/entry/:id");
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const entryId = params?.id;

  const { data: entry, isLoading } = useQuery<Entry>({
    queryKey: [`/api/entries/${entryId}`],
    enabled: !!entryId,
  });

  const handleDelete = async () => {
    if (!entryId) return;

    try {
      await apiRequest("DELETE", `/api/entries/${entryId}`);
      toast({
        title: "Succès",
        description: "L'entrée a été supprimée",
      });
      // Redirect to home and invalidate entries cache
      window.location.href = "/";
      await queryClient.invalidateQueries({ queryKey: ["/api/entries"] });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer l'entrée",
        variant: "destructive",
      });
    }
  };

  const handleSave = async () => {
    setIsEditing(false);
    await queryClient.invalidateQueries({ queryKey: [`/api/entries/${entryId}`] });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center mb-8">
          <Link href="/">
            <Button variant="ghost" className="mr-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour
            </Button>
          </Link>
          <Skeleton className="h-8 w-1/3" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-1/4" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-4 w-1/6 mb-4" />
            <Skeleton className="h-32 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!entry) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center mb-8">
          <Link href="/">
            <Button variant="ghost">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour
            </Button>
          </Link>
        </div>
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-muted-foreground">
              Entrée non trouvée
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center">
          <Link href="/">
            <Button variant="ghost" className="mr-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">{entry.title}</h1>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setIsEditing(!isEditing)}
          >
            {isEditing ? "Annuler" : "Modifier"}
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Supprimer
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
                <AlertDialogDescription>
                  Cette action est irréversible. Cette entrée sera définitivement supprimée.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
                  Supprimer
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {isEditing ? (
        <Editor
          onSave={handleSave}
          initialTitle={entry.title}
          initialContent={entry.content}
          isEdit={true}
          entryId={entry.id}
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>{entry.title}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {format(new Date(entry.date), "PPP 'à' HH:mm", { locale: fr })}
              {entry.updatedAt > entry.date && " (modifié)"}
            </p>
          </CardHeader>
          <CardContent>
            <div className="prose prose-slate max-w-none">
              <p className="whitespace-pre-wrap">{entry.content}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {!isEditing && <CommentSection entryId={entry.id} />}
    </div>
  );
}