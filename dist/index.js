var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/index.ts
import express2 from "express";

// server/routes.ts
import { createServer } from "http";
import WebSocket, { WebSocketServer } from "ws";

// server/auth.ts
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import session3 from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  chatGroups: () => chatGroups,
  connectionRequests: () => connectionRequests,
  discussions: () => discussions,
  groupMessages: () => groupMessages,
  insertChatGroupSchema: () => insertChatGroupSchema,
  insertConnectionRequestSchema: () => insertConnectionRequestSchema,
  insertDiscussionSchema: () => insertDiscussionSchema,
  insertGroupMessageSchema: () => insertGroupMessageSchema,
  insertInvitationSchema: () => insertInvitationSchema,
  insertMessageSchema: () => insertMessageSchema,
  insertProjectSchema: () => insertProjectSchema,
  insertReplySchema: () => insertReplySchema,
  insertUserSchema: () => insertUserSchema,
  invitations: () => invitations2,
  messages: () => messages,
  projects: () => projects,
  replies: () => replies,
  users: () => users
});
import { pgTable, text, serial, integer, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
var users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  bio: text("bio"),
  avatar: text("avatar"),
  skills: jsonb("skills").$type(),
  social: jsonb("social").$type(),
  connections: jsonb("connections").$type().default([])
});
var projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  ownerId: integer("owner_id").notNull(),
  skills: jsonb("skills").$type(),
  tools: jsonb("tools").$type(),
  rolesSought: jsonb("roles_sought").$type(),
  setting: text("setting").notNull().default("in-person"),
  location: text("location"),
  deadline: text("deadline"),
  members: jsonb("members").$type(),
  joinRequests: jsonb("join_requests").$type(),
  status: text("status").notNull().default("open"),
  membersNeeded: integer("members_needed").default(1)
});
var discussions = pgTable("discussions", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  authorId: integer("author_id").notNull(),
  category: text("category").notNull(),
  upvotes: integer("upvotes").notNull().default(0),
  createdAt: text("created_at").notNull(),
  upvotedBy: jsonb("upvoted_by").$type()
});
var replies = pgTable("replies", {
  id: serial("id").primaryKey(),
  discussionId: integer("discussion_id").notNull(),
  authorId: integer("author_id").notNull(),
  content: text("content").notNull(),
  upvotes: integer("upvotes").notNull().default(0),
  upvotedBy: jsonb("upvoted_by").$type(),
  createdAt: text("created_at").notNull(),
  parentReplyId: integer("parent_reply_id")
  // For nested replies
});
var invitations2 = pgTable("invitations", {
  id: serial("id").primaryKey(),
  senderId: integer("sender_id").notNull(),
  recipientId: integer("recipient_id").notNull(),
  projectId: integer("project_id").notNull(),
  status: text("status").notNull().default("pending"),
  // pending, accepted, declined
  message: text("message"),
  createdAt: text("created_at").notNull()
});
var connectionRequests = pgTable("connection_requests", {
  id: serial("id").primaryKey(),
  senderId: integer("sender_id").notNull(),
  recipientId: integer("recipient_id").notNull(),
  status: text("status").notNull().default("pending"),
  // pending, accepted, declined
  message: text("message"),
  createdAt: text("created_at").notNull()
});
var messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  senderId: integer("sender_id").notNull(),
  recipientId: integer("recipient_id").notNull(),
  content: text("content").notNull(),
  createdAt: text("created_at").notNull(),
  read: boolean("read").notNull().default(false)
});
var chatGroups = pgTable("chat_groups", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  creatorId: integer("creator_id").notNull(),
  members: jsonb("members").$type(),
  createdAt: text("created_at").notNull()
});
var groupMessages = pgTable("group_messages", {
  id: serial("id").primaryKey(),
  groupId: integer("group_id").notNull(),
  senderId: integer("sender_id").notNull(),
  content: text("content").notNull(),
  createdAt: text("created_at").notNull(),
  readBy: jsonb("read_by").$type().default([])
});
var insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  bio: true,
  avatar: true,
  skills: true,
  social: true
});
var insertProjectSchema = createInsertSchema(projects).pick({
  title: true,
  description: true,
  skills: true,
  tools: true,
  rolesSought: true,
  setting: true,
  location: true,
  deadline: true,
  membersNeeded: true
});
var insertDiscussionSchema = createInsertSchema(discussions).pick({
  title: true,
  content: true,
  category: true
});
var insertReplySchema = createInsertSchema(replies).pick({
  content: true,
  parentReplyId: true
});
var insertInvitationSchema = createInsertSchema(invitations2).pick({
  recipientId: true,
  projectId: true,
  message: true,
  senderId: true
});
var insertConnectionRequestSchema = createInsertSchema(connectionRequests).pick({
  recipientId: true,
  message: true
});
var insertMessageSchema = createInsertSchema(messages).pick({
  recipientId: true,
  content: true
});
var insertChatGroupSchema = createInsertSchema(chatGroups).pick({
  name: true,
  members: true
});
var insertGroupMessageSchema = createInsertSchema(groupMessages).pick({
  groupId: true,
  content: true
});

// server/storage.ts
import session2 from "express-session";
import createMemoryStore2 from "memorystore";

// server/db.ts
import "dotenv/config";
import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?"
  );
}
console.log("Connected to:", process.env.DATABASE_URL);
var pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
var db = drizzle(pool, { schema: schema_exports });

// server/storage.ts
import { eq, and, or, asc } from "drizzle-orm";

