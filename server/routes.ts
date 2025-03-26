import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { insertProjectSchema, insertDiscussionSchema, insertReplySchema, insertInvitationSchema } from "@shared/schema";
import { getAIResponse, getSkillSuggestions } from "./openai";

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

  const httpServer = createServer(app);
  return httpServer;
}