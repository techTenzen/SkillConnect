import {
  InsertUser, User, Project, Discussion,
  Reply, InsertReply, Invitation, InsertInvitation,
  ConnectionRequest, InsertConnectionRequest,
  Message, InsertMessage,
  ChatGroup, InsertChatGroup,
  GroupMessage, InsertGroupMessage
} from "@shared/schema";
import {
  users, projects, discussions, replies, invitations,
  connectionRequests, messages, chatGroups, groupMessages
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";
import { db } from "./db"; // Import your Drizzle database connection
import { eq, and, or, desc, asc } from "drizzle-orm"; // Import Drizzle operators

const MemoryStore = createMemoryStore(session);

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
  createInvitation(invitation: Omit<Invitation, "id" | "status" | "createdAt">): Promise<Invitation>;
  getInvitationsByUser(userId: number): Promise<Invitation[]>;
  respondToInvitation(id: number, status: "accepted" | "declined"): Promise<Invitation | undefined>;

  // Connection Requests
  createConnectionRequest(request: Omit<ConnectionRequest, "id" | "status" | "createdAt">): Promise<ConnectionRequest>;
  getConnectionRequestsByUser(userId: number): Promise<ConnectionRequest[]>;
  respondToConnectionRequest(id: number, status: "accepted" | "declined"): Promise<ConnectionRequest | undefined>;

  // Messages
  createMessage(message: Omit<Message, "id" | "createdAt">): Promise<Message>;
  getMessagesBetweenUsers(user1Id: number, user2Id: number): Promise<Message[]>;
  getAllMessages(): Promise<Message[]>;
  markMessageAsRead(messageId: number): Promise<Message | undefined>;

  // Chat Groups
  createChatGroup(group: Omit<ChatGroup, "id" | "createdAt">): Promise<ChatGroup>;
  getChatGroupsByUser(userId: number): Promise<ChatGroup[]>;
  getChatGroup(id: number): Promise<ChatGroup | undefined>;
  addUserToChatGroup(groupId: number, userId: number): Promise<ChatGroup | undefined>;
  removeUserFromChatGroup(groupId: number, userId: number): Promise<ChatGroup | undefined>;

  // Group Messages
  createGroupMessage(message: Omit<GroupMessage, "id" | "createdAt">): Promise<GroupMessage>;
  getMessagesByChatGroup(groupId: number): Promise<GroupMessage[]>;
}


