import type { Express } from "express";
import { createServer, type Server } from "http";
import { db } from "@db";
import { entries } from "@db/schema";
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

  const httpServer = createServer(app);
  return httpServer;
}
