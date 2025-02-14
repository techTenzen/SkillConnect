import { pgTable, text, serial, integer, boolean, jsonb, uuid, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  bio: text("bio"),
  avatar: text("avatar"),
  skills: jsonb("skills").$type<Record<string, number>>(),
  social: jsonb("social").$type<{github?: string, linkedin?: string}>(),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  ownerId: integer("owner_id").notNull(),
  skills: jsonb("skills").$type<string[]>(),
  tools: jsonb("tools").$type<string[]>(),
  rolesSought: jsonb("roles_sought").$type<string[]>(),
  setting: text("setting").notNull().default("in-person"),
  location: text("location"),
  deadline: text("deadline").notNull(),
  status: text("status").notNull().default("open"),
  members: jsonb("members").$type<number[]>(),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

export const discussions = pgTable("discussions", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  authorId: integer("author_id").notNull(),
  category: text("category").notNull(),
  upvotes: integer("upvotes").notNull().default(0),
  createdAt: text("created_at").notNull(),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

export const sessions = pgTable("sessions", {
  sid: text("sid").primaryKey(),
  sess: jsonb("sess").notNull(),
  expire: text("expire").notNull(),
});

// Schema types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Project = typeof projects.$inferSelect;
export type Discussion = typeof discussions.$inferSelect;

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  bio: true,
  avatar: true,
  skills: true,
  social: true,
});

export const insertProjectSchema = createInsertSchema(projects).pick({
  title: true,
  description: true,
  skills: true,
  tools: true,
  rolesSought: true,
  setting: true,
  location: true,
  deadline: true,
});

export const insertDiscussionSchema = createInsertSchema(discussions).pick({
  title: true,
  content: true,
  category: true,
});