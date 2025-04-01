import { storage } from "../server/storage";

// This is a unified script to add all sample data to the platform
async function addAllSampleData() {
  console.log("==== Adding All Sample Data ====");

  // Get current data counts
  const users = await storage.getAllUsers();
  const projects = await storage.getAllProjects();
  const discussions = await storage.getAllDiscussions();
  
  console.log(`Current data:
- Users: ${users.length}
- Projects: ${projects.length}
- Discussions: ${await countDiscussions()}
- Replies: ${await countReplies()}
- Connection Requests: ${await countConnectionRequests()}
- Invitations: ${await countInvitations()}
- Messages: ${await countMessages()}
- Chat Groups: ${await countChatGroups()}`);

  // Execute each script in sequence
  try {
    // Don't add users if we already have some
    if (users.length <= 3) {
      console.log("\n==== Adding Sample Users ====");
      await import("./add-sample-users");
    } else {
      console.log("\n==== Skipping Sample Users (already exist) ====");
    }
    
    // Add more projects
    console.log("\n==== Adding Sample Projects ====");
    await import("./add-sample-projects");
    
    // Add discussions
    console.log("\n==== Adding Sample Discussions ====");
    await import("./add-sample-discussions");
    
    // Add connections
    console.log("\n==== Adding Sample Connections ====");
    await import("./add-sample-connections");
    
    // Add invitations
    console.log("\n==== Adding Sample Invitations ====");
    await import("./add-sample-invitations");
    
    // Add chats
    console.log("\n==== Adding Sample Chats ====");
    await import("./add-sample-chats");
    
    console.log("\n==== All Sample Data Added Successfully! ====");
    
    // Get updated counts
    console.log("\nUpdated data counts:");
    console.log(`- Users: ${(await storage.getAllUsers()).length}
- Projects: ${(await storage.getAllProjects()).length}
- Discussions: ${await countDiscussions()}
- Replies: ${await countReplies()}
- Connection Requests: ${await countConnectionRequests()}
- Invitations: ${await countInvitations()}
- Messages: ${await countMessages()}
- Chat Groups: ${await countChatGroups()}`);
    
  } catch (error) {
    console.error("Error adding sample data:", error);
  }
}

// Helper functions to count various data
async function countDiscussions(): Promise<number> {
  return (await storage.getAllDiscussions()).length;
}

async function countReplies(): Promise<number> {
  const discussions = await storage.getAllDiscussions();
  let replyCount = 0;
  
  for (const discussion of discussions) {
    const replies = await storage.getRepliesByDiscussion(discussion.id);
    replyCount += replies.length;
  }
  
  return replyCount;
}

async function countConnectionRequests(): Promise<number> {
  const users = await storage.getAllUsers();
  let requestCount = 0;
  
  for (const user of users) {
    const requests = await storage.getConnectionRequestsByUser(user.id);
    requestCount += requests.length;
  }
  
  return requestCount;
}

async function countInvitations(): Promise<number> {
  const users = await storage.getAllUsers();
  let invitationCount = 0;
  
  for (const user of users) {
    const invitations = await storage.getInvitationsByUser(user.id);
    invitationCount += invitations.length;
  }
  
  return invitationCount;
}

async function countMessages(): Promise<number> {
  const users = await storage.getAllUsers();
  let messageCount = 0;
  
  for (let i = 0; i < users.length; i++) {
    for (let j = i + 1; j < users.length; j++) {
      const messages = await storage.getMessagesBetweenUsers(users[i].id, users[j].id);
      messageCount += messages.length;
    }
  }
  
  return messageCount;
}

async function countChatGroups(): Promise<number> {
  const users = await storage.getAllUsers();
  let groupCount = 0;
  let groupMessageCount = 0;
  
  for (const user of users) {
    const groups = await storage.getChatGroupsByUser(user.id);
    groupCount += groups.length;
    
    for (const group of groups) {
      const messages = await storage.getMessagesByChatGroup(group.id);
      groupMessageCount += messages.length;
    }
  }
  
  return groupCount;
}

// Run the main function
addAllSampleData().catch(console.error);