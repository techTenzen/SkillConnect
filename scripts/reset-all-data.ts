import { storage } from "../server/storage";

async function resetAllData() {
  console.log("FULL DATABASE RESET IN PROGRESS...");
  
  // Get direct access to the memory storage
  const memStorage = storage as any;
  
  // Reset all data collections
  memStorage.users = [];
  memStorage.projects = [];
  memStorage.discussions = [];
  memStorage.replies = [];
  memStorage.invitations = [];
  memStorage.connectionRequests = [];
  memStorage.messages = [];
  memStorage.chatGroups = [];
  memStorage.groupMessages = [];
  
  // Reset IDs back to 1
  memStorage.nextId = {
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
  
  // Verify that all data is deleted
  const users = await storage.getAllUsers();
  console.log(`Users remaining: ${users.length}`);
  const projects = await storage.getAllProjects();
  console.log(`Projects remaining: ${projects.length}`);
  const discussions = await storage.getAllDiscussions();
  console.log(`Discussions remaining: ${discussions.length}`);
  
  console.log("DATABASE RESET COMPLETE!");
}

resetAllData().catch(console.error);