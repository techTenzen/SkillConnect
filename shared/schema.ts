import { pgTable, text, serial, integer, boolean, jsonb } from "drizzle-orm/pg-core";
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
  deadline: text("deadline"),
  members: jsonb("members").$type<number[]>(),
  joinRequests: jsonb("join_requests").$type<number[]>(),
  status: text("status").notNull().default("open"),
  membersNeeded: integer("members_needed").default(1),
});

export const discussions = pgTable("discussions", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  authorId: integer("author_id").notNull(),
  category: text("category").notNull(),
  upvotes: integer("upvotes").notNull().default(0),
  createdAt: text("created_at").notNull(),
  upvotedBy: jsonb("upvoted_by").$type<number[]>(),
});

export const replies = pgTable("replies", {
  id: serial("id").primaryKey(),
  discussionId: integer("discussion_id").notNull(),
  authorId: integer("author_id").notNull(),
  content: text("content").notNull(),
  upvotes: integer("upvotes").notNull().default(0),
  upvotedBy: jsonb("upvoted_by").$type<number[]>(),
  createdAt: text("created_at").notNull(),
  parentReplyId: integer("parent_reply_id"), // For nested replies
});

export const invitations = pgTable("invitations", {
  id: serial("id").primaryKey(),
  senderId: integer("sender_id").notNull(),
  recipientId: integer("recipient_id").notNull(),
  projectId: integer("project_id").notNull(),
  status: text("status").notNull().default("pending"), // pending, accepted, declined
  message: text("message"),
  createdAt: text("created_at").notNull(),
});

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
  membersNeeded: true,
});

export const insertDiscussionSchema = createInsertSchema(discussions).pick({
  title: true,
  content: true,
  category: true,
});

export const insertReplySchema = createInsertSchema(replies).pick({
  content: true,
  parentReplyId: true,
});

export const insertInvitationSchema = createInsertSchema(invitations).pick({
  recipientId: true,
  projectId: true,
  message: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertReply = z.infer<typeof insertReplySchema>;
export type InsertInvitation = z.infer<typeof insertInvitationSchema>;
export type User = typeof users.$inferSelect;
export type Project = typeof projects.$inferSelect;
export type Discussion = typeof discussions.$inferSelect;
export type Reply = typeof replies.$inferSelect;
export type Invitation = typeof invitations.$inferSelect;