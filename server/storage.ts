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
    try {
      const [user] = await db.select().from(users).where(eq(users.id, id));
      return user;
    } catch (error) {
      console.error('Error getting user:', error);
      return undefined;
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      const [user] = await db.select().from(users).where(eq(users.username, username));
      return user;
    } catch (error) {
      console.error('Error getting user by username:', error);
      return undefined;
    }
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    try {
      const [user] = await db.insert(users).values(insertUser).returning();
      return user;
    } catch (error) {
      console.error('Error creating user:', error);
      throw new Error('Failed to create user');
    }
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    try {
      const [user] = await db
        .update(users)
        .set(updates)
        .where(eq(users.id, id))
        .returning();
      return user;
    } catch (error) {
      console.error('Error updating user:', error);
      return undefined;
    }
  }

  async createProject(project: Omit<Project, "id">): Promise<Project> {
    try {
      const [newProject] = await db.insert(projects).values(project).returning();
      return newProject;
    } catch (error) {
      console.error('Error creating project:', error);
      throw new Error('Failed to create project');
    }
  }

  async getProject(id: number): Promise<Project | undefined> {
    try {
      const [project] = await db.select().from(projects).where(eq(projects.id, id));
      return project;
    } catch (error) {
      console.error('Error getting project:', error);
      return undefined;
    }
  }

  async getAllProjects(): Promise<Project[]> {
    try {
      return await db.select().from(projects);
    } catch (error) {
      console.error('Error getting all projects:', error);
      return [];
    }
  }

  async createDiscussion(discussion: Omit<Discussion, "id">): Promise<Discussion> {
    try {
      const [newDiscussion] = await db.insert(discussions).values(discussion).returning();
      return newDiscussion;
    } catch (error) {
      console.error('Error creating discussion:', error);
      throw new Error('Failed to create discussion');
    }
  }

  async getDiscussion(id: number): Promise<Discussion | undefined> {
    try {
      const [discussion] = await db.select().from(discussions).where(eq(discussions.id, id));
      return discussion;
    } catch (error) {
      console.error('Error getting discussion:', error);
      return undefined;
    }
  }

  async getAllDiscussions(): Promise<Discussion[]> {
    try {
      return await db.select().from(discussions);
    } catch (error) {
      console.error('Error getting all discussions:', error);
      return [];
    }
  }
}

export const storage = new DatabaseStorage();