import type { Express } from "express";
import { createServer, type Server } from "http";
import { db } from "@db";
import { entries, comments } from "@db/schema";
import { eq } from "drizzle-orm";

export function registerRoutes(app: Express): Server {
  // Get all entries
  app.get("/api/entries", async (_req, res) => {
    try {
      const allEntries = await db.query.entries.findMany({
        orderBy: (entries, { desc }) => [desc(entries.date)],
      });
      res.json(allEntries);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération des entrées" });
    }
  });

  // Get single entry
  app.get("/api/entries/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const entry = await db.query.entries.findFirst({
        where: eq(entries.id, parseInt(id)),
      });

      if (!entry) {
        return res.status(404).json({ message: "Entrée non trouvée" });
      }

      res.json(entry);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération de l'entrée" });
    }
  });

  // Create new entry
  app.post("/api/entries", async (req, res) => {
    try {
      const { title, content } = req.body;
      const [entry] = await db.insert(entries).values({
        title,
        content,
      }).returning();
      res.json(entry);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la création de l'entrée" });
    }
  });

  // Update entry
  app.patch("/api/entries/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { title, content } = req.body;
      const [updated] = await db.update(entries)
        .set({
          title,
          content,
          updatedAt: new Date(),
        })
        .where(eq(entries.id, parseInt(id)))
        .returning();
      res.json(updated);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la mise à jour de l'entrée" });
    }
  });

  // Delete entry
  app.delete("/api/entries/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await db.delete(entries).where(eq(entries.id, parseInt(id)));
      res.json({ message: "Entrée supprimée avec succès" });
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la suppression de l'entrée" });
    }
  });

  // Get comments for an entry
  app.get("/api/entries/:entryId/comments", async (req, res) => {
    try {
      const { entryId } = req.params;
      const entryComments = await db.query.comments.findMany({
        where: eq(comments.entryId, parseInt(entryId)),
        orderBy: (comments, { desc }) => [desc(comments.createdAt)],
      });
      res.json(entryComments);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération des commentaires" });
    }
  });

  // Add a comment to an entry
  app.post("/api/entries/:entryId/comments", async (req, res) => {
    try {
      const { entryId } = req.params;
      const { content, authorName } = req.body;
      const [comment] = await db.insert(comments).values({
        entryId: parseInt(entryId),
        content,
        authorName,
      }).returning();
      res.json(comment);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de l'ajout du commentaire" });
    }
  });

  // Delete a comment
  app.delete("/api/comments/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await db.delete(comments).where(eq(comments.id, parseInt(id)));
      res.json({ message: "Commentaire supprimé avec succès" });
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la suppression du commentaire" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}