var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/index.ts
import express2 from "express";

// server/routes.ts
import { createServer } from "http";

// db/index.ts
import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";

// db/schema.ts
var schema_exports = {};
__export(schema_exports, {
  categories: () => categories,
  categoryRelations: () => categoryRelations,
  commentRelations: () => commentRelations,
  comments: () => comments,
  entries: () => entries,
  entryRelations: () => entryRelations,
  insertCategorySchema: () => insertCategorySchema,
  insertCommentSchema: () => insertCommentSchema,
  insertEntrySchema: () => insertEntrySchema,
  insertMediaSchema: () => insertMediaSchema,
  media: () => media,
  mediaRelations: () => mediaRelations,
  selectCategorySchema: () => selectCategorySchema,
  selectCommentSchema: () => selectCommentSchema,
  selectEntrySchema: () => selectEntrySchema,
  selectMediaSchema: () => selectMediaSchema
});
import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";
var categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
var entries = pgTable("entries", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  categoryId: integer("category_id").references(() => categories.id),
  date: timestamp("date").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});
var media = pgTable("media", {
  id: serial("id").primaryKey(),
  entryId: integer("entry_id").references(() => entries.id, { onDelete: "cascade" }).notNull(),
  type: text("type").notNull(),
  url: text("url").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
var comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  entryId: integer("entry_id").references(() => entries.id, { onDelete: "cascade" }).notNull(),
  content: text("content").notNull(),
  authorName: text("author_name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
var categoryRelations = relations(categories, ({ many }) => ({
  entries: many(entries)
}));
var entryRelations = relations(entries, ({ one, many }) => ({
  category: one(categories, {
    fields: [entries.categoryId],
    references: [categories.id]
  }),
  media: many(media),
  comments: many(comments)
}));
var mediaRelations = relations(media, ({ one }) => ({
  entry: one(entries, {
    fields: [media.entryId],
    references: [entries.id]
  })
}));
var commentRelations = relations(comments, ({ one }) => ({
  entry: one(entries, {
    fields: [comments.entryId],
    references: [entries.id]
  })
}));
var insertCategorySchema = createInsertSchema(categories);
var selectCategorySchema = createSelectSchema(categories);
var insertEntrySchema = createInsertSchema(entries);
var selectEntrySchema = createSelectSchema(entries);
var insertMediaSchema = createInsertSchema(media);
var selectMediaSchema = createSelectSchema(media);
var insertCommentSchema = createInsertSchema(comments);
var selectCommentSchema = createSelectSchema(comments);

// db/index.ts
neonConfig.webSocketConstructor = ws;
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?"
  );
}
var pool = new Pool({ connectionString: process.env.DATABASE_URL });
var db = drizzle({ client: pool, schema: schema_exports });

// server/routes.ts
import { eq } from "drizzle-orm";
import multer from "multer";
import path from "path";
import { v4 as uuidv4 } from "uuid";
var storage = multer.diskStorage({
  destination: function(_req, _file, cb) {
    cb(null, "uploads/");
  },
  filename: function(_req, file, cb) {
    const uniqueSuffix = uuidv4();
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
var upload = multer({ storage });
function registerRoutes(app2) {
  app2.get("/api/categories", async (_req, res) => {
    try {
      const allCategories = await db.query.categories.findMany({
        orderBy: (categories2, { asc }) => [asc(categories2.name)]
      });
      res.json(allCategories);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la r\xE9cup\xE9ration des cat\xE9gories" });
    }
  });
  app2.post("/api/categories", async (req, res) => {
    try {
      const { name, description } = req.body;
      const [category] = await db.insert(categories).values({
        name,
        description
      }).returning();
      res.json(category);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la cr\xE9ation de la cat\xE9gorie" });
    }
  });
  app2.get("/api/entries", async (_req, res) => {
    try {
      const allEntries = await db.query.entries.findMany({
        orderBy: (entries2, { desc }) => [desc(entries2.date)],
        with: {
          category: true
        }
      });
      res.json(allEntries);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la r\xE9cup\xE9ration des entr\xE9es" });
    }
  });
  app2.get("/api/entries/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const entry = await db.query.entries.findFirst({
        where: eq(entries.id, parseInt(id)),
        with: {
          category: true
        }
      });
      if (!entry) {
        return res.status(404).json({ message: "Entr\xE9e non trouv\xE9e" });
      }
      res.json(entry);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la r\xE9cup\xE9ration de l'entr\xE9e" });
    }
  });
  app2.post("/api/entries", async (req, res) => {
    try {
      const { title, content, categoryId } = req.body;
      const [entry] = await db.insert(entries).values({
        title,
        content,
        categoryId: categoryId || null
      }).returning();
      res.json(entry);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la cr\xE9ation de l'entr\xE9e" });
    }
  });
  app2.patch("/api/entries/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { title, content, categoryId } = req.body;
      const [updated] = await db.update(entries).set({
        title,
        content,
        categoryId: categoryId || null,
        updatedAt: /* @__PURE__ */ new Date()
      }).where(eq(entries.id, parseInt(id))).returning();
      res.json(updated);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la mise \xE0 jour de l'entr\xE9e" });
    }
  });
  app2.delete("/api/entries/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await db.delete(entries).where(eq(entries.id, parseInt(id)));
      res.json({ message: "Entr\xE9e supprim\xE9e avec succ\xE8s" });
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la suppression de l'entr\xE9e" });
    }
  });
  app2.get("/api/entries/:entryId/comments", async (req, res) => {
    try {
      const { entryId } = req.params;
      const entryComments = await db.query.comments.findMany({
        where: eq(comments.entryId, parseInt(entryId)),
        orderBy: (comments2, { desc }) => [desc(comments2.createdAt)]
      });
      res.json(entryComments);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la r\xE9cup\xE9ration des commentaires" });
    }
  });
  app2.post("/api/entries/:entryId/comments", async (req, res) => {
    try {
      const { entryId } = req.params;
      const { content, authorName } = req.body;
      const [comment] = await db.insert(comments).values({
        entryId: parseInt(entryId),
        content,
        authorName
      }).returning();
      res.json(comment);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de l'ajout du commentaire" });
    }
  });
  app2.delete("/api/comments/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await db.delete(comments).where(eq(comments.id, parseInt(id)));
      res.json({ message: "Commentaire supprim\xE9 avec succ\xE8s" });
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la suppression du commentaire" });
    }
  });
  app2.get("/api/entries/:entryId/media", async (req, res) => {
    try {
      const { entryId } = req.params;
      const entryMedia = await db.query.media.findMany({
        where: eq(media.entryId, parseInt(entryId)),
        orderBy: (media2, { desc }) => [desc(media2.createdAt)]
      });
      res.json(entryMedia);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la r\xE9cup\xE9ration des m\xE9dias" });
    }
  });
  app2.post("/api/entries/:entryId/media", upload.single("file"), async (req, res) => {
    try {
      const { entryId } = req.params;
      const file = req.file;
      if (!file) {
        return res.status(400).json({ message: "Aucun fichier n'a \xE9t\xE9 t\xE9l\xE9charg\xE9" });
      }
      const fileType = file.mimetype.startsWith("image/") ? "image" : file.mimetype.startsWith("video/") ? "video" : file.mimetype === "application/pdf" ? "pdf" : "other";
      const [mediaItem] = await db.insert(media).values({
        entryId: parseInt(entryId),
        type: fileType,
        url: `/uploads/${file.filename}`
      }).returning();
      res.json(mediaItem);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors du t\xE9l\xE9chargement du m\xE9dia" });
    }
  });
  app2.delete("/api/media/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await db.delete(media).where(eq(media.id, parseInt(id)));
      res.json({ message: "M\xE9dia supprim\xE9 avec succ\xE8s" });
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la suppression du m\xE9dia" });
    }
  });
  const httpServer = createServer(app2);
  return httpServer;
}