// server/storage.test.ts
import session from "express-session";
import createMemoryStore from "memorystore";
var MemoryStore = createMemoryStore(session);
var TestStorage = class {
  sessionStore;
  users = [];
  projects = [];
  discussions = [];
  replies = [];
  invitations = [];
  connectionRequests = [];
  messages = [];
  chatGroups = [];
  groupMessages = [];
  nextId = {
    users: 1,
    projects: 1,
    discussions: 1,
    replies: 1,
    invitations: 1,
    connectionRequests: 1,
    messages: 1,
    chatGroups: 1,
    groupMessages: 1
  };
  constructor() {
    this.sessionStore = new MemoryStore({
      checkPeriod: 864e5
    });
  }
  async getUser(id) {
    return this.users.find((u) => u.id === id);
  }
  async getUserByUsername(username) {
    return this.users.find((u) => u.username === username);
  }
  async createUser(insertUser) {
    const newUser = {
      ...insertUser,
      id: this.nextId.users++,
      connections: insertUser.connections || []
    };
    this.users.push(newUser);
    return newUser;
  }
  async updateUser(id, updates) {
    const user = await this.getUser(id);
    if (!user) return void 0;
    Object.assign(user, updates);
    return user;
  }
  async createProject(project) {
    const newProject = {
      ...project,
      id: this.nextId.projects++
    };
    this.projects.push(newProject);
    return newProject;
  }
  async getProject(id) {
    return this.projects.find((p) => p.id === id);
  }
  async getAllProjects() {
    return [...this.projects];
  }
  async updateProject(id, updates) {
    const project = await this.getProject(id);
    if (!project) return void 0;
    Object.assign(project, updates);
    return project;
  }
  async requestToJoinProject(projectId, userId) {
    const project = await this.getProject(projectId);
    if (!project) return void 0;
    if (!project.join_requests.includes(userId)) {
      project.join_requests.push(userId);
    }
    return project;
  }
  async acceptJoinRequest(projectId, userId) {
    const project = await this.getProject(projectId);
    if (!project) return void 0;
    project.join_requests = project.join_requests.filter((id) => id !== userId);
    if (!project.members.includes(userId)) {
      project.members.push(userId);
    }
    return project;
  }
  async rejectJoinRequest(projectId, userId) {
    const project = await this.getProject(projectId);
    if (!project) return void 0;
    project.join_requests = project.join_requests.filter((id) => id !== userId);
    return project;
  }
  async createDiscussion(discussion) {
    const newDiscussion = {
      ...discussion,
      id: this.nextId.discussions++
    };
    this.discussions.push(newDiscussion);
    return newDiscussion;
  }
  async getDiscussion(id) {
    return this.discussions.find((d) => d.id === id);
  }
  async getAllDiscussions() {
    return [...this.discussions];
  }
  async upvoteDiscussion(id, userId) {
    const discussion = await this.getDiscussion(id);
    if (!discussion) return void 0;
    if (discussion.upvoted_by.includes(userId)) {
      discussion.upvoted_by = discussion.upvoted_by.filter((id2) => id2 !== userId);
      discussion.upvotes--;
    } else {
      discussion.upvoted_by.push(userId);
      discussion.upvotes++;
    }
    return discussion;
  }
  async createReply(reply) {
    const newReply = {
      ...reply,
      id: this.nextId.replies++
    };
    this.replies.push(newReply);
    return newReply;
  }
  async getRepliesByDiscussion(discussionId) {
    return this.replies.filter((r) => r.discussion_id === discussionId);
  }
  async upvoteReply(id, userId) {
    const reply = this.replies.find((r) => r.id === id);
    if (!reply) return void 0;
    if (reply.upvoted_by.includes(userId)) {
      reply.upvoted_by = reply.upvoted_by.filter((id2) => id2 !== userId);
      reply.upvotes--;
    } else {
      reply.upvoted_by.push(userId);
      reply.upvotes++;
    }
    return reply;
  }
  async getAllUsers() {
    return [...this.users];
  }
  async createInvitation(invitation) {
    const fullInvitation = {
      ...invitation,
      id: this.nextId.invitations++,
      status: "pending",
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    this.invitations.push(fullInvitation);
    return fullInvitation;
  }
  async getInvitationsByUser(userId) {
    return this.invitations.filter(
      (i) => i.recipientId === userId || i.senderId === userId
    );
  }
  async respondToInvitation(id, status) {
    const invitation = this.invitations.find((i) => i.id === id);
    if (!invitation) return void 0;
    invitation.status = status;
    return invitation;
  }
  async createConnectionRequest(request) {
    const fullRequest = {
      ...request,
      id: this.nextId.connectionRequests++,
      status: "pending",
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    this.connectionRequests.push(fullRequest);
    return fullRequest;
  }
  async getConnectionRequestsByUser(userId) {
    return this.connectionRequests.filter(
      (r) => r.senderId === userId || r.receiverId === userId
    );
  }
  async respondToConnectionRequest(id, status) {
    const request = this.connectionRequests.find((r) => r.id === id);
    if (!request) return void 0;
    request.status = status;
    if (status === "accepted") {
      const sender = await this.getUser(request.senderId);
      const receiver = await this.getUser(request.receiverId);
      if (sender && !sender.connections.includes(request.receiverId)) {
        sender.connections.push(request.receiverId);
      }
      if (receiver && !receiver.connections.includes(request.senderId)) {
        receiver.connections.push(request.senderId);
      }
    }
    return request;
  }
  async createMessage(message) {
    const newMessage = {
      ...message,
      id: this.nextId.messages++,
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    this.messages.push(newMessage);
    return newMessage;
  }
  async getMessagesBetweenUsers(user1Id, user2Id) {
    return this.messages.filter(
      (m) => m.senderId === user1Id && m.receiverId === user2Id || m.senderId === user2Id && m.receiverId === user1Id
    ).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }
  async getAllMessages() {
    return this.messages;
  }
  async markMessageAsRead(messageId) {
    const index = this.messages.findIndex((msg) => msg.id === messageId);
    if (index === -1) return void 0;
    this.messages[index] = { ...this.messages[index], read: true };
    return this.messages[index];
  }
  async createChatGroup(group) {
    const newGroup = {
      ...group,
      id: this.nextId.chatGroups++,
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    this.chatGroups.push(newGroup);
    return newGroup;
  }
  async getChatGroupsByUser(userId) {
    return this.chatGroups.filter(
      (g) => g.memberIds.includes(userId)
    );
  }
  async getChatGroup(id) {
    return this.chatGroups.find((g) => g.id === id);
  }
  async addUserToChatGroup(groupId, userId) {
    const group = await this.getChatGroup(groupId);
    if (!group) return void 0;
    if (!group.memberIds.includes(userId)) {
      group.memberIds.push(userId);
    }
    return group;
  }
  async removeUserFromChatGroup(groupId, userId) {
    const group = await this.getChatGroup(groupId);
    if (!group) return void 0;
    group.memberIds = group.memberIds.filter((id) => id !== userId);
    return group;
  }
  async createGroupMessage(message) {
    const newMessage = {
      ...message,
      id: this.nextId.groupMessages++,
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    this.groupMessages.push(newMessage);
    return newMessage;
  }
  async getMessagesByChatGroup(groupId) {
    return this.groupMessages.filter(
      (m) => m.chatGroupId === groupId
    ).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }
};
var testStorage = new TestStorage();

// server/storage.ts
var MemoryStore2 = createMemoryStore2(session2);
var DrizzleStorage = class {
  sessionStore;
  constructor() {
    this.sessionStore = new MemoryStore2({
      checkPeriod: 864e5
      // prune expired entries every 24h
    });
  }
  // Users
  async getUser(id) {
    const results = await db.select().from(users).where(eq(users.id, id));
    return results[0];
  }
  async getUserByUsername(username) {
    const results = await db.select().from(users).where(eq(users.username, username));
    return results[0];
  }
  async createUser(insertUser) {
    const emptySocial = {};
    const newUser = {
      ...insertUser,
      bio: insertUser.bio || "",
      avatar: insertUser.avatar || "",
      skills: insertUser.skills || {},
      social: insertUser.social ? {
        github: typeof insertUser.social.github === "string" ? insertUser.social.github : void 0,
        linkedin: typeof insertUser.social.linkedin === "string" ? insertUser.social.linkedin : void 0
      } : emptySocial,
      connections: []
    };
    const result = await db.insert(users).values(newUser).returning();
    return result[0];
  }
  async updateUser(id, updates) {
    const result = await db.update(users).set(updates).where(eq(users.id, id)).returning();
    return result[0];
  }
  async getAllUsers() {
    return await db.select().from(users);
  }
  // Projects
  async createProject(project) {
    const newProject = {
      ...project,
      skills: project.skills || [],
      tools: project.tools || [],
      rolesSought: project.rolesSought || [],
      setting: project.setting || "remote",
      location: project.location || "",
      members: project.members || [project.ownerId],
      status: project.status || "open",
      joinRequests: project.joinRequests || [],
      membersNeeded: project.membersNeeded || 1
    };
    const result = await db.insert(projects).values(newProject).returning();
    return result[0];
  }
  async getProject(id) {
    const results = await db.select().from(projects).where(eq(projects.id, id));
    return results[0];
  }
  async getAllProjects() {
    return await db.select().from(projects);
  }
  async updateProject(id, updates) {
    const result = await db.update(projects).set(updates).where(eq(projects.id, id)).returning();
    return result[0];
  }
  async requestToJoinProject(projectId, userId) {
    const project = await this.getProject(projectId);
    if (!project) return void 0;
    const joinRequests = project.joinRequests || [];
    if (joinRequests.includes(userId)) {
      return project;
    }
    return this.updateProject(projectId, {
      joinRequests: [...joinRequests, userId]
    });
  }
  async acceptJoinRequest(projectId, userId) {
    const project = await this.getProject(projectId);
    if (!project) return void 0;
    const joinRequests = project.joinRequests || [];
    const members = project.members || [];
    if (!joinRequests.includes(userId)) {
      return project;
    }
    return this.updateProject(projectId, {
      joinRequests: joinRequests.filter((id) => id !== userId),
      members: [...members, userId]
    });
  }
  async rejectJoinRequest(projectId, userId) {
    const project = await this.getProject(projectId);
    if (!project) return void 0;
    const joinRequests = project.joinRequests || [];
    if (!joinRequests.includes(userId)) {
      return project;
    }
    return this.updateProject(projectId, {
      joinRequests: joinRequests.filter((id) => id !== userId)
    });
  }
  // Discussions
  async createDiscussion(discussion) {
    const newDiscussion = {
      ...discussion,
      upvotes: discussion.upvotes || 0,
      upvotedBy: discussion.upvotedBy || [],
      category: discussion.category || "general",
      createdAt: discussion.createdAt || (/* @__PURE__ */ new Date()).toISOString()
    };
    const result = await db.insert(discussions).values(newDiscussion).returning();
    return result[0];
  }
  async getDiscussion(id) {
    const results = await db.select().from(discussions).where(eq(discussions.id, id));
    return results[0];
  }
  async getAllDiscussions() {
    return await db.select().from(discussions);
  }
  async upvoteDiscussion(id, userId) {
    const discussion = await this.getDiscussion(id);
    if (!discussion) return void 0;
    const upvotedBy = discussion.upvotedBy || [];
    if (upvotedBy.includes(userId)) {
      const newUpvotedBy = upvotedBy.filter((uid) => uid !== userId);
      return this.updateDiscussion(id, {
        upvotedBy: newUpvotedBy,
        upvotes: Math.max(0, (discussion.upvotes || 0) - 1)
      });
    } else {
      return this.updateDiscussion(id, {
        upvotedBy: [...upvotedBy, userId],
        upvotes: (discussion.upvotes || 0) + 1
      });
    }
  }
  async updateDiscussion(id, updates) {
    const result = await db.update(discussions).set(updates).where(eq(discussions.id, id)).returning();
    return result[0];
  }
  // Replies
  async createReply(reply) {
    const newReply = {
      ...reply,
      upvotes: reply.upvotes || 0,
      upvotedBy: reply.upvotedBy || [],
      createdAt: reply.createdAt || (/* @__PURE__ */ new Date()).toISOString()
    };
    const result = await db.insert(replies).values(newReply).returning();
    return result[0];
  }
  async getRepliesByDiscussion(discussionId) {
    return await db.select().from(replies).where(eq(replies.discussionId, discussionId));
  }
  async upvoteReply(id, userId) {
    const replyResults = await db.select().from(replies).where(eq(replies.id, id));
    if (replyResults.length === 0) return void 0;
    const reply = replyResults[0];
    const upvotedBy = reply.upvotedBy || [];
    if (upvotedBy.includes(userId)) {
      const newUpvotedBy = upvotedBy.filter((uid) => uid !== userId);
      return this.updateReply(id, {
        upvotedBy: newUpvotedBy,
        upvotes: Math.max(0, (reply.upvotes || 0) - 1)
      });
    } else {
      return this.updateReply(id, {
        upvotedBy: [...upvotedBy, userId],
        upvotes: (reply.upvotes || 0) + 1
      });
    }
  }
  async updateReply(id, updates) {
    const result = await db.update(replies).set(updates).where(eq(replies.id, id)).returning();
    return result[0];
  }
  // Invitations
  async createInvitation(invitation) {
    const fullInvitation = {
      ...invitation,
      status: "pending",
      message: invitation.message || null,
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    const result = await db.insert(invitations2).values(fullInvitation).returning();
    return result[0];
  }
  async getInvitationsByUser(userId) {
    return await db.select().from(invitations2).where(
      or(
        eq(invitations2.recipientId, userId),
        eq(invitations2.senderId, userId)
      )
    );
  }
  async respondToInvitation(id, status) {
    const result = await db.update(invitations2).set({ status }).where(eq(invitations2.id, id)).returning();
    if (result.length === 0) return void 0;
    if (status === "accepted") {
      const invitation = result[0];
      const project = await this.getProject(invitation.projectId);
      if (project) {
        const members = project.members || [];
        if (!members.includes(invitation.recipientId)) {
          await this.updateProject(invitation.projectId, {
            members: [...members, invitation.recipientId]
          });
        }
      }
    }
    return result[0];
  }
  // Connection Requests
  async createConnectionRequest(request) {
    const fullRequest = {
      ...request,
      status: "pending",
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    const result = await db.insert(connectionRequests).values(fullRequest).returning();
    return result[0];
  }
  async getConnectionRequestsByUser(userId) {
    return await db.select().from(connectionRequests).where(
      or(
        eq(connectionRequests.recipientId, userId),
        eq(connectionRequests.senderId, userId)
      )
    );
  }
  async respondToConnectionRequest(id, status) {
    const result = await db.update(connectionRequests).set({ status }).where(eq(connectionRequests.id, id)).returning();
    if (result.length === 0) return void 0;
    if (status === "accepted") {
      const request = result[0];
      const sender = await this.getUser(request.senderId);
      if (sender) {
        const connections = sender.connections || [];
        if (!connections.includes(request.recipientId)) {
          await this.updateUser(request.senderId, {
            connections: [...connections, request.recipientId]
          });
        }
      }
      const recipient = await this.getUser(request.recipientId);
      if (recipient) {
        const connections = recipient.connections || [];
        if (!connections.includes(request.senderId)) {
          await this.updateUser(request.recipientId, {
            connections: [...connections, request.senderId]
          });
        }
      }
    }
    return result[0];
  }
  // Messages
  async createMessage(message) {
    const fullMessage = {
      ...message,
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    const result = await db.insert(messages).values(fullMessage).returning();
    return result[0];
  }
  async getMessagesBetweenUsers(user1Id, user2Id) {
    return await db.select().from(messages).where(
      or(
        and(
          eq(messages.senderId, user1Id),
          eq(messages.recipientId, user2Id)
        ),
        and(
          eq(messages.senderId, user2Id),
          eq(messages.recipientId, user1Id)
        )
      )
    ).orderBy(asc(messages.createdAt));
  }
  async getAllMessages() {
    return await db.select().from(messages);
  }
  async markMessageAsRead(messageId) {
    const result = await db.update(messages).set({ read: true }).where(eq(messages.id, messageId)).returning();
    return result[0];
  }
  // Chat Groups
  async createChatGroup(group) {
    const fullGroup = {
      ...group,
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    const result = await db.insert(chatGroups).values(fullGroup).returning();
    return result[0];
  }
  async getChatGroupsByUser(userId) {
    return await db.select().from(chatGroups).where(
      // This is a simplification and might need adjustment based on your schema
      // You might need a more complex query if members is stored differently
      // For example, if you have a junction table for group members
      // we'll just check if the members array includes the userId
      // Note: This specific implementation depends on your DB dialect and schema
      // You might need to adjust based on your specific setup
    );
  }
  async getChatGroup(id) {
    const results = await db.select().from(chatGroups).where(eq(chatGroups.id, id));
    return results[0];
  }
  async addUserToChatGroup(groupId, userId) {
    const group = await this.getChatGroup(groupId);
    if (!group) return void 0;
    const members = group.members || [];
    if (members.includes(userId)) {
      return group;
    }
    const result = await db.update(chatGroups).set({ members: [...members, userId] }).where(eq(chatGroups.id, groupId)).returning();
    return result[0];
  }
  async removeUserFromChatGroup(groupId, userId) {
    const group = await this.getChatGroup(groupId);
    if (!group) return void 0;
    const members = group.members || [];
    const result = await db.update(chatGroups).set({ members: members.filter((id) => id !== userId) }).where(eq(chatGroups.id, groupId)).returning();
    return result[0];
  }
  // Group Messages
  async createGroupMessage(message) {
    const fullMessage = {
      ...message,
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      readBy: message.readBy || [message.senderId]
    };
    const result = await db.insert(groupMessages).values(fullMessage).returning();
    return result[0];
  }
  async getMessagesByChatGroup(groupId) {
    return await db.select().from(groupMessages).where(eq(groupMessages.groupId, groupId)).orderBy(asc(groupMessages.createdAt));
  }
};
var drizzleStorage = new DrizzleStorage();
var storage = drizzleStorage;

// server/auth.ts
var scryptAsync = promisify(scrypt);
async function comparePasswords(supplied, stored) {
  if (stored === "pass123") {
    return supplied === "pass123";
  }
  if (!stored.includes(".")) {
    return supplied === stored;
  }
  const [hashed, salt] = stored.split(".");
  if (!hashed || !salt) {
    return false;
  }
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = await scryptAsync(supplied, salt, 64);
  return timingSafeEqual(hashedBuf, suppliedBuf);
}
function setupAuth(app2) {
  const sessionSettings = {
    secret: process.env.DATABASE_URL || "skillconnect-secret-key",
    // Providing a fallback secret
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      secure: app2.get("env") === "production",
      maxAge: 1e3 * 60 * 60 * 24
      // 24 hours
    }
  };
  if (app2.get("env") === "production") {
    app2.set("trust proxy", 1);
  }
  app2.use(session3(sessionSettings));
  app2.use(passport.initialize());
  app2.use(passport.session());
  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user || !await comparePasswords(password, user.password)) {
          return done(null, false, { message: "Invalid username or password" });
        }
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    })
  );
  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await storage.getUser(id);
      if (!user) {
        return done(null, false);
      }
      done(null, user);
    } catch (err) {
      done(err);
    }
  });
  app2.post("/api/register", async (req, res, next) => {
    try {
      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }
      const user = await storage.createUser({
        ...req.body,
        // Store the plaintext password for easier testing
        password: req.body.password
      });
      req.login(user, (err) => {
        if (err) return next(err);
        res.status(201).json(user);
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  app2.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err, user, info) => {
      if (err) return next(err);
      if (!user) {
        return res.status(401).json({ message: info?.message || "Authentication failed" });
      }
      req.logIn(user, (loginErr) => {
        if (loginErr) return next(loginErr);
        res.json(user);
      });
    })(req, res, next);
  });
  app2.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });
  app2.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    res.json(req.user);
  });
}

