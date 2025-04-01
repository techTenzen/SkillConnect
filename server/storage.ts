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

export class MemStorage implements IStorage {
  sessionStore: session.Store;
  private users: User[] = [];
  private projects: Project[] = [];
  private discussions: Discussion[] = [];
  private replies: Reply[] = [];
  private invitations: Invitation[] = [];
  private connectionRequests: ConnectionRequest[] = [];
  private messages: Message[] = [];
  private chatGroups: ChatGroup[] = [];
  private groupMessages: GroupMessage[] = [];
  private nextId = {
    users: 1,
    projects: 1,
    discussions: 1,
    replies: 1,
    invitations: 1,
    connectionRequests: 1,
    messages: 1,
    chatGroups: 1,
    groupMessages: 1,
  };

  constructor() {
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // prune expired entries every 24h
    });
    
    // Clear all data
    this.users = [];
    this.projects = [];
    this.discussions = [];
    this.replies = [];
    this.invitations = [];
    this.connectionRequests = [];
    this.messages = [];
    this.chatGroups = [];
    this.groupMessages = [];
    
    // Reset IDs back to 1
    this.nextId = {
      users: 1,
      projects: 1,
      discussions: 1,
      replies: 1,
      invitations: 1,
      connectionRequests: 1,
      messages: 1,
      chatGroups: 1,
      groupMessages: 1,
    };
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.find(user => user.id === id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return this.users.find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    // Define an empty social object with the correct type
    const emptySocial: { github?: string, linkedin?: string } = {};
    
    const newUser: User = {
      ...insertUser,
      id: this.nextId.users++,
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
    this.users.push(newUser);
    return newUser;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    const index = this.users.findIndex(user => user.id === id);
    if (index === -1) return undefined;
    
    this.users[index] = { ...this.users[index], ...updates };
    return this.users[index];
  }

  async createProject(project: Omit<Project, "id">): Promise<Project> {
    const newProject: Project = {
      ...project,
      id: this.nextId.projects++,
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
    this.projects.push(newProject);
    return newProject;
  }

  async getProject(id: number): Promise<Project | undefined> {
    return this.projects.find(project => project.id === id);
  }

  async getAllProjects(): Promise<Project[]> {
    return this.projects;
  }

  async updateProject(id: number, updates: Partial<Project>): Promise<Project | undefined> {
    const index = this.projects.findIndex(project => project.id === id);
    if (index === -1) return undefined;
    
    this.projects[index] = { ...this.projects[index], ...updates };
    return this.projects[index];
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
    const newDiscussion: Discussion = {
      ...discussion,
      id: this.nextId.discussions++,
      upvotes: discussion.upvotes || 0,
      upvotedBy: discussion.upvotedBy || [],
      category: discussion.category || "general",
      createdAt: discussion.createdAt || new Date().toISOString()
    };
    this.discussions.push(newDiscussion);
    return newDiscussion;
  }

  async getDiscussion(id: number): Promise<Discussion | undefined> {
    return this.discussions.find(discussion => discussion.id === id);
  }

  async getAllDiscussions(): Promise<Discussion[]> {
    return this.discussions;
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
    const index = this.discussions.findIndex(discussion => discussion.id === id);
    if (index === -1) return undefined;
    
    this.discussions[index] = { ...this.discussions[index], ...updates };
    return this.discussions[index];
  }
  
  async createReply(reply: Omit<Reply, "id">): Promise<Reply> {
    const newReply: Reply = {
      ...reply,
      id: this.nextId.replies++,
      upvotes: reply.upvotes || 0,
      upvotedBy: reply.upvotedBy || [],
      createdAt: reply.createdAt || new Date().toISOString()
    };
    this.replies.push(newReply);
    return newReply;
  }
  
  async getRepliesByDiscussion(discussionId: number): Promise<Reply[]> {
    return this.replies.filter(reply => reply.discussionId === discussionId);
  }
  
  async upvoteReply(id: number, userId: number): Promise<Reply | undefined> {
    const reply = this.replies.find(r => r.id === id);
    if (!reply) return undefined;
    
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
    const index = this.replies.findIndex(reply => reply.id === id);
    if (index === -1) return undefined;
    
    this.replies[index] = { ...this.replies[index], ...updates };
    return this.replies[index];
  }

  // Get all users for networking
  async getAllUsers(): Promise<User[]> {
    return this.users;
  }

  // Create an invitation
  async createInvitation(invitation: Omit<Invitation, "id" | "status" | "createdAt">): Promise<Invitation> {
    const fullInvitation: Invitation = {
      ...invitation,
      id: this.nextId.invitations++,
      status: "pending",
      message: invitation.message || null,
      createdAt: new Date().toISOString(),
    };
    
    this.invitations.push(fullInvitation);
    return fullInvitation;
  }

  // Get invitations for a user (both sent and received)
  async getInvitationsByUser(userId: number): Promise<Invitation[]> {
    return this.invitations.filter(
      inv => inv.recipientId === userId || inv.senderId === userId
    );
  }

  // Respond to an invitation (accept or decline)
  async respondToInvitation(id: number, status: "accepted" | "declined"): Promise<Invitation | undefined> {
    const index = this.invitations.findIndex(inv => inv.id === id);
    if (index === -1) return undefined;
    
    this.invitations[index] = { ...this.invitations[index], status };
    
    // If accepted, add the user to the project members
    if (status === "accepted") {
      const invitation = this.invitations[index];
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
    
    return this.invitations[index];
  }

  // Create a connection request
  async createConnectionRequest(request: Omit<ConnectionRequest, "id" | "status" | "createdAt">): Promise<ConnectionRequest> {
    const fullRequest: ConnectionRequest = {
      ...request,
      id: this.nextId.connectionRequests++,
      status: "pending",
      createdAt: new Date().toISOString(),
    };
    
    this.connectionRequests.push(fullRequest);
    return fullRequest;
  }

  // Get connection requests for a user (both sent and received)
  async getConnectionRequestsByUser(userId: number): Promise<ConnectionRequest[]> {
    return this.connectionRequests.filter(
      req => req.recipientId === userId || req.senderId === userId
    );
  }

  // Respond to a connection request (accept or decline)
  async respondToConnectionRequest(id: number, status: "accepted" | "declined"): Promise<ConnectionRequest | undefined> {
    const index = this.connectionRequests.findIndex(req => req.id === id);
    if (index === -1) return undefined;
    
    this.connectionRequests[index] = { ...this.connectionRequests[index], status };
    
    // If accepted, add users to each other's connections
    if (status === "accepted") {
      const request = this.connectionRequests[index];
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
    
    return this.connectionRequests[index];
  }

  // Create a message between users
  async createMessage(message: Omit<Message, "id" | "createdAt">): Promise<Message> {
    const newMessage: Message = {
      ...message,
      id: this.nextId.messages++,
      createdAt: new Date().toISOString(),
    };
    
    this.messages.push(newMessage);
    return newMessage;
  }

  // Get messages between two users
  async getMessagesBetweenUsers(user1Id: number, user2Id: number): Promise<Message[]> {
    return this.messages.filter(
      msg => 
        (msg.senderId === user1Id && msg.recipientId === user2Id) ||
        (msg.senderId === user2Id && msg.recipientId === user1Id)
    ).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  // Create a chat group
  async createChatGroup(group: Omit<ChatGroup, "id" | "createdAt">): Promise<ChatGroup> {
    const newGroup: ChatGroup = {
      ...group,
      id: this.nextId.chatGroups++,
      createdAt: new Date().toISOString(),
    };
    
    this.chatGroups.push(newGroup);
    return newGroup;
  }

  // Get chat groups that a user is a member of
  async getChatGroupsByUser(userId: number): Promise<ChatGroup[]> {
    return this.chatGroups.filter(
      group => (group.members || []).includes(userId)
    );
  }

  // Get a chat group by ID
  async getChatGroup(id: number): Promise<ChatGroup | undefined> {
    return this.chatGroups.find(group => group.id === id);
  }

  // Add a user to a chat group
  async addUserToChatGroup(groupId: number, userId: number): Promise<ChatGroup | undefined> {
    const group = await this.getChatGroup(groupId);
    if (!group) return undefined;
    
    const members = group.members || [];
    
    // Check if user is already in the group
    if (members.includes(userId)) {
      return group;
    }
    
    // Add user to the group
    const updatedGroup = {
      ...group,
      members: [...members, userId]
    };
    
    const index = this.chatGroups.findIndex(g => g.id === groupId);
    this.chatGroups[index] = updatedGroup;
    
    return updatedGroup;
  }

  // Remove a user from a chat group
  async removeUserFromChatGroup(groupId: number, userId: number): Promise<ChatGroup | undefined> {
    const group = await this.getChatGroup(groupId);
    if (!group) return undefined;
    
    const members = group.members || [];
    
    // Check if user is in the group
    if (!members.includes(userId)) {
      return group;
    }
    
    // Remove user from the group
    const updatedGroup = {
      ...group,
      members: members.filter((id: number) => id !== userId)
    };
    
    const index = this.chatGroups.findIndex(g => g.id === groupId);
    this.chatGroups[index] = updatedGroup;
    
    return updatedGroup;
  }

  // Create a message in a chat group
  async createGroupMessage(message: Omit<GroupMessage, "id" | "createdAt">): Promise<GroupMessage> {
    const newMessage: GroupMessage = {
      ...message,
      id: this.nextId.groupMessages++,
      createdAt: new Date().toISOString(),
    };
    
    this.groupMessages.push(newMessage);
    return newMessage;
  }

  // Get messages for a chat group
  async getMessagesByChatGroup(groupId: number): Promise<GroupMessage[]> {
    return this.groupMessages.filter(
      msg => msg.groupId === groupId
    ).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }
}

export const storage = new MemStorage();