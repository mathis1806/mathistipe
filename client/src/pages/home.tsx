import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Editor } from "@/components/editor";
import { EntryCard } from "@/components/entry-card";
import { SearchBar } from "@/components/search-bar";
import type { Entry } from "@db/schema";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function Home() {
  const [search, setSearch] = useState("");
  const [editingEntry, setEditingEntry] = useState<Entry | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const { data: entries = [], isLoading } = useQuery<Entry[]>({
    queryKey: ["/api/entries"],
  });

  const filteredEntries = entries.filter(
    (entry) =>
      entry.title.toLowerCase().includes(search.toLowerCase()) ||
      entry.content.toLowerCase().includes(search.toLowerCase())
  );

  const handleSave = () => {
    setIsCreating(false);
    setEditingEntry(null);
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-4xl font-bold mb-8">Journal de Bord</h1>
      
      <div className="flex justify-between items-center mb-6">
        <div className="w-1/2">
          <SearchBar value={search} onChange={setSearch} />
        </div>
        <Button onClick={() => setIsCreating(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nouvelle entrée
        </Button>
      </div>

      {(isCreating || editingEntry) && (
        <div className="mb-8">
          <Editor
            onSave={handleSave}
            initialTitle={editingEntry?.title}
            initialContent={editingEntry?.content}
            isEdit={!!editingEntry}
            entryId={editingEntry?.id}
          />
        </div>
      )}

      {isLoading ? (
        <div>Chargement...</div>
      ) : filteredEntries.length === 0 ? (
        <div className="text-center text-muted-foreground">
          Aucune entrée trouvée
        </div>
      ) : (
        filteredEntries.map((entry) => (
          <EntryCard
            key={entry.id}
            entry={entry}
            onEdit={(entry) => setEditingEntry(entry)}
          />
        ))
      )}
    </div>
  );
}
