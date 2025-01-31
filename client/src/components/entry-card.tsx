import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import type { Entry } from "@db/schema";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, MessageSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";

interface EntryCardProps {
  entry: Entry;
  onEdit: (entry: Entry) => void;
}

export function EntryCard({ entry, onEdit }: EntryCardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

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

  return (
    <Card className="mb-4">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{entry.title}</CardTitle>
        <div className="flex gap-2">
          <Link href={`/entry/${entry.id}`}>
            <Button variant="outline" size="icon">
              <MessageSquare className="h-4 w-4" />
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
      </CardContent>
    </Card>
  );
}