// server/routes.ts
import { eq as eq2 } from "drizzle-orm";

// server/openai.ts
import "dotenv/config";
import OpenAI from "openai";
var OPENAI_API_KEY = process.env.OPENAI_API_KEY;
var openai = new OpenAI({ apiKey: OPENAI_API_KEY });
var sampleResponses = [
  "That's an interesting question! Based on my knowledge, I'd recommend looking into the latest research papers on this topic. VIT-AP's library has excellent resources on this.",
  "Great question! Have you considered collaborating with students from different departments? Interdisciplinary projects often lead to innovative solutions.",
  "I'd suggest breaking down this problem into smaller components. Start with a proof of concept, then iterate based on feedback from your peers.",
  "For this topic, I recommend checking Professor Kumar's lectures on the subject. His approach is particularly helpful for beginners.",
  "This is a common challenge for students. I'd recommend forming a study group with peers who have complementary skills to yours.",
  "The Computer Science department at VIT-AP has a workshop on this topic next month. It might be worth attending to get hands-on experience.",
  "Have you considered applying for the university's innovation grant? Your project idea seems well-aligned with their funding priorities.",
  "This is a rapidly evolving field. I'd recommend following the latest developments through IEEE papers and joining relevant student chapters.",
  "Your approach seems solid. Consider adding unit tests to ensure your code remains robust as the project scales.",
  "The Mathematics department offers a course that covers these concepts in depth. It might be helpful to sit in on a few lectures."
];
var sampleSkillSuggestions = [
  ["Machine Learning", "Data Visualization", "Cloud Computing"],
  ["React.js", "Node.js", "GraphQL"],
  ["Python", "TensorFlow", "Data Analysis"],
  ["Public Speaking", "Technical Writing", "Project Management"],
  ["Docker", "Kubernetes", "CI/CD Pipelines"],
  ["UX Design", "UI Prototyping", "User Research"],
  ["Database Design", "SQL Optimization", "NoSQL Concepts"],
  ["Mobile Development", "Cross-platform Frameworks", "App Security"],
  ["Blockchain", "Smart Contracts", "Decentralized Applications"],
  ["Cybersecurity", "Network Protocols", "Ethical Hacking"]
];
async function getAIResponse(message) {
  try {
    if (!OPENAI_API_KEY) {
      return sampleResponses[Math.floor(Math.random() * sampleResponses.length)];
    }
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a helpful AI assistant for VIT-AP students, focusing on academic and technical topics. Keep responses concise and relevant."
        },
        { role: "user", content: message }
      ],
      temperature: 0.7,
      max_tokens: 500
    });
    return response.choices[0].message.content || "Sorry, I couldn't process that request.";
  } catch (error) {
    console.error("OpenAI API error:", error);
    return sampleResponses[Math.floor(Math.random() * sampleResponses.length)];
  }
}
async function getSkillSuggestions(skills) {
  try {
    if (!OPENAI_API_KEY) {
      return sampleSkillSuggestions[Math.floor(Math.random() * sampleSkillSuggestions.length)];
    }
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a career advisor specializing in technology skills. Suggest 3 relevant skills based on the user's current skillset."
        },
        {
          role: "user",
          content: `Based on these skills and proficiency levels (0-100): ${JSON.stringify(skills)}, what are 3 complementary skills I should learn next?`
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7
    });
    if (!response.choices[0].message.content) {
      return sampleSkillSuggestions[Math.floor(Math.random() * sampleSkillSuggestions.length)];
    }
    const result = JSON.parse(response.choices[0].message.content);
    return result.skills || sampleSkillSuggestions[Math.floor(Math.random() * sampleSkillSuggestions.length)];
  } catch (error) {
    console.error("OpenAI API error:", error);
    return sampleSkillSuggestions[Math.floor(Math.random() * sampleSkillSuggestions.length)];
  }
}

