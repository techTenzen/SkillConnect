import { storage } from "../server/storage";

async function completeRebuild() {
  console.log("COMPLETELY REBUILDING THE DATABASE FROM SCRATCH");
  console.log("Deleting all application data...");

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
  
  // Verify that deletion was successful
  const users = await storage.getAllUsers();
  console.log(`User count after rebuild: ${users.length}`);
  
  console.log("DATABASE REBUILD COMPLETE - ALL USERS AND DATA DELETED");
}

completeRebuild().catch(console.error);