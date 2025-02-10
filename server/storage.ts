import { InsertUser, User, Project, Discussion } from "@shared/schema";
import createMemoryStore from "memorystore";
import session from "express-session";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  sessionStore: session.SessionStore;
  
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

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private projects: Map<number, Project>;
  private discussions: Map<number, Discussion>;
  sessionStore: session.SessionStore;
  private currentUserId: number;
  private currentProjectId: number;
  private currentDiscussionId: number;

  constructor() {
    this.users = new Map();
    this.projects = new Map();
    this.discussions = new Map();
    this.currentUserId = 1;
    this.currentProjectId = 1;
    this.currentDiscussionId = 1;
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updated = { ...user, ...updates };
    this.users.set(id, updated);
    return updated;
  }

  async createProject(project: Omit<Project, "id">): Promise<Project> {
    const id = this.currentProjectId++;
    const newProject = { ...project, id };
    this.projects.set(id, newProject);
    return newProject;
  }

  async getProject(id: number): Promise<Project | undefined> {
    return this.projects.get(id);
  }

  async getAllProjects(): Promise<Project[]> {
    return Array.from(this.projects.values());
  }

  async createDiscussion(discussion: Omit<Discussion, "id">): Promise<Discussion> {
    const id = this.currentDiscussionId++;
    const newDiscussion = { ...discussion, id };
    this.discussions.set(id, newDiscussion);
    return newDiscussion;
  }

  async getDiscussion(id: number): Promise<Discussion | undefined> {
    return this.discussions.get(id);
  }

  async getAllDiscussions(): Promise<Discussion[]> {
    return Array.from(this.discussions.values());
  }
}

export const storage = new MemStorage();