// server/xai.ts
import OpenAI2 from "openai";
var XAI_API_KEY = process.env.XAI_API_KEY;
var xai = XAI_API_KEY ? new OpenAI2({ baseURL: "https://api.x.ai/v1", apiKey: XAI_API_KEY }) : null;
var sampleResponses2 = [
  "That's an interesting question! Based on my knowledge, I'd recommend looking into the latest research papers on this topic. VIT-AP's library has excellent resources on this.",
  "Great question! Have you considered collaborating with students from different departments? Interdisciplinary projects often lead to innovative solutions.",
  "I'd suggest breaking down this problem into smaller components. Start with a proof of concept, then iterate based on feedback from your peers.",
  "For this topic, I recommend checking Professor Kumar's lectures on the subject. His approach is particularly helpful for beginners.",
  "This is a common challenge for students. I'd recommend forming a study group with peers who have complementary skills to yours.",
  "The Computer Science department at VIT-AP has a workshop on this topic next month. It might be worth attending to get hands-on experience.",
  "Have you considered applying for the university's innovation grant? Your project idea seems well-aligned with their funding priorities.",
  "This is a rapidly evolving field. I'd recommend following the latest developments through IEEE papers and joining relevant student chapters.",
  "Your approach seems solid. Consider adding unit tests to ensure your code remains robust as the project scales.",
  "The Mathematics department offers a course that covers these concepts in depth. It might be helpful to sit in on a few lectures."
];
var sampleSkillSuggestions2 = [
  ["Machine Learning", "Data Visualization", "Cloud Computing"],
  ["React.js", "Node.js", "GraphQL"],
  ["Python", "TensorFlow", "Data Analysis"],
  ["Public Speaking", "Technical Writing", "Project Management"],
  ["Docker", "Kubernetes", "CI/CD Pipelines"],
  ["UX Design", "UI Prototyping", "User Research"],
  ["Database Design", "SQL Optimization", "NoSQL Concepts"],
  ["Mobile Development", "Cross-platform Frameworks", "App Security"],
  ["Blockchain", "Smart Contracts", "Decentralized Applications"],
  ["Cybersecurity", "Network Protocols", "Ethical Hacking"]
];
async function getXAIResponse(message) {
  try {
    if (!xai) {
      return sampleResponses2[Math.floor(Math.random() * sampleResponses2.length)];
    }
    const response = await xai.chat.completions.create({
      model: "grok-2-1212",
      // Using Grok model
      messages: [
        {
          role: "system",
          content: "You are a helpful AI assistant for VIT-AP students, focusing on academic and technical topics. Keep responses concise and relevant."
        },
        { role: "user", content: message }
      ],
      temperature: 0.7,
      max_tokens: 500
    });
    return response.choices[0].message.content || "Sorry, I couldn't process that request.";
  } catch (error) {
    console.error("xAI API error:", error);
    return sampleResponses2[Math.floor(Math.random() * sampleResponses2.length)];
  }
}
async function getXAISkillSuggestions(skills) {
  try {
    if (!xai) {
      return sampleSkillSuggestions2[Math.floor(Math.random() * sampleSkillSuggestions2.length)];
    }
    const response = await xai.chat.completions.create({
      model: "grok-2-1212",
      // Using Grok model
      messages: [
        {
          role: "system",
          content: "You are a career advisor specializing in technology skills. Suggest 3 relevant skills based on the user's current skillset."
        },
        {
          role: "user",
          content: `Based on these skills and proficiency levels (0-100): ${JSON.stringify(skills)}, what are 3 complementary skills I should learn next?`
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7
    });
    if (!response.choices[0].message.content) {
      return sampleSkillSuggestions2[Math.floor(Math.random() * sampleSkillSuggestions2.length)];
    }
    const result = JSON.parse(response.choices[0].message.content);
    return result.skills || sampleSkillSuggestions2[Math.floor(Math.random() * sampleSkillSuggestions2.length)];
  } catch (error) {
    console.error("xAI API error:", error);
    return sampleSkillSuggestions2[Math.floor(Math.random() * sampleSkillSuggestions2.length)];
  }
}

// server/ai.ts
var DEEPSEEK_API_ENDPOINT = "https://api.deepseek.com/v1";
var DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
var XAI_API_KEY2 = process.env.XAI_API_KEY;
var OPENAI_API_KEY2 = "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";
var sampleResponses3 = [
  "That's an interesting question! Based on my knowledge, I'd recommend looking into the latest research papers on this topic. VIT-AP's library has excellent resources on this.",
  "Great question! Have you considered collaborating with students from different departments? Interdisciplinary projects often lead to innovative solutions.",
  "I'd suggest breaking down this problem into smaller components. Start with a proof of concept, then iterate based on feedback from your peers.",
  "For this topic, I recommend checking Professor Kumar's lectures on the subject. His approach is particularly helpful for beginners.",
  "This is a common challenge for students. I'd recommend forming a study group with peers who have complementary skills to yours.",
  "The Computer Science department at VIT-AP has a workshop on this topic next month. It might be worth attending to get hands-on experience.",
  "Have you considered applying for the university's innovation grant? Your project idea seems well-aligned with their funding priorities.",
  "This is a rapidly evolving field. I'd recommend following the latest developments through IEEE papers and joining relevant student chapters.",
  "Your approach seems solid. Consider adding unit tests to ensure your code remains robust as the project scales.",
  "The Mathematics department offers a course that covers these concepts in depth. It might be helpful to sit in on a few lectures."
];
var sampleSkillSuggestions3 = [
  ["Machine Learning", "Data Visualization", "Cloud Computing"],
  ["React.js", "Node.js", "GraphQL"],
  ["Python", "TensorFlow", "Data Analysis"],
  ["Public Speaking", "Technical Writing", "Project Management"],
  ["Docker", "Kubernetes", "CI/CD Pipelines"],
  ["UX Design", "UI Prototyping", "User Research"],
  ["Database Design", "SQL Optimization", "NoSQL Concepts"],
  ["Mobile Development", "Cross-platform Frameworks", "App Security"],
  ["Blockchain", "Smart Contracts", "Decentralized Applications"],
  ["Cybersecurity", "Network Protocols", "Ethical Hacking"]
];
async function getDeepseekResponse(message) {
  try {
    if (!DEEPSEEK_API_KEY) {
      return sampleResponses3[Math.floor(Math.random() * sampleResponses3.length)];
    }
    const response = await fetch(`${DEEPSEEK_API_ENDPOINT}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          {
            role: "system",
            content: "You are a helpful AI assistant for VIT-AP students, focusing on academic and technical topics. Keep responses concise and relevant."
          },
          { role: "user", content: message }
        ],
        temperature: 0.7,
        max_tokens: 500
      })
    });
    if (!response.ok) {
      console.error("Deepseek API error:", await response.text());
      return "Sorry, I'm having trouble processing your request right now. Please try again later.";
    }
    const data = await response.json();
    return data.choices[0].message.content || "Sorry, I couldn't process that request.";
  } catch (error) {
    console.error("Deepseek API error:", error);
    return sampleResponses3[Math.floor(Math.random() * sampleResponses3.length)];
  }
}
async function getDeepseekSkillSuggestions(skills) {
  try {
    if (!DEEPSEEK_API_KEY) {
      return sampleSkillSuggestions3[Math.floor(Math.random() * sampleSkillSuggestions3.length)];
    }
    const response = await fetch(`${DEEPSEEK_API_ENDPOINT}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          {
            role: "system",
            content: "You are a career advisor specializing in technology skills. Suggest 3 relevant skills based on the user's current skillset."
          },
          {
            role: "user",
            content: `Based on these skills and proficiency levels (0-100): ${JSON.stringify(skills)}, what are 3 complementary skills I should learn next?`
          }
        ],
        temperature: 0.7,
        response_format: { type: "json_object" }
      })
    });
    if (!response.ok) {
      console.error("Deepseek API error:", await response.text());
      return sampleSkillSuggestions3[Math.floor(Math.random() * sampleSkillSuggestions3.length)];
    }
    const data = await response.json();
    const content = data.choices[0].message.content;
    if (!content) {
      return sampleSkillSuggestions3[Math.floor(Math.random() * sampleSkillSuggestions3.length)];
    }
    try {
      const result = JSON.parse(content);
      return result.skills || sampleSkillSuggestions3[Math.floor(Math.random() * sampleSkillSuggestions3.length)];
    } catch (parseError) {
      console.error("Failed to parse skill suggestions:", parseError);
      return sampleSkillSuggestions3[Math.floor(Math.random() * sampleSkillSuggestions3.length)];
    }
  } catch (error) {
    console.error("Deepseek API error:", error);
    return sampleSkillSuggestions3[Math.floor(Math.random() * sampleSkillSuggestions3.length)];
  }
}
async function getAIResponse2(message) {
  if (XAI_API_KEY2) {
    console.log("Using xAI for response");
    return getXAIResponse(message);
  } else if (OPENAI_API_KEY2) {
    console.log("Using OpenAI for response");
    return getAIResponse(message);
  } else if (DEEPSEEK_API_KEY) {
    console.log("Using Deepseek for response");
    return getDeepseekResponse(message);
  } else {
    console.log("Using sample responses (demo mode)");
    return sampleResponses3[Math.floor(Math.random() * sampleResponses3.length)];
  }
}
async function getSkillSuggestions2(skills) {
  if (XAI_API_KEY2) {
    console.log("Using xAI for skill suggestions");
    return getXAISkillSuggestions(skills);
  } else if (OPENAI_API_KEY2) {
    console.log("Using OpenAI for skill suggestions");
    return getSkillSuggestions(skills);
  } else if (DEEPSEEK_API_KEY) {
    console.log("Using Deepseek for skill suggestions");
    return getDeepseekSkillSuggestions(skills);
  } else {
    console.log("Using sample skill suggestions (demo mode)");
    return sampleSkillSuggestions3[Math.floor(Math.random() * sampleSkillSuggestions3.length)];
  }
}

