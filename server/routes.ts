import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { insertProjectSchema, insertDiscussionSchema } from "@shared/schema";
import { getAIResponse } from "./openai";

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

    const validated = insertProjectSchema.parse(req.body);
    const project = await storage.createProject({
      ...validated,
      ownerId: req.user.id,
      members: [req.user.id],
      status: "open",
    });

    res.status(201).json(project);
  });

  // Discussion routes
  app.get("/api/discussions", async (req, res) => {
    const discussions = await storage.getAllDiscussions();
    res.json(discussions);
  });

  app.post("/api/discussions", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const validated = insertDiscussionSchema.parse(req.body);
    const discussion = await storage.createDiscussion({
      ...validated,
      authorId: req.user.id,
      upvotes: 0,
      createdAt: new Date().toISOString(),
    });

    res.status(201).json(discussion);
  });

  // AI Chat route
  app.post("/api/chat", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const message = await getAIResponse(req.body.message);
      res.json({ message });
    } catch (error) {
      res.status(500).json({ message: "Failed to get AI response" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}