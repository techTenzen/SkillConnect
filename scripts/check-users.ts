import { storage } from "../server/storage";

async function checkUsers() {
  console.log("Checking all users in the database...");
  
  const users = await storage.getAllUsers();
  console.log("Users:", users);
  
  // For MemStorage, we can directly access the array
  if (storage instanceof Object && 'users' in storage) {
    // This is an unsafe cast but we're doing it for diagnostics
    const memStorage = storage as any;
    console.log("Raw users array:", memStorage.users);
  }
  
  console.log("Done!");
}

checkUsers().catch(console.error);