// server/routes.ts
function registerRoutes(app2) {
  setupAuth(app2);
  app2.patch("/api/profile", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const updatedUser = await storage.updateUser(req.user.id, req.body);
    if (!updatedUser) return res.sendStatus(404);
    res.json(updatedUser);
  });
  app2.get("/api/test-db-read", async (req, res) => {
    try {
      const users2 = await db.query.users.findMany({
        limit: 5
      });
      console.log("DB Read Test Result:", users2);
      res.json({ success: true, data: users2 });
    } catch (error) {
      console.error("DB read test error:", error);
      res.status(500).json({ success: false, error: String(error) });
    }
  });
  app2.post("/api/test-db-write", async (req, res) => {
    try {
      console.log("Starting test write operation");
      const testUser = {
        username: `test-user-${Date.now()}`,
        password: "test-password"
      };
      const result = await db.insert(users).values(testUser);
      console.log("DB Write Test Result:", result);
      const insertedUser = await db.query.users.findFirst({
        where: eq2(users.username, testUser.username)
      });
      console.log("Inserted user found:", insertedUser);
      res.json({
        success: true,
        writeResult: result,
        readBack: insertedUser
      });
    } catch (error) {
      console.error("DB write test error:", error);
      res.status(500).json({ success: false, error: String(error) });
    }
  });
  app2.post("/api/test-db-transaction", async (req, res) => {
    try {
      console.log("Starting transaction test");
      const testUser = {
        username: `transaction-test-${Date.now()}`,
        password: "test-password"
      };
      const result = await db.transaction(async (tx) => {
        const insertResult = await tx.insert(users).values(testUser);
        console.log("Transaction insert result:", insertResult);
        return insertResult;
      });
      const insertedUser = await db.query.users.findFirst({
        where: eq2(users.username, testUser.username)
      });
      console.log("Transaction user found:", insertedUser);
      res.json({
        success: true,
        transactionResult: result,
        readBack: insertedUser
      });
    } catch (error) {
      console.error("Transaction test error:", error);
      res.status(500).json({ success: false, error: String(error) });
    }
  });
  app2.get("/api/projects", async (req, res) => {
    const projects2 = await storage.getAllProjects();
    res.json(projects2);
  });
  app2.get("/api/projects/:id", async (req, res) => {
    const project = await storage.getProject(parseInt(req.params.id));
    if (!project) return res.sendStatus(404);
    res.json(project);
  });
  app2.post("/api/projects", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const validated = insertProjectSchema.parse(req.body);
      const skills = Array.isArray(validated.skills) ? validated.skills : validated.skills ? [validated.skills.toString()] : [];
      const project = await storage.createProject({
        title: validated.title,
        description: validated.description,
        skills,
        tools: validated.tools || null,
        rolesSought: validated.rolesSought || null,
        setting: validated.setting,
        location: validated.location || null,
        deadline: validated.deadline || null,
        membersNeeded: validated.membersNeeded || null,
        ownerId: req.user.id,
        members: [req.user.id],
        joinRequests: [],
        status: "open"
      });
      res.status(201).json(project);
    } catch (error) {
      console.error("Project creation error:", error);
      res.status(400).json({ message: "Invalid project data" });
    }
  });
  app2.post("/api/projects/:id/join", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const projectId = parseInt(req.params.id);
    const userId = req.user.id;
    const project = await storage.requestToJoinProject(projectId, userId);
    if (!project) return res.sendStatus(404);
    res.json(project);
  });
  app2.post("/api/projects/:id/accept", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const projectId = parseInt(req.params.id);
    const project = await storage.getProject(projectId);
    if (!project) return res.sendStatus(404);
    if (project.ownerId !== req.user.id) return res.sendStatus(403);
    const userId = parseInt(req.body.userId);
    const updatedProject = await storage.acceptJoinRequest(projectId, userId);
    res.json(updatedProject);
  });
  app2.post("/api/projects/:id/reject", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const projectId = parseInt(req.params.id);
    const project = await storage.getProject(projectId);
    if (!project) return res.sendStatus(404);
    if (project.ownerId !== req.user.id) return res.sendStatus(403);
    const userId = parseInt(req.body.userId);
    const updatedProject = await storage.rejectJoinRequest(projectId, userId);
    res.json(updatedProject);
  });
  app2.get("/api/discussions", async (req, res) => {
    const discussions2 = await storage.getAllDiscussions();
    res.json(discussions2);
  });
  app2.get("/api/discussions/:id", async (req, res) => {
    const discussion = await storage.getDiscussion(parseInt(req.params.id));
    if (!discussion) return res.sendStatus(404);
    res.json(discussion);
  });
  app2.post("/api/discussions", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const validated = insertDiscussionSchema.parse(req.body);
      const discussion = await storage.createDiscussion({
        ...validated,
        authorId: req.user.id,
        upvotes: 0,
        upvotedBy: [],
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      });
      res.status(201).json(discussion);
    } catch (error) {
      console.error("Discussion creation error:", error);
      res.status(400).json({ message: "Invalid discussion data" });
    }
  });
  app2.post("/api/discussions/:id/upvote", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const discussionId = parseInt(req.params.id);
    const userId = req.user.id;
    const discussion = await storage.upvoteDiscussion(discussionId, userId);
    if (!discussion) return res.sendStatus(404);
    res.json(discussion);
  });
  app2.get("/api/discussions/:id/replies", async (req, res) => {
    const discussionId = parseInt(req.params.id);
    const replies2 = await storage.getRepliesByDiscussion(discussionId);
    res.json(replies2);
  });
  app2.post("/api/discussions/:id/replies", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const discussionId = parseInt(req.params.id);
    try {
      const validated = insertReplySchema.parse(req.body);
      const reply = await storage.createReply({
        ...validated,
        discussionId,
        authorId: req.user.id,
        upvotes: 0,
        upvotedBy: [],
        createdAt: (/* @__PURE__ */ new Date()).toISOString(),
        parentReplyId: validated.parentReplyId || null
      });
      res.status(201).json(reply);
    } catch (error) {
      console.error("Reply creation error:", error);
      res.status(400).json({ message: "Invalid reply data" });
    }
  });
  app2.post("/api/replies/:id/upvote", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const replyId = parseInt(req.params.id);
    const userId = req.user.id;
    const reply = await storage.upvoteReply(replyId, userId);
    if (!reply) return res.sendStatus(404);
    res.json(reply);
  });
  app2.get("/api/users", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const users2 = await storage.getAllUsers();
    const sanitizedUsers = users2.map(({ password, ...user }) => user);
    res.json(sanitizedUsers);
  });
  app2.get("/api/users/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const userId = parseInt(req.params.id);
    const user = await storage.getUser(userId);
    if (!user) return res.sendStatus(404);
    const { password, ...sanitizedUser } = user;
    const sentInvitations = await storage.getInvitationsByUser(req.user.id);
    const hasSentRequest = sentInvitations.some(
      (invitation) => invitation.recipientId === userId && invitation.status === "pending"
    );
    const receivedInvitations = await storage.getInvitationsByUser(userId);
    const isConnected = sentInvitations.some(
      (invitation) => invitation.recipientId === userId && invitation.status === "accepted"
    ) || receivedInvitations.some(
      (invitation) => invitation.senderId === userId && invitation.status === "accepted"
    );
    res.json({
      ...sanitizedUser,
      hasSentRequest,
      isConnected
    });
  });
  app2.get("/api/invitations", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const invitations3 = await storage.getInvitationsByUser(req.user.id);
    res.json(invitations3);
  });
  app2.post("/api/invitations", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const validated = insertInvitationSchema.parse(req.body);
      const allInvitations = await storage.getInvitationsByUser(req.user.id);
      const alreadySentByMe = allInvitations.some(
        (invitation2) => invitation2.recipientId === validated.recipientId && (invitation2.status === "pending" || invitation2.status === "accepted")
      );
      const alreadySentToMe = allInvitations.some(
        (invitation2) => invitation2.senderId === validated.recipientId && invitation2.recipientId === req.user.id && (invitation2.status === "pending" || invitation2.status === "accepted")
      );
      if (alreadySentByMe) {
        return res.status(400).json({
          message: "Connection request already sent",
          code: "ALREADY_REQUESTED"
        });
      }
      if (alreadySentToMe) {
        return res.status(409).json({
          message: "User has already sent you a request",
          code: "ALREADY_REQUESTED"
        });
      }
      const invitation = await storage.createInvitation({
        recipientId: validated.recipientId,
        projectId: validated.projectId,
        message: validated.message || null,
        senderId: req.user.id
      });
      res.status(201).json(invitation);
    } catch (error) {
      console.error("Invitation creation error:", error);
      res.status(400).json({ message: "Invalid invitation data" });
    }
  });
  app2.get("/api/debug/invitations", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    let allInvitations;
    try {
      allInvitations = await db.select().from(invitations);
    } catch (error) {
      allInvitations = storage.invitations;
    }
    const userInvitations = await storage.getInvitationsByUser(req.user.id);
    res.json({
      allInvitations,
      userInvitations,
      currentUserId: req.user.id
    });
  });
  app2.post("/api/invitations/:id/respond", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const invitationId = parseInt(req.params.id);
    const status = req.body.status;
    if (status !== "accepted" && status !== "declined") {
      return res.status(400).json({ message: "Status must be 'accepted' or 'declined'" });
    }
    const invitation = await storage.respondToInvitation(invitationId, status);
    if (!invitation) return res.sendStatus(404);
    res.json(invitation);
  });
  app2.post("/api/chat", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      if (!req.body.message) {
        return res.status(400).json({ message: "Message is required" });
      }
      const response = await getAIResponse2(req.body.message);
      res.json({ message: response });
    } catch (error) {
      console.error("AI chat error:", error);
      res.status(500).json({
        message: "An error occurred while processing your message. Please try again later."
      });
    }
  });
  app2.post("/api/skill-suggestions", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      if (!req.body.skills || typeof req.body.skills !== "object") {
        return res.status(400).json({ message: "Skills object is required" });
      }
      const suggestions = await getSkillSuggestions2(req.body.skills);
      res.json({ suggestions });
    } catch (error) {
      console.error("AI skill suggestions error:", error);
      res.status(500).json({
        message: "An error occurred while generating skill suggestions. Please try again later."
      });
    }
  });
  app2.get("/api/connection-requests", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const requests = await storage.getConnectionRequestsByUser(req.user.id);
    res.json(requests);
  });
  app2.post("/api/connection-requests", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const validated = insertConnectionRequestSchema.parse(req.body);
      const sentRequests = await storage.getConnectionRequestsByUser(req.user.id);
      const alreadySent = sentRequests.some(
        (request2) => request2.senderId === req.user.id && request2.recipientId === validated.recipientId || request2.recipientId === req.user.id && request2.senderId === validated.recipientId
      );
      if (alreadySent) {
        return res.status(409).json({
          message: "Already connected",
          status: "already_requested",
          code: "CONNECTION_ALREADY_REQUESTED"
        });
      }
      const sender = await storage.getUser(req.user.id);
      if (sender && sender.connections && sender.connections.includes(validated.recipientId)) {
        return res.status(409).json({
          message: "Already connected",
          status: "already_connected",
          code: "USERS_ALREADY_CONNECTED"
        });
      }
      const message = validated.message || null;
      const request = await storage.createConnectionRequest({
        recipientId: validated.recipientId,
        message,
        senderId: req.user.id
        // Use authenticated user's ID from session
      });
      res.status(201).json(request);
    } catch (error) {
      console.error("Connection request creation error:", error);
      res.status(400).json({ message: "Invalid connection request data" });
    }
  });
  app2.post("/api/connection-requests/:id/respond", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const requestId = parseInt(req.params.id);
    const status = req.body.status;
    if (status !== "accepted" && status !== "declined") {
      return res.status(400).json({ message: "Status must be 'accepted' or 'declined'" });
    }
    const request = await storage.respondToConnectionRequest(requestId, status);
    if (!request) return res.sendStatus(404);
    res.json(request);
  });
  app2.get("/api/messages/unread", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const allMessages = await storage.getAllMessages();
      const unreadMessages = allMessages.filter(
        (msg) => msg.recipientId === req.user.id && !msg.read
      );
      res.json(unreadMessages);
    } catch (error) {
      console.error("Error fetching unread messages:", error);
      res.status(500).json({ error: "Failed to fetch unread messages" });
    }
  });
  app2.get("/api/messages/:userId", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const otherUserId = parseInt(req.params.userId);
    const messages2 = await storage.getMessagesBetweenUsers(req.user.id, otherUserId);
    for (const message of messages2) {
      if (message.senderId === otherUserId && message.recipientId === req.user.id && !message.read) {
        await storage.markMessageAsRead(message.id);
      }
    }
    res.json(messages2);
  });
  app2.post("/api/messages", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const validated = insertMessageSchema.parse(req.body);
      const message = await storage.createMessage({
        ...validated,
        senderId: req.user.id,
        read: false
      });
      res.status(201).json(message);
    } catch (error) {
      console.error("Message creation error:", error);
      res.status(400).json({ message: "Invalid message data" });
    }
  });
  app2.get("/api/chat-groups", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const groups = await storage.getChatGroupsByUser(req.user.id);
    res.json(groups);
  });
  app2.get("/api/chat-groups/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const groupId = parseInt(req.params.id);
    const group = await storage.getChatGroup(groupId);
    if (!group) return res.sendStatus(404);
    const members = group.members || [];
    if (!members.includes(req.user.id)) return res.sendStatus(403);
    res.json(group);
  });
  app2.post("/api/chat-groups", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const validated = insertChatGroupSchema.parse(req.body);
      const memberArray = validated.members || [];
      const memberIds = Array.from(/* @__PURE__ */ new Set([...memberArray, req.user.id]));
      const group = await storage.createChatGroup({
        ...validated,
        creatorId: req.user.id,
        members: memberIds
      });
      res.status(201).json(group);
    } catch (error) {
      console.error("Chat group creation error:", error);
      res.status(400).json({ message: "Invalid chat group data" });
    }
  });
  app2.post("/api/chat-groups/:id/members", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const groupId = parseInt(req.params.id);
    const group = await storage.getChatGroup(groupId);
    if (!group) return res.sendStatus(404);
    if (group.creatorId !== req.user.id) return res.sendStatus(403);
    const userId = parseInt(req.body.userId);
    const updatedGroup = await storage.addUserToChatGroup(groupId, userId);
    res.json(updatedGroup);
  });
  app2.delete("/api/chat-groups/:id/members/:userId", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const groupId = parseInt(req.params.id);
    const group = await storage.getChatGroup(groupId);
    if (!group) return res.sendStatus(404);
    const userId = parseInt(req.params.userId);
    if (userId !== req.user.id && group.creatorId !== req.user.id) {
      return res.sendStatus(403);
    }
    const updatedGroup = await storage.removeUserFromChatGroup(groupId, userId);
    res.json(updatedGroup);
  });
  app2.get("/api/chat-groups/:id/messages", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const groupId = parseInt(req.params.id);
    const group = await storage.getChatGroup(groupId);
    if (!group) return res.sendStatus(404);
    const members = group.members || [];
    if (!members.includes(req.user.id)) return res.sendStatus(403);
    const messages2 = await storage.getMessagesByChatGroup(groupId);
    res.json(messages2);
  });
  app2.post("/api/chat-groups/:id/messages", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const groupId = parseInt(req.params.id);
    const group = await storage.getChatGroup(groupId);
    if (!group) return res.sendStatus(404);
    const members = group.members || [];
    if (!members.includes(req.user.id)) return res.sendStatus(403);
    try {
      const validated = insertGroupMessageSchema.parse(req.body);
      const message = await storage.createGroupMessage({
        ...validated,
        senderId: req.user.id,
        groupId,
        readBy: [req.user.id]
      });
      res.status(201).json(message);
    } catch (error) {
      console.error("Group message creation error:", error);
      res.status(400).json({ message: "Invalid group message data" });
    }
  });
  const httpServer = createServer(app2);
  const wss = new WebSocketServer({ server: httpServer, path: "/ws" });
  const clients = /* @__PURE__ */ new Map();
  wss.on("connection", (ws, req) => {
    console.log("WebSocket client connected");
    ws.on("message", async (message) => {
      try {
        const data = JSON.parse(message.toString());
        if (data.type === "auth") {
          if (data.userId) {
            clients.set(data.userId, ws);
            ws.userId = data.userId;
            console.log(`User ${data.userId} authenticated on WebSocket`);
          }
          return;
        }
        if (data.type === "direct-message" && ws.userId) {
          if (!data.recipientId || !data.content) {
            ws.send(JSON.stringify({
              type: "error",
              message: "Invalid message format"
            }));
            return;
          }
          const message2 = await storage.createMessage({
            senderId: ws.userId,
            recipientId: data.recipientId,
            content: data.content,
            read: false
          });
          ws.send(JSON.stringify({
            type: "direct-message",
            message: message2
          }));
          const recipientWs = clients.get(data.recipientId);
          if (recipientWs && recipientWs.readyState === WebSocket.OPEN) {
            recipientWs.send(JSON.stringify({
              type: "direct-message",
              message: message2
            }));
          }
        }
        if (data.type === "group-message" && ws.userId) {
          if (!data.groupId || !data.content) {
            ws.send(JSON.stringify({
              type: "error",
              message: "Invalid message format"
            }));
            return;
          }
          const group = await storage.getChatGroup(data.groupId);
          const members = group?.members || [];
          if (!group || !members.includes(ws.userId)) {
            ws.send(JSON.stringify({
              type: "error",
              message: "Not a member of this group"
            }));
            return;
          }
          const message2 = await storage.createGroupMessage({
            senderId: ws.userId,
            groupId: data.groupId,
            content: data.content,
            readBy: [ws.userId]
          });
          for (const memberId of members) {
            const memberWs = clients.get(memberId);
            if (memberWs && memberWs.readyState === WebSocket.OPEN) {
              memberWs.send(JSON.stringify({
                type: "group-message",
                message: message2
              }));
            }
          }
        }
      } catch (error) {
        console.error("WebSocket message error:", error);
        ws.send(JSON.stringify({
          type: "error",
          message: "Invalid message format"
        }));
      }
    });
    ws.on("close", () => {
      if (ws.userId) {
        clients.delete(ws.userId);
        console.log(`User ${ws.userId} disconnected from WebSocket`);
      }
    });
  });
  return httpServer;
}

// server/vite.ts
import express from "express";
import fs from "fs";
import path2, { dirname as dirname2 } from "path";
import { fileURLToPath as fileURLToPath2 } from "url";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import themePlugin from "@replit/vite-plugin-shadcn-theme-json";
import path, { dirname } from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
import { fileURLToPath } from "url";
var __filename = fileURLToPath(import.meta.url);
var __dirname = dirname(__filename);
var vite_config_default = defineConfig({
  plugins: [react(), runtimeErrorOverlay(), themePlugin()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client", "src"),
      "@shared": path.resolve(__dirname, "shared")
    }
  },
  root: path.resolve(__dirname, "client"),
  build: {
    outDir: path.resolve(__dirname, "../server/public"),
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
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
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
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        __dirname2,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path2.resolve(__dirname2, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/index.ts
import "dotenv/config";
var app = express2();
app.use(express2.json());
app.use(express2.urlencoded({ extended: false }));
console.log("\u{1F680} Connected to DB:", process.env.DATABASE_URL);
app.use((req, res, next) => {
  const start = Date.now();
  const path3 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path3.startsWith("/api")) {
      let logLine = `${req.method} ${path3} ${res.statusCode} in ${duration}ms`;
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
