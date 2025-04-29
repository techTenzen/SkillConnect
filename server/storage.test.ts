import session from "express-session";
import createMemoryStore from "memorystore";
import { User, Project, Discussion, Reply, Invitation, ConnectionRequest, Message, ChatGroup, GroupMessage } from "../shared/schema";
import type { IStorage } from "./storage";

const MemoryStore = createMemoryStore(session);

/**
 * A completely clean storage implementation for testing purposes
 */
export class TestStorage implements IStorage {
  sessionStore: session.Store;
  users: User[] = [];
  projects: Project[] = [];
  discussions: Discussion[] = [];
  replies: Reply[] = [];
  invitations: Invitation[] = [];
  connectionRequests: ConnectionRequest[] = [];
  messages: Message[] = [];
  chatGroups: ChatGroup[] = [];
  groupMessages: GroupMessage[] = [];
  nextId = {
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
      checkPeriod: 86400000,
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.find((u) => u.id === id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return this.users.find((u) => u.username === username);
  }

  async createUser(insertUser: any): Promise<User> {
    const newUser: User = {
      ...insertUser,
      id: this.nextId.users++,
      connections: insertUser.connections || [],
    };
    this.users.push(newUser);
    return newUser;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;

    Object.assign(user, updates);
    return user;
  }

  async createProject(project: Omit<Project, "id">): Promise<Project> {
    const newProject: Project = {
      ...project,
      id: this.nextId.projects++,
    };
    this.projects.push(newProject);
    return newProject;
  }

  async getProject(id: number): Promise<Project | undefined> {
    return this.projects.find((p) => p.id === id);
  }

  async getAllProjects(): Promise<Project[]> {
    return [...this.projects];
  }

  async updateProject(id: number, updates: Partial<Project>): Promise<Project | undefined> {
    const project = await this.getProject(id);
    if (!project) return undefined;

    Object.assign(project, updates);
    return project;
  }

  async requestToJoinProject(projectId: number, userId: number): Promise<Project | undefined> {
    const project = await this.getProject(projectId);
    if (!project) return undefined;

    if (!project.join_requests.includes(userId)) {
      project.join_requests.push(userId);
    }
    return project;
  }

  async acceptJoinRequest(projectId: number, userId: number): Promise<Project | undefined> {
    const project = await this.getProject(projectId);
    if (!project) return undefined;

    project.join_requests = project.join_requests.filter((id) => id !== userId);
    if (!project.members.includes(userId)) {
      project.members.push(userId);
    }
    return project;
  }

  async rejectJoinRequest(projectId: number, userId: number): Promise<Project | undefined> {
    const project = await this.getProject(projectId);
    if (!project) return undefined;

    project.join_requests = project.join_requests.filter((id) => id !== userId);
    return project;
  }

  async createDiscussion(discussion: Omit<Discussion, "id">): Promise<Discussion> {
    const newDiscussion: Discussion = {
      ...discussion,
      id: this.nextId.discussions++,
    };
    this.discussions.push(newDiscussion);
    return newDiscussion;
  }

  async getDiscussion(id: number): Promise<Discussion | undefined> {
    return this.discussions.find((d) => d.id === id);
  }

  async getAllDiscussions(): Promise<Discussion[]> {
    return [...this.discussions];
  }

  async upvoteDiscussion(id: number, userId: number): Promise<Discussion | undefined> {
    const discussion = await this.getDiscussion(id);
    if (!discussion) return undefined;

    if (discussion.upvoted_by.includes(userId)) {
      // Remove upvote if already upvoted
      discussion.upvoted_by = discussion.upvoted_by.filter((id) => id !== userId);
      discussion.upvotes--;
    } else {
      // Add upvote
      discussion.upvoted_by.push(userId);
      discussion.upvotes++;
    }
    return discussion;
  }

  async createReply(reply: Omit<Reply, "id">): Promise<Reply> {
    const newReply: Reply = {
      ...reply,
      id: this.nextId.replies++,
    };
    this.replies.push(newReply);
    return newReply;
  }

  async getRepliesByDiscussion(discussionId: number): Promise<Reply[]> {
    return this.replies.filter((r) => r.discussion_id === discussionId);
  }

  async upvoteReply(id: number, userId: number): Promise<Reply | undefined> {
    const reply = this.replies.find((r) => r.id === id);
    if (!reply) return undefined;

    if (reply.upvoted_by.includes(userId)) {
      // Remove upvote if already upvoted
      reply.upvoted_by = reply.upvoted_by.filter((id) => id !== userId);
      reply.upvotes--;
    } else {
      // Add upvote
      reply.upvoted_by.push(userId);
      reply.upvotes++;
    }
    return reply;
  }

  async getAllUsers(): Promise<User[]> {
    return [...this.users];
  }

  async createInvitation(invitation: Omit<Invitation, "id" | "status" | "createdAt">): Promise<Invitation> {
    const fullInvitation: Invitation = {
      ...invitation,
      id: this.nextId.invitations++,
      status: "pending",
      createdAt: new Date().toISOString(),
    };
    this.invitations.push(fullInvitation);
    return fullInvitation;
  }

  async getInvitationsByUser(userId: number): Promise<Invitation[]> {
    return this.invitations.filter(
        (i) => i.recipientId === userId || i.senderId === userId
    );
  }

  async respondToInvitation(id: number, status: "accepted" | "declined"): Promise<Invitation | undefined> {
    const invitation = this.invitations.find((i) => i.id === id);
    if (!invitation) return undefined;

    invitation.status = status;
    return invitation;
  }

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

  async getConnectionRequestsByUser(userId: number): Promise<ConnectionRequest[]> {
    return this.connectionRequests.filter(
        (r) => r.senderId === userId || r.receiverId === userId
    );
  }

  async respondToConnectionRequest(id: number, status: "accepted" | "declined"): Promise<ConnectionRequest | undefined> {
    const request = this.connectionRequests.find((r) => r.id === id);
    if (!request) return undefined;

    request.status = status;

    // If accepted, add connection to both users
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

  async createMessage(message: Omit<Message, "id" | "createdAt">): Promise<Message> {
    const newMessage: Message = {
      ...message,
      id: this.nextId.messages++,
      createdAt: new Date().toISOString(),
    };
    this.messages.push(newMessage);
    return newMessage;
  }

  async getMessagesBetweenUsers(user1Id: number, user2Id: number): Promise<Message[]> {
    return this.messages.filter(
        (m) =>
            (m.senderId === user1Id && m.receiverId === user2Id) ||
            (m.senderId === user2Id && m.receiverId === user1Id)
    ).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  async getAllMessages(): Promise<Message[]> {
    return this.messages;
  }

  async markMessageAsRead(messageId: number): Promise<Message | undefined> {
    const index = this.messages.findIndex(msg => msg.id === messageId);
    if (index === -1) return undefined;

    this.messages[index] = { ...this.messages[index], read: true };
    return this.messages[index];
  }

  async createChatGroup(group: Omit<ChatGroup, "id" | "createdAt">): Promise<ChatGroup> {
    const newGroup: ChatGroup = {
      ...group,
      id: this.nextId.chatGroups++,
      createdAt: new Date().toISOString(),
    };
    this.chatGroups.push(newGroup);
    return newGroup;
  }

  async getChatGroupsByUser(userId: number): Promise<ChatGroup[]> {
    return this.chatGroups.filter(
        (g) => g.memberIds.includes(userId)
    );
  }

  async getChatGroup(id: number): Promise<ChatGroup | undefined> {
    return this.chatGroups.find((g) => g.id === id);
  }

  async addUserToChatGroup(groupId: number, userId: number): Promise<ChatGroup | undefined> {
    const group = await this.getChatGroup(groupId);
    if (!group) return undefined;

    if (!group.memberIds.includes(userId)) {
      group.memberIds.push(userId);
    }

    return group;
  }

  async removeUserFromChatGroup(groupId: number, userId: number): Promise<ChatGroup | undefined> {
    const group = await this.getChatGroup(groupId);
    if (!group) return undefined;

    group.memberIds = group.memberIds.filter((id) => id !== userId);

    return group;
  }

  async createGroupMessage(message: Omit<GroupMessage, "id" | "createdAt">): Promise<GroupMessage> {
    const newMessage: GroupMessage = {
      ...message,
      id: this.nextId.groupMessages++,
      createdAt: new Date().toISOString(),
    };
    this.groupMessages.push(newMessage);
    return newMessage;
  }

  async getMessagesByChatGroup(groupId: number): Promise<GroupMessage[]> {
    return this.groupMessages.filter(
        (m) => m.chatGroupId === groupId
    ).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }
}

export const testStorage = new TestStorage();