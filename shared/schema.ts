import { pgTable, text, serial, integer, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  bio: text("bio"),
  avatar: text("avatar"),
  skills: jsonb("skills").$type<Record<string, number>>().default({}),
  social: jsonb("social").$type<{github?: string, linkedin?: string}>().default({}),
});

export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  ownerId: integer("owner_id").notNull(),
  skills: jsonb("skills").$type<string[]>(),
  members: jsonb("members").$type<number[]>(),
  status: text("status").notNull().default("open"),
});

export const discussions = pgTable("discussions", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  authorId: integer("author_id").notNull(),
  category: text("category").notNull(),
  upvotes: integer("upvotes").notNull().default(0),
  createdAt: text("created_at").notNull(),
});

export const insertUserSchema = createInsertSchema(users);
export const insertProjectSchema = createInsertSchema(projects, {
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  ownerId: z.number(),
  skills: z.array(z.string()),
  status: z.string().optional(),
});
export const insertDiscussionSchema = createInsertSchema(discussions);

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Project = typeof projects.$inferSelect;
export type Discussion = typeof discussions.$inferSelect;