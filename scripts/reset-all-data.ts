import { storage } from "../server/storage";

async function resetAllData() {
  console.log("Resetting all data in the database...");
  
  // For MemStorage, we need to reset all the arrays directly
  if (storage instanceof Object) {
    // This is an unsafe cast but we're doing it for the clear operation
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
    
    // Reset IDs
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
    
    console.log("All data reset in the in-memory storage");
  }
  
  console.log("Done!");
}

resetAllData().catch(console.error);