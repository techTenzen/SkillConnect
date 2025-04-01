import { db } from "../server/db";
import { users } from "../shared/schema";
import { storage } from "../server/storage";

async function clearUsers() {
  console.log("Clearing all users from database...");
  
  // For MemStorage, we need to reset the users array directly
  if (storage instanceof Object && 'users' in storage) {
    // This is an unsafe cast but we're doing it for the clear operation
    const memStorage = storage as any;
    memStorage.users = [];
    console.log("All users cleared from in-memory storage");
  }
  
  console.log("Done!");
}

clearUsers().catch(console.error);