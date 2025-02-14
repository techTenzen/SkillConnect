import { InsertUser, User, Project, Discussion } from "@shared/schema";
import { users, projects, discussions } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  sessionStore: session.Store;

  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<User>): Promise<User | undefined>;

  // Projects
  createProject(project: Omit<Project, "id">): Promise<Project>;
  getProject(id: number): Promise<Project | undefined>;
  getAllProjects(): Promise<Project[]>;

  // Discussions
  createDiscussion(discussion: Omit<Discussion, "id">): Promise<Discussion>;
  getDiscussion(id: number): Promise<Discussion | undefined>;
  getAllDiscussions(): Promise<Discussion[]>;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true,
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username));
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db.insert(users).values({ 
      ...insertUser,
      created_at: new Date(),
      updated_at: new Date()
    }).returning();
    return result[0];
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    const result = await db
      .update(users)
      .set({ ...updates, updated_at: new Date() })
      .where(eq(users.id, id))
      .returning();
    return result[0];
  }

  async createProject(project: Omit<Project, "id">): Promise<Project> {
    const result = await db.insert(projects).values({
      ...project,
      created_at: new Date(),
      updated_at: new Date()
    }).returning();
    return result[0];
  }

  async getProject(id: number): Promise<Project | undefined> {
    const result = await db.select().from(projects).where(eq(projects.id, id));
    return result[0];
  }

  async getAllProjects(): Promise<Project[]> {
    return db.select().from(projects);
  }

  async createDiscussion(discussion: Omit<Discussion, "id">): Promise<Discussion> {
    const result = await db.insert(discussions).values({
      ...discussion,
      created_at: new Date(),
      updated_at: new Date()
    }).returning();
    return result[0];
  }

  async getDiscussion(id: number): Promise<Discussion | undefined> {
    const result = await db.select().from(discussions).where(eq(discussions.id, id));
    return result[0];
  }

  async getAllDiscussions(): Promise<Discussion[]> {
    return db.select().from(discussions);
  }
}

export const storage = new DatabaseStorage();