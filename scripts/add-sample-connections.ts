import { storage } from "../server/storage";
import { InsertConnectionRequest } from "../shared/schema";

async function addSampleConnectionRequests() {
  console.log("Adding sample connection requests...");

  // First, get all users
  const users = await storage.getAllUsers();
  console.log(`Found ${users.length} users with IDs: ${users.map(u => u.id).join(', ')}`);
  
  if (users.length < 2) {
    console.error("Need at least 2 users to create connection requests.");
    return;
  }

  // Create connection requests between users
  const connectionPairs = [
    { sender: 1, recipient: 2, message: "I'm interested in your web development skills. Let's connect!" },
    { sender: 1, recipient: 3, message: "Looking to collaborate on database projects. Would love to connect." },
    { sender: 2, recipient: 3, message: "Your SQL expertise would be valuable for my project. Let's connect!" },
    { sender: 3, recipient: 1, message: "Interested in your AI projects. Would like to discuss potential collaboration." },
  ];

  for (const pair of connectionPairs) {
    try {
      // Create connection request
      const sender = await storage.getUser(pair.sender);
      const recipient = await storage.getUser(pair.recipient);
      
      if (!sender || !recipient) {
        console.error(`User with ID ${!sender ? pair.sender : pair.recipient} not found.`);
        continue;
      }
      
      // Check if connection already exists
      if (sender.connections.includes(pair.recipient) || recipient.connections.includes(pair.sender)) {
        console.log(`Users ${pair.sender} and ${pair.recipient} are already connected.`);
        continue;
      }
      
      // Check if request already exists by querying connection requests
      const existingRequests = await storage.getConnectionRequestsByUser(pair.recipient);
      const alreadyRequested = existingRequests.some(req => 
        req.senderId === pair.sender && req.recipientId === pair.recipient
      );
      
      if (alreadyRequested) {
        console.log(`Request from ${pair.sender} to ${pair.recipient} already exists.`);
        continue;
      }
      
      const connectionRequest: InsertConnectionRequest = {
        recipientId: pair.recipient,
        message: pair.message,
        senderId: pair.sender
      };
      
      const request = await storage.createConnectionRequest(connectionRequest);
      
      console.log(`Created connection request from ${pair.sender} to ${pair.recipient}`);
      
      // Accept some requests randomly
      if (Math.random() > 0.5) {
        await storage.respondToConnectionRequest(request.id, "accepted");
        console.log(`Accepted connection request from ${pair.sender} to ${pair.recipient}`);
      }
    } catch (error) {
      console.error(`Error creating connection request from ${pair.sender} to ${pair.recipient}:`, error);
    }
  }

  console.log("Sample connection requests added successfully!");
}

// Run the function
addSampleConnectionRequests().catch(console.error);