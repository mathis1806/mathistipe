import type { Express } from "express";
import { createServer, type Server } from "http";
import { db } from "@db";
import { entries, comments, categories, media } from "@db/schema";
import { eq } from "drizzle-orm";
import multer from "multer";
import path from "path";
import { v4 as uuidv4 } from "uuid";

const storage = multer.diskStorage({
  destination: function (_req, _file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (_req, file, cb) {
    const uniqueSuffix = uuidv4();
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

export function registerRoutes(app: Express): Server {
  // Get all categories
  app.get("/api/categories", async (_req, res) => {
    try {
      const allCategories = await db.query.categories.findMany({
        orderBy: (categories, { asc }) => [asc(categories.name)],
      });
      res.json(allCategories);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération des catégories" });
    }
  });

  // Create new category
  app.post("/api/categories", async (req, res) => {
    try {
      const { name, description } = req.body;
      const [category] = await db.insert(categories).values({
        name,
        description,
      }).returning();
      res.json(category);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la création de la catégorie" });
    }
  });

  // Get all entries
  app.get("/api/entries", async (_req, res) => {
    try {
      const allEntries = await db.query.entries.findMany({
        orderBy: (entries, { desc }) => [desc(entries.date)],
        with: {
          category: true,
        },
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
        with: {
          category: true,
        },
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
      const { title, content, categoryId } = req.body;
      const [entry] = await db.insert(entries).values({
        title,
        content,
        categoryId: categoryId || null,
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
      const { title, content, categoryId } = req.body;
      const [updated] = await db.update(entries)
        .set({
          title,
          content,
          categoryId: categoryId || null,
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

  // Get media for an entry
  app.get("/api/entries/:entryId/media", async (req, res) => {
    try {
      const { entryId } = req.params;
      const entryMedia = await db.query.media.findMany({
        where: eq(media.entryId, parseInt(entryId)),
        orderBy: (media, { desc }) => [desc(media.createdAt)],
      });
      res.json(entryMedia);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération des médias" });
    }
  });

  // Upload media for an entry
  app.post("/api/entries/:entryId/media", upload.single('file'), async (req, res) => {
    try {
      const { entryId } = req.params;
      const file = req.file;

      if (!file) {
        return res.status(400).json({ message: "Aucun fichier n'a été téléchargé" });
      }

      const fileType = file.mimetype.startsWith('image/') ? 'image' :
                      file.mimetype.startsWith('video/') ? 'video' :
                      file.mimetype === 'application/pdf' ? 'pdf' : 'other';

      const [mediaItem] = await db.insert(media).values({
        entryId: parseInt(entryId),
        type: fileType,
        url: `/uploads/${file.filename}`,
      }).returning();

      res.json(mediaItem);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors du téléchargement du média" });
    }
  });

  // Delete media
  app.delete("/api/media/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await db.delete(media).where(eq(media.id, parseInt(id)));
      res.json({ message: "Média supprimé avec succès" });
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la suppression du média" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}