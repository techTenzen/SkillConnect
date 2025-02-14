import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { insertProjectSchema, insertDiscussionSchema } from "@shared/schema";
import { getAIResponse } from "./ai";

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

  app.post("/api/projects", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const validated = insertProjectSchema.parse(req.body);
      const project = await storage.createProject({
        ...validated,
        ownerId: req.user.id,
        members: [req.user.id],
        status: "open",
      });

      res.status(201).json(project);
    } catch (error) {
      console.error("Project creation error:", error);
      res.status(400).json({ message: "Invalid project data" });
    }
  });

  // Discussion routes
  app.get("/api/discussions", async (req, res) => {
    const discussions = await storage.getAllDiscussions();
    res.json(discussions);
  });

  app.post("/api/discussions", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const validated = insertDiscussionSchema.parse(req.body);
      const discussion = await storage.createDiscussion({
        ...validated,
        authorId: req.user.id,
        upvotes: 0,
        createdAt: new Date().toISOString(),
      });

      res.status(201).json(discussion);
    } catch (error) {
      console.error("Discussion creation error:", error);
      res.status(400).json({ message: "Invalid discussion data" });
    }
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