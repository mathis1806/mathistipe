import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";

export const entries = pgTable("entries", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  date: timestamp("date").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const media = pgTable("media", {
  id: serial("id").primaryKey(),
  entryId: integer("entry_id").references(() => entries.id, { onDelete: "cascade" }).notNull(),
  type: text("type").notNull(), // 'image' or 'video'
  url: text("url").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const entryRelations = relations(entries, ({ many }) => ({
  media: many(media),
}));

export const mediaRelations = relations(media, ({ one }) => ({
  entry: one(entries, {
    fields: [media.entryId],
    references: [entries.id],
  }),
}));

export const insertEntrySchema = createInsertSchema(entries);
export const selectEntrySchema = createSelectSchema(entries);
export const insertMediaSchema = createInsertSchema(media);
export const selectMediaSchema = createSelectSchema(media);

export type Entry = typeof entries.$inferSelect;
export type InsertEntry = typeof entries.$inferInsert;
export type Media = typeof media.$inferSelect;
export type InsertMedia = typeof media.$inferInsert;
