import { 
  InsertUser, User, Project, Discussion, 
  Reply, InsertReply, Invitation, InsertInvitation
} from "@shared/schema";
import { users, projects, discussions, replies, invitations } from "@shared/schema";
import { db } from "./db";
import { eq, or } from "drizzle-orm";
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
  getAllUsers(): Promise<User[]>;

  // Projects
  createProject(project: Omit<Project, "id">): Promise<Project>;
  getProject(id: number): Promise<Project | undefined>;
  getAllProjects(): Promise<Project[]>;
  updateProject(id: number, updates: Partial<Project>): Promise<Project | undefined>;
  requestToJoinProject(projectId: number, userId: number): Promise<Project | undefined>;
  acceptJoinRequest(projectId: number, userId: number): Promise<Project | undefined>;
  rejectJoinRequest(projectId: number, userId: number): Promise<Project | undefined>;

  // Discussions
  createDiscussion(discussion: Omit<Discussion, "id">): Promise<Discussion>;
  getDiscussion(id: number): Promise<Discussion | undefined>;
  getAllDiscussions(): Promise<Discussion[]>;
  upvoteDiscussion(id: number, userId: number): Promise<Discussion | undefined>;
  
  // Replies
  createReply(reply: Omit<Reply, "id">): Promise<Reply>;
  getRepliesByDiscussion(discussionId: number): Promise<Reply[]>;
  upvoteReply(id: number, userId: number): Promise<Reply | undefined>;
  
  // Invitations
  createInvitation(invitation: Omit<Invitation, "id" | "senderId" | "status" | "createdAt">): Promise<Invitation>;
  getInvitationsByUser(userId: number): Promise<Invitation[]>;
  respondToInvitation(id: number, status: "accepted" | "declined"): Promise<Invitation | undefined>;
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
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async createProject(project: Omit<Project, "id">): Promise<Project> {
    const [newProject] = await db.insert(projects).values(project).returning();
    return newProject;
  }

  async getProject(id: number): Promise<Project | undefined> {
    const [project] = await db.select().from(projects).where(eq(projects.id, id));
    return project;
  }

  async getAllProjects(): Promise<Project[]> {
    return db.select().from(projects);
  }

  async updateProject(id: number, updates: Partial<Project>): Promise<Project | undefined> {
    const [project] = await db
      .update(projects)
      .set(updates)
      .where(eq(projects.id, id))
      .returning();
    return project;
  }

  async requestToJoinProject(projectId: number, userId: number): Promise<Project | undefined> {
    const project = await this.getProject(projectId);
    if (!project) return undefined;

    const joinRequests = project.joinRequests || [];
    
    // Check if user already requested to join
    if (joinRequests.includes(userId)) {
      return project;
    }

    // Add user to join requests
    return this.updateProject(projectId, {
      joinRequests: [...joinRequests, userId]
    });
  }

  async acceptJoinRequest(projectId: number, userId: number): Promise<Project | undefined> {
    const project = await this.getProject(projectId);
    if (!project) return undefined;

    const joinRequests = project.joinRequests || [];
    const members = project.members || [];
    
    // Check if user is in join requests
    if (!joinRequests.includes(userId)) {
      return project;
    }

    // Remove user from join requests and add to members
    return this.updateProject(projectId, {
      joinRequests: joinRequests.filter(id => id !== userId),
      members: [...members, userId]
    });
  }

  async rejectJoinRequest(projectId: number, userId: number): Promise<Project | undefined> {
    const project = await this.getProject(projectId);
    if (!project) return undefined;

    const joinRequests = project.joinRequests || [];
    
    // Check if user is in join requests
    if (!joinRequests.includes(userId)) {
      return project;
    }

    // Remove user from join requests
    return this.updateProject(projectId, {
      joinRequests: joinRequests.filter(id => id !== userId)
    });
  }

  async createDiscussion(discussion: Omit<Discussion, "id">): Promise<Discussion> {
    const [newDiscussion] = await db.insert(discussions).values(discussion).returning();
    return newDiscussion;
  }

  async getDiscussion(id: number): Promise<Discussion | undefined> {
    const [discussion] = await db.select().from(discussions).where(eq(discussions.id, id));
    return discussion;
  }

  async getAllDiscussions(): Promise<Discussion[]> {
    return db.select().from(discussions);
  }
  
  async upvoteDiscussion(id: number, userId: number): Promise<Discussion | undefined> {
    const discussion = await this.getDiscussion(id);
    if (!discussion) return undefined;
    
    const upvotedBy = discussion.upvotedBy || [];
    
    // Check if user already upvoted
    if (upvotedBy.includes(userId)) {
      // Remove upvote
      const newUpvotedBy = upvotedBy.filter(uid => uid !== userId);
      const [updated] = await db
        .update(discussions)
        .set({
          upvotedBy: newUpvotedBy,
          upvotes: Math.max(0, (discussion.upvotes || 0) - 1)
        })
        .where(eq(discussions.id, id))
        .returning();
      return updated;
    } else {
      // Add upvote
      const [updated] = await db
        .update(discussions)
        .set({
          upvotedBy: [...upvotedBy, userId],
          upvotes: (discussion.upvotes || 0) + 1
        })
        .where(eq(discussions.id, id))
        .returning();
      return updated;
    }
  }
  
  async createReply(reply: Omit<Reply, "id">): Promise<Reply> {
    const [newReply] = await db.insert(replies).values(reply).returning();
    return newReply;
  }
  
  async getRepliesByDiscussion(discussionId: number): Promise<Reply[]> {
    return db.select().from(replies).where(eq(replies.discussionId, discussionId));
  }
  
  async upvoteReply(id: number, userId: number): Promise<Reply | undefined> {
    const [reply] = await db.select().from(replies).where(eq(replies.id, id));
    if (!reply) return undefined;
    
    const upvotedBy = reply.upvotedBy || [];
    
    // Check if user already upvoted
    if (upvotedBy.includes(userId)) {
      // Remove upvote
      const newUpvotedBy = upvotedBy.filter(uid => uid !== userId);
      const [updated] = await db
        .update(replies)
        .set({
          upvotedBy: newUpvotedBy,
          upvotes: Math.max(0, (reply.upvotes || 0) - 1)
        })
        .where(eq(replies.id, id))
        .returning();
      return updated;
    } else {
      // Add upvote
      const [updated] = await db
        .update(replies)
        .set({
          upvotedBy: [...upvotedBy, userId],
          upvotes: (reply.upvotes || 0) + 1
        })
        .where(eq(replies.id, id))
        .returning();
      return updated;
    }
  }

  // Get all users for networking
  async getAllUsers(): Promise<User[]> {
    return db.select().from(users);
  }

  // Create an invitation
  async createInvitation(invitation: Omit<Invitation, "id" | "senderId" | "status" | "createdAt">): Promise<Invitation> {
    const fullInvitation = {
      ...invitation,
      senderId: 0, // This will be set in the route handler
      status: "pending",
      createdAt: new Date().toISOString(),
    };
    
    const [newInvitation] = await db.insert(invitations).values(fullInvitation).returning();
    return newInvitation;
  }

  // Get invitations for a user (both sent and received)
  async getInvitationsByUser(userId: number): Promise<Invitation[]> {
    return db
      .select()
      .from(invitations)
      .where(
        or(
          eq(invitations.recipientId, userId),
          eq(invitations.senderId, userId)
        )
      );
  }

  // Respond to an invitation (accept or decline)
  async respondToInvitation(id: number, status: "accepted" | "declined"): Promise<Invitation | undefined> {
    const [invitation] = await db
      .update(invitations)
      .set({ status })
      .where(eq(invitations.id, id))
      .returning();
    
    // If accepted, add the user to the project members
    if (status === "accepted" && invitation) {
      // Get the project and update its members
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
    
    return invitation;
  }
}

export const storage = new DatabaseStorage();