import { storage, resetStorage } from "../server/storage";

async function resetAllData() {
  console.log("Resetting all data in the database...");
  
  // Use the resetStorage function to completely reset the storage
  resetStorage(storage);
  
  // Verify that users are actually deleted
  const users = await storage.getAllUsers();
  console.log(`After reset: ${users.length} users remaining`);
  
  console.log("Done!");
}

resetAllData().catch(console.error);