// server/vite.ts
import express from "express";
import fs from "fs";
import path3, { dirname as dirname2 } from "path";
import { fileURLToPath as fileURLToPath2 } from "url";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import themePlugin from "@replit/vite-plugin-shadcn-theme-json";
import path2, { dirname } from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
import { fileURLToPath } from "url";
var __filename = fileURLToPath(import.meta.url);
var __dirname = dirname(__filename);
var vite_config_default = defineConfig({
  plugins: [react(), runtimeErrorOverlay(), themePlugin()],
  resolve: {
    alias: {
      "@db": path2.resolve(__dirname, "db"),
      "@": path2.resolve(__dirname, "client", "src")
    }
  },
  root: path2.resolve(__dirname, "client"),
  build: {
    outDir: path2.resolve(__dirname, "dist/public"),
    emptyOutDir: true
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var __filename2 = fileURLToPath2(import.meta.url);
var __dirname2 = dirname2(__filename2);
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: {
      middlewareMode: true,
      hmr: { server }
    },
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path3.resolve(
        __dirname2,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(`src="/src/main.tsx"`, `src="/src/main.tsx?v=${nanoid()}"`);
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path3.resolve(__dirname2, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path3.resolve(distPath, "index.html"));
  });
}

// server/index.ts
import path4 from "path";
import fs2 from "fs";
var app = express2();
app.use(express2.json());
app.use(express2.urlencoded({ extended: false }));
var uploadsDir = path4.join(process.cwd(), "uploads");
if (!fs2.existsSync(uploadsDir)) {
  fs2.mkdirSync(uploadsDir);
}
app.use("/uploads", express2.static(uploadsDir));
app.use((req, res, next) => {
  const start = Date.now();
  const path5 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path5.startsWith("/api")) {
      let logLine = `${req.method} ${path5} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const server = registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const PORT = 5e3;
  server.listen(PORT, "0.0.0.0", () => {
    log(`serving on port ${PORT}`);
  });
})();