export class DrizzleStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // prune expired entries every 24h
    });
  }

  // Users
  async getUser(id: number): Promise<User | undefined> {
    const results = await db.select().from(users).where(eq(users.id, id));
    return results[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const results = await db.select().from(users).where(eq(users.username, username));
    return results[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const emptySocial: { github?: string, linkedin?: string } = {};

    const newUser = {
      ...insertUser,
      bio: insertUser.bio || "",
      avatar: insertUser.avatar || "",
      skills: insertUser.skills || {},
      social: insertUser.social ?
          {
            github: typeof insertUser.social.github === 'string' ? insertUser.social.github : undefined,
            linkedin: typeof insertUser.social.linkedin === 'string' ? insertUser.social.linkedin : undefined
          } : emptySocial,
      connections: []
    };

    const result = await db.insert(users).values(newUser).returning();
    return result[0];
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    const result = await db.update(users)
        .set(updates)
        .where(eq(users.id, id))
        .returning();

    return result[0];
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  // Projects
  async createProject(project: Omit<Project, "id">): Promise<Project> {
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

  async getProject(id: number): Promise<Project | undefined> {
    const results = await db.select().from(projects).where(eq(projects.id, id));
    return results[0];
  }

  async getAllProjects(): Promise<Project[]> {
    return await db.select().from(projects);
  }

  async updateProject(id: number, updates: Partial<Project>): Promise<Project | undefined> {
    const result = await db.update(projects)
        .set(updates)
        .where(eq(projects.id, id))
        .returning();

    return result[0];
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

  // Discussions
  async createDiscussion(discussion: Omit<Discussion, "id">): Promise<Discussion> {
    const newDiscussion = {
      ...discussion,
      upvotes: discussion.upvotes || 0,
      upvotedBy: discussion.upvotedBy || [],
      category: discussion.category || "general",
      createdAt: discussion.createdAt || new Date().toISOString()
    };

    const result = await db.insert(discussions).values(newDiscussion).returning();
    return result[0];
  }

  async getDiscussion(id: number): Promise<Discussion | undefined> {
    const results = await db.select().from(discussions).where(eq(discussions.id, id));
    return results[0];
  }

  async getAllDiscussions(): Promise<Discussion[]> {
    return await db.select().from(discussions);
  }

  async upvoteDiscussion(id: number, userId: number): Promise<Discussion | undefined> {
    const discussion = await this.getDiscussion(id);
    if (!discussion) return undefined;

    const upvotedBy = discussion.upvotedBy || [];

    // Check if user already upvoted
    if (upvotedBy.includes(userId)) {
      // Remove upvote
      const newUpvotedBy = upvotedBy.filter(uid => uid !== userId);
      return this.updateDiscussion(id, {
        upvotedBy: newUpvotedBy,
        upvotes: Math.max(0, (discussion.upvotes || 0) - 1)
      });
    } else {
      // Add upvote
      return this.updateDiscussion(id, {
        upvotedBy: [...upvotedBy, userId],
        upvotes: (discussion.upvotes || 0) + 1
      });
    }
  }

  private async updateDiscussion(id: number, updates: Partial<Discussion>): Promise<Discussion | undefined> {
    const result = await db.update(discussions)
        .set(updates)
        .where(eq(discussions.id, id))
        .returning();

    return result[0];
  }

  // Replies
  async createReply(reply: Omit<Reply, "id">): Promise<Reply> {
    const newReply = {
      ...reply,
      upvotes: reply.upvotes || 0,
      upvotedBy: reply.upvotedBy || [],
      createdAt: reply.createdAt || new Date().toISOString()
    };

    const result = await db.insert(replies).values(newReply).returning();
    return result[0];
  }

  async getRepliesByDiscussion(discussionId: number): Promise<Reply[]> {
    return await db.select().from(replies).where(eq(replies.discussionId, discussionId));
  }

  async upvoteReply(id: number, userId: number): Promise<Reply | undefined> {
    const replyResults = await db.select().from(replies).where(eq(replies.id, id));
    if (replyResults.length === 0) return undefined;

    const reply = replyResults[0];
    const upvotedBy = reply.upvotedBy || [];

    // Check if user already upvoted
    if (upvotedBy.includes(userId)) {
      // Remove upvote
      const newUpvotedBy = upvotedBy.filter(uid => uid !== userId);
      return this.updateReply(id, {
        upvotedBy: newUpvotedBy,
        upvotes: Math.max(0, (reply.upvotes || 0) - 1)
      });
    } else {
      // Add upvote
      return this.updateReply(id, {
        upvotedBy: [...upvotedBy, userId],
        upvotes: (reply.upvotes || 0) + 1
      });
    }
  }

  private async updateReply(id: number, updates: Partial<Reply>): Promise<Reply | undefined> {
    const result = await db.update(replies)
        .set(updates)
        .where(eq(replies.id, id))
        .returning();

    return result[0];
  }

  // Invitations
  async createInvitation(invitation: Omit<Invitation, "id" | "status" | "createdAt">): Promise<Invitation> {
    const fullInvitation = {
      ...invitation,
      status: "pending",
      message: invitation.message || null,
      createdAt: new Date().toISOString(),
    };

    const result = await db.insert(invitations).values(fullInvitation).returning();
    return result[0];
  }

  async getInvitationsByUser(userId: number): Promise<Invitation[]> {
    return await db.select().from(invitations).where(
        or(
            eq(invitations.recipientId, userId),
            eq(invitations.senderId, userId)
        )
    );
  }

  async respondToInvitation(id: number, status: "accepted" | "declined"): Promise<Invitation | undefined> {
    const result = await db.update(invitations)
        .set({ status })
        .where(eq(invitations.id, id))
        .returning();

    if (result.length === 0) return undefined;

    // If accepted, add the user to the project members
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
  async createConnectionRequest(request: Omit<ConnectionRequest, "id" | "status" | "createdAt">): Promise<ConnectionRequest> {
    const fullRequest = {
      ...request,
      status: "pending",
      createdAt: new Date().toISOString(),
    };

    const result = await db.insert(connectionRequests).values(fullRequest).returning();
    return result[0];
  }

  async getConnectionRequestsByUser(userId: number): Promise<ConnectionRequest[]> {
    return await db.select().from(connectionRequests).where(
        or(
            eq(connectionRequests.recipientId, userId),
            eq(connectionRequests.senderId, userId)
        )
    );
  }

  async respondToConnectionRequest(id: number, status: "accepted" | "declined"): Promise<ConnectionRequest | undefined> {
    const result = await db.update(connectionRequests)
        .set({ status })
        .where(eq(connectionRequests.id, id))
        .returning();

    if (result.length === 0) return undefined;

    // If accepted, add users to each other's connections
    if (status === "accepted") {
      const request = result[0];
      const sender = await this.getUser(request.senderId);
      const recipient = await this.getUser(request.recipientId);

      if (sender && recipient) {
        // Add recipient to sender's connections if not already there
        if (!sender.connections?.includes(request.recipientId)) {
          await this.updateUser(sender.id, {
            connections: [...(sender.connections || []), request.recipientId]
          });
        }

        // Add sender to recipient's connections if not already there
        if (!recipient.connections?.includes(request.senderId)) {
          await this.updateUser(recipient.id, {
            connections: [...(recipient.connections || []), request.senderId]
          });
        }
      }
    }

    return result[0];
  }

  // Messages
  async createMessage(message: Omit<Message, "id" | "createdAt">): Promise<Message> {
    const newMessage = {
      ...message,
      createdAt: new Date().toISOString(),
    };

    const result = await db.insert(messages).values(newMessage).returning();
    return result[0];
  }

  async getMessagesBetweenUsers(user1Id: number, user2Id: number): Promise<Message[]> {
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

  async getAllMessages(): Promise<Message[]> {
    return await db.select().from(messages);
  }

  async markMessageAsRead(messageId: number): Promise<Message | undefined> {
    const result = await db.update(messages)
        .set({ read: true })
        .where(eq(messages.id, messageId))
        .returning();

    return result[0];
  }

  // Chat Groups
  async createChatGroup(group: Omit<ChatGroup, "id" | "createdAt">): Promise<ChatGroup> {
    const newGroup = {
      ...group,
      createdAt: new Date().toISOString(),
    };

    const result = await db.insert(chatGroups).values(newGroup).returning();
    return result[0];
  }

  async getChatGroupsByUser(userId: number): Promise<ChatGroup[]> {
    // We need to filter groups where the userId is in the members array
    const allGroups = await db.select().from(chatGroups);
    return allGroups.filter(group => (group.members || []).includes(userId));
  }

  async getChatGroup(id: number): Promise<ChatGroup | undefined> {
    const results = await db.select().from(chatGroups).where(eq(chatGroups.id, id));
    return results[0];
  }

  async addUserToChatGroup(groupId: number, userId: number): Promise<ChatGroup | undefined> {
    const group = await this.getChatGroup(groupId);
    if (!group) return undefined;

    const members = group.members || [];

    // Check if user is already in the group
    if (members.includes(userId)) {
      return group;
    }

    // Add user to the group
    const updatedMembers = [...members, userId];

    const result = await db.update(chatGroups)
        .set({ members: updatedMembers })
        .where(eq(chatGroups.id, groupId))
        .returning();

    return result[0];
  }

  async removeUserFromChatGroup(groupId: number, userId: number): Promise<ChatGroup | undefined> {
    const group = await this.getChatGroup(groupId);
    if (!group) return undefined;

    const members = group.members || [];

    // Check if user is in the group
    if (!members.includes(userId)) {
      return group;
    }

    // Remove user from the group
    const updatedMembers = members.filter((id: number) => id !== userId);

    const result = await db.update(chatGroups)
        .set({ members: updatedMembers })
        .where(eq(chatGroups.id, groupId))
        .returning();

    return result[0];
  }

  // Group Messages
  async createGroupMessage(message: Omit<GroupMessage, "id" | "createdAt">): Promise<GroupMessage> {
    const newMessage = {
      ...message,
      createdAt: new Date().toISOString(),
    };

    const result = await db.insert(groupMessages).values(newMessage).returning();
    return result[0];
  }

  async getMessagesByChatGroup(groupId: number): Promise<GroupMessage[]> {
    return await db.select()
        .from(groupMessages)
        .where(eq(groupMessages.groupId, groupId))
        .orderBy(asc(groupMessages.createdAt));
  }
}

// Replace the MemStorage instance with a DrizzleStorage instance
export const storage = new DrizzleStorage();