import type { Express } from "express";
import { createServer, type Server } from "http";
import WebSocket, { WebSocketServer } from "ws";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { 
  insertProjectSchema, 
  insertDiscussionSchema, 
  insertReplySchema, 
  insertInvitationSchema,
  insertConnectionRequestSchema,
  insertMessageSchema,
  insertChatGroupSchema,
  insertGroupMessageSchema
} from "@shared/schema";
import { getAIResponse, getSkillSuggestions } from "./openai";

// Extend WebSocket interface for our custom properties
interface ExtendedWebSocket extends WebSocket {
  userId?: number;
}

export function registerRoutes(app: Express): Server {
  setupAuth(app);

  // Profile routes
  app.patch("/api/profile", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const updatedUser = await storage.updateUser(req.user.id, req.body);
    if (!updatedUser) return res.sendStatus(404);

    res.json(updatedUser);
  });

  // Project routes
  app.get("/api/projects", async (req, res) => {
    const projects = await storage.getAllProjects();
    res.json(projects);
  });

  app.get("/api/projects/:id", async (req, res) => {
    const project = await storage.getProject(parseInt(req.params.id));
    if (!project) return res.sendStatus(404);
    res.json(project);
  });

  app.post("/api/projects", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const validated = insertProjectSchema.parse(req.body);
      const project = await storage.createProject({
        ...validated,
        ownerId: req.user.id,
        members: [req.user.id],
        joinRequests: [],
        status: "open",
      });

      res.status(201).json(project);
    } catch (error) {
      console.error("Project creation error:", error);
      res.status(400).json({ message: "Invalid project data" });
    }
  });

  app.post("/api/projects/:id/join", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const projectId = parseInt(req.params.id);
    const userId = req.user.id;
    
    const project = await storage.requestToJoinProject(projectId, userId);
    if (!project) return res.sendStatus(404);
    
    res.json(project);
  });

  app.post("/api/projects/:id/accept", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const projectId = parseInt(req.params.id);
    const project = await storage.getProject(projectId);
    
    if (!project) return res.sendStatus(404);
    if (project.ownerId !== req.user.id) return res.sendStatus(403);
    
    const userId = parseInt(req.body.userId);
    const updatedProject = await storage.acceptJoinRequest(projectId, userId);
    
    res.json(updatedProject);
  });

  app.post("/api/projects/:id/reject", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const projectId = parseInt(req.params.id);
    const project = await storage.getProject(projectId);
    
    if (!project) return res.sendStatus(404);
    if (project.ownerId !== req.user.id) return res.sendStatus(403);
    
    const userId = parseInt(req.body.userId);
    const updatedProject = await storage.rejectJoinRequest(projectId, userId);
    
    res.json(updatedProject);
  });

  // Discussion routes
  app.get("/api/discussions", async (req, res) => {
    const discussions = await storage.getAllDiscussions();
    res.json(discussions);
  });

  app.get("/api/discussions/:id", async (req, res) => {
    const discussion = await storage.getDiscussion(parseInt(req.params.id));
    if (!discussion) return res.sendStatus(404);
    res.json(discussion);
  });

  app.post("/api/discussions", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const validated = insertDiscussionSchema.parse(req.body);
      const discussion = await storage.createDiscussion({
        ...validated,
        authorId: req.user.id,
        upvotes: 0,
        upvotedBy: [],
        createdAt: new Date().toISOString(),
      });

      res.status(201).json(discussion);
    } catch (error) {
      console.error("Discussion creation error:", error);
      res.status(400).json({ message: "Invalid discussion data" });
    }
  });
  
  app.post("/api/discussions/:id/upvote", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const discussionId = parseInt(req.params.id);
    const userId = req.user.id;
    
    const discussion = await storage.upvoteDiscussion(discussionId, userId);
    if (!discussion) return res.sendStatus(404);
    
    res.json(discussion);
  });
  
  // Reply routes
  app.get("/api/discussions/:id/replies", async (req, res) => {
    const discussionId = parseInt(req.params.id);
    const replies = await storage.getRepliesByDiscussion(discussionId);
    res.json(replies);
  });
  
  app.post("/api/discussions/:id/replies", async (req, res) => {
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
        createdAt: new Date().toISOString(),
      });
      
      res.status(201).json(reply);
    } catch (error) {
      console.error("Reply creation error:", error);
      res.status(400).json({ message: "Invalid reply data" });
    }
  });
  
  app.post("/api/replies/:id/upvote", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const replyId = parseInt(req.params.id);
    const userId = req.user.id;
    
    const reply = await storage.upvoteReply(replyId, userId);
    if (!reply) return res.sendStatus(404);
    
    res.json(reply);
  });

  // Networking routes
  app.get("/api/users", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const users = await storage.getAllUsers();
    // Don't send passwords to the client
    const sanitizedUsers = users.map(({ password, ...user }) => user);
    res.json(sanitizedUsers);
  });
  
  // Get user by ID
  app.get("/api/users/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const userId = parseInt(req.params.id);
    const user = await storage.getUser(userId);
    
    if (!user) return res.sendStatus(404);
    
    // Don't send password to the client
    const { password, ...sanitizedUser } = user;
    
    // Check if current user has sent a connection request to this user
    const sentInvitations = await storage.getInvitationsByUser(req.user.id);
    const hasSentRequest = sentInvitations.some(
      invitation => invitation.recipientId === userId && invitation.status === "pending"
    );
    
    // Check if users are already connected (both have accepted invitations)
    const receivedInvitations = await storage.getInvitationsByUser(userId);
    const isConnected = sentInvitations.some(
      invitation => invitation.recipientId === userId && invitation.status === "accepted"
    ) || receivedInvitations.some(
      invitation => invitation.senderId === userId && invitation.status === "accepted"
    );
    
    res.json({
      ...sanitizedUser,
      hasSentRequest,
      isConnected
    });
  });
  
  app.get("/api/invitations", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const invitations = await storage.getInvitationsByUser(req.user.id);
    res.json(invitations);
  });
  
  app.post("/api/invitations", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const validated = insertInvitationSchema.parse(req.body);
      
      // Check if they're already connected or have a pending request
      const sentInvitations = await storage.getInvitationsByUser(req.user.id);
      const alreadySent = sentInvitations.some(
        invitation => invitation.recipientId === validated.recipientId && 
                      (invitation.status === "pending" || invitation.status === "accepted")
      );
      
      if (alreadySent) {
        return res.status(400).json({ message: "Connection request already sent or users already connected" });
      }
      
      // Add the sender ID and set status and created date
      const invitation = await storage.createInvitation({
        ...validated,
        senderId: req.user.id,
      });
      
      res.status(201).json(invitation);
    } catch (error) {
      console.error("Invitation creation error:", error);
      res.status(400).json({ message: "Invalid invitation data" });
    }
  });
  
  app.post("/api/invitations/:id/respond", async (req, res) => {
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

  // AI Chat route
  app.post("/api/chat", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      if (!req.body.message) {
        return res.status(400).json({ message: "Message is required" });
      }

      const response = await getAIResponse(req.body.message);
      res.json({ message: response });
    } catch (error) {
      console.error("AI chat error:", error);
      res.status(500).json({ 
        message: "An error occurred while processing your message. Please try again later." 
      });
    }
  });

  // Connection Request Routes
  app.get("/api/connection-requests", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const requests = await storage.getConnectionRequestsByUser(req.user.id);
    res.json(requests);
  });
  
  app.post("/api/connection-requests", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const validated = insertConnectionRequestSchema.parse(req.body);
      
      // Check if they're already connected or have a pending request
      const sentRequests = await storage.getConnectionRequestsByUser(req.user.id);
      const alreadySent = sentRequests.some(
        request => 
          (request.senderId === req.user.id && request.recipientId === validated.recipientId) || 
          (request.recipientId === req.user.id && request.senderId === validated.recipientId)
      );
      
      if (alreadySent) {
        return res.status(400).json({ message: "Connection request already exists between these users" });
      }
      
      const request = await storage.createConnectionRequest({
        ...validated,
        senderId: req.user.id,
      });
      
      res.status(201).json(request);
    } catch (error) {
      console.error("Connection request creation error:", error);
      res.status(400).json({ message: "Invalid connection request data" });
    }
  });
  
  app.post("/api/connection-requests/:id/respond", async (req, res) => {
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
  
  // Direct Messaging Routes
  app.get("/api/messages/:userId", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const otherUserId = parseInt(req.params.userId);
    const messages = await storage.getMessagesBetweenUsers(req.user.id, otherUserId);
    res.json(messages);
  });
  
  app.post("/api/messages", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const validated = insertMessageSchema.parse(req.body);
      
      // Ensure the sender is the current user
      const message = await storage.createMessage({
        ...validated,
        senderId: req.user.id,
        read: false,
      });
      
      res.status(201).json(message);
    } catch (error) {
      console.error("Message creation error:", error);
      res.status(400).json({ message: "Invalid message data" });
    }
  });
  
  // Group Chat Routes
  app.get("/api/chat-groups", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const groups = await storage.getChatGroupsByUser(req.user.id);
    res.json(groups);
  });
  
  app.get("/api/chat-groups/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const groupId = parseInt(req.params.id);
    const group = await storage.getChatGroup(groupId);
    
    if (!group) return res.sendStatus(404);
    if (!group.members.includes(req.user.id)) return res.sendStatus(403);
    
    res.json(group);
  });
  
  app.post("/api/chat-groups", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const validated = insertChatGroupSchema.parse(req.body);
      
      // Ensure the creator is included in the members
      const memberIds = [...new Set([...(validated.members || []), req.user.id])];
      
      const group = await storage.createChatGroup({
        ...validated,
        creatorId: req.user.id,
        members: memberIds,
      });
      
      res.status(201).json(group);
    } catch (error) {
      console.error("Chat group creation error:", error);
      res.status(400).json({ message: "Invalid chat group data" });
    }
  });
  
  app.post("/api/chat-groups/:id/members", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const groupId = parseInt(req.params.id);
    const group = await storage.getChatGroup(groupId);
    
    if (!group) return res.sendStatus(404);
    if (group.creatorId !== req.user.id) return res.sendStatus(403);
    
    const userId = parseInt(req.body.userId);
    const updatedGroup = await storage.addUserToChatGroup(groupId, userId);
    
    res.json(updatedGroup);
  });
  
  app.delete("/api/chat-groups/:id/members/:userId", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const groupId = parseInt(req.params.id);
    const group = await storage.getChatGroup(groupId);
    
    if (!group) return res.sendStatus(404);
    
    const userId = parseInt(req.params.userId);
    
    // Allow users to remove themselves or allow the creator to remove anyone
    if (userId !== req.user.id && group.creatorId !== req.user.id) {
      return res.sendStatus(403);
    }
    
    const updatedGroup = await storage.removeUserFromChatGroup(groupId, userId);
    
    res.json(updatedGroup);
  });
  
  app.get("/api/chat-groups/:id/messages", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const groupId = parseInt(req.params.id);
    const group = await storage.getChatGroup(groupId);
    
    if (!group) return res.sendStatus(404);
    if (!group.members.includes(req.user.id)) return res.sendStatus(403);
    
    const messages = await storage.getMessagesByChatGroup(groupId);
    res.json(messages);
  });
  
  app.post("/api/chat-groups/:id/messages", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const groupId = parseInt(req.params.id);
    const group = await storage.getChatGroup(groupId);
    
    if (!group) return res.sendStatus(404);
    if (!group.members.includes(req.user.id)) return res.sendStatus(403);
    
    try {
      const validated = insertGroupMessageSchema.parse(req.body);
      
      const message = await storage.createGroupMessage({
        ...validated,
        senderId: req.user.id,
        groupId: groupId,
        readBy: [req.user.id],
      });
      
      res.status(201).json(message);
    } catch (error) {
      console.error("Group message creation error:", error);
      res.status(400).json({ message: "Invalid group message data" });
    }
  });
  
  // WebSocket setup for real-time messaging
  const httpServer = createServer(app);
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  // Store connected clients with their user IDs
  const clients = new Map();
  
  wss.on('connection', (ws: ExtendedWebSocket, req) => {
    console.log('WebSocket client connected');
    
    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message.toString());
        
        // Handle authentication - client should send userId and a token/session ID
        if (data.type === 'auth') {
          // In a real app, you'd validate the session/token
          // For now, we'll just store the userId
          if (data.userId) {
            clients.set(data.userId, ws);
            ws.userId = data.userId;
            console.log(`User ${data.userId} authenticated on WebSocket`);
          }
          return;
        }
        
        // Handle direct message
        if (data.type === 'direct-message' && ws.userId) {
          if (!data.recipientId || !data.content) {
            ws.send(JSON.stringify({ 
              type: 'error', 
              message: 'Invalid message format' 
            }));
            return;
          }
          
          // Store message in database
          const message = await storage.createMessage({
            senderId: ws.userId,
            recipientId: data.recipientId,
            content: data.content,
            read: false,
          });
          
          // Send message back to sender
          ws.send(JSON.stringify({
            type: 'direct-message',
            message
          }));
          
          // Send to recipient if they are connected
          const recipientWs = clients.get(data.recipientId);
          if (recipientWs && recipientWs.readyState === WebSocket.OPEN) {
            recipientWs.send(JSON.stringify({
              type: 'direct-message',
              message
            }));
          }
        }
        
        // Handle group message
        if (data.type === 'group-message' && ws.userId) {
          if (!data.groupId || !data.content) {
            ws.send(JSON.stringify({ 
              type: 'error', 
              message: 'Invalid message format' 
            }));
            return;
          }
          
          // Check if user is member of the group
          const group = await storage.getChatGroup(data.groupId);
          const members = group?.members || [];
          if (!group || !members.includes(ws.userId)) {
            ws.send(JSON.stringify({ 
              type: 'error', 
              message: 'Not a member of this group' 
            }));
            return;
          }
          
          // Store message in database
          const message = await storage.createGroupMessage({
            senderId: ws.userId,
            groupId: data.groupId,
            content: data.content,
            readBy: [ws.userId],
          });
          
          // Send to all group members who are connected
          for (const memberId of members) {
            const memberWs = clients.get(memberId) as ExtendedWebSocket;
            if (memberWs && memberWs.readyState === WebSocket.OPEN) {
              memberWs.send(JSON.stringify({
                type: 'group-message',
                message
              }));
            }
          }
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
        ws.send(JSON.stringify({ 
          type: 'error', 
          message: 'Invalid message format' 
        }));
      }
    });
    
    ws.on('close', () => {
      if (ws.userId) {
        clients.delete(ws.userId);
        console.log(`User ${ws.userId} disconnected from WebSocket`);
      }
    });
  });
  
  return httpServer;
}