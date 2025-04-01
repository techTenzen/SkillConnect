import { storage } from "../server/storage";

async function addSampleChatsAndMessages() {
  console.log("Adding sample chat groups and messages...");

  // First, get all users
  const users = await storage.getAllUsers();
  console.log(`Found ${users.length} users with IDs: ${users.map(u => u.id).join(', ')}`);
  
  if (users.length < 2) {
    console.error("Need at least 2 users to create chats and messages.");
    return;
  }

  // Create direct messages between users who are connected
  console.log("Creating direct messages...");
  for (const user1 of users) {
    for (const connectedUserId of user1.connections) {
      // Add a few messages between these users
      try {
        const messageCount = Math.floor(Math.random() * 5) + 1; // 1 to 5 messages
        
        for (let i = 0; i < messageCount; i++) {
          const isUser1Sending = Math.random() > 0.5;
          const senderId = isUser1Sending ? user1.id : connectedUserId;
          const recipientId = isUser1Sending ? connectedUserId : user1.id;
          
          const messageContent = [
            "Hi there! How's your project going?",
            "I found an interesting article about the topic we discussed.",
            "Are you available for a quick meeting tomorrow?",
            "Thanks for sharing those resources, they were really helpful!",
            "Did you see the announcement about the upcoming hackathon?",
            "I'm struggling with this problem. Do you have any suggestions?",
            "Just wanted to check in and see how you're doing.",
            "Can you review my code when you have a chance?",
            "The deadline for the project submission is next Friday.",
            "I'm working on a new feature that you might be interested in."
          ][Math.floor(Math.random() * 10)];
          
          await storage.createMessage({
            senderId,
            recipientId,
            content: messageContent,
            createdAt: new Date(Date.now() - Math.random() * 1000 * 60 * 60 * 24 * 7).toISOString(), // Random time in the last week
            read: Math.random() > 0.3 // 70% chance of being read
          });
        }
        
        console.log(`Created ${messageCount} messages between users ${user1.id} and ${connectedUserId}`);
      } catch (error) {
        console.error(`Error creating messages between users ${user1.id} and ${connectedUserId}:`, error);
      }
    }
  }

  // Create chat groups
  console.log("Creating chat groups...");
  const chatGroups = [
    {
      name: "Web Development Team",
      creatorId: 1,
      members: [1, 2, 3]
    },
    {
      name: "Data Science Study Group",
      creatorId: 2,
      members: [1, 2]
    },
    {
      name: "AI Research Collaboration",
      creatorId: 3,
      members: [1, 3]
    }
  ];

  for (const groupData of chatGroups) {
    try {
      const group = await storage.createChatGroup({
        ...groupData,
        createdAt: new Date().toISOString()
      });
      
      console.log(`Created chat group: ${group.name}`);
      
      // Add sample messages to the group
      const messageCount = Math.floor(Math.random() * 10) + 3; // 3 to 12 messages
      
      for (let i = 0; i < messageCount; i++) {
        const senderId = groupData.members[Math.floor(Math.random() * groupData.members.length)];
        
        const groupMessageContent = [
          "Welcome everyone to the group!",
          "When is our next meeting scheduled?",
          "I've shared the project files in our shared drive.",
          "Has anyone started working on the front-end yet?",
          "What framework should we use for this project?",
          "I found this tutorial that might be helpful for us.",
          "Don't forget the submission deadline next week!",
          "Can someone help me with this error I'm getting?",
          "Great progress everyone! Keep it up.",
          "Let's schedule a call to discuss the next steps.",
          "Should we add more features or focus on polishing what we have?",
          "I've pushed my changes to the repository.",
          "What do you all think about using TypeScript for this?",
          "The client loved our proposal! They want to move forward.",
          "Who's responsible for writing the documentation?"
        ][Math.floor(Math.random() * 15)];
        
        await storage.createGroupMessage({
          groupId: group.id,
          senderId,
          content: groupMessageContent,
          createdAt: new Date(Date.now() - Math.random() * 1000 * 60 * 60 * 24 * 7).toISOString(), // Random time in the last week
          readBy: groupData.members.filter(() => Math.random() > 0.3) // Random read status
        });
      }
      
      console.log(`Added ${messageCount} messages to chat group: ${group.name}`);
    } catch (error) {
      console.error(`Error creating chat group ${groupData.name}:`, error);
    }
  }

  console.log("Sample chat groups and messages added successfully!");
}

// Run the function
addSampleChatsAndMessages().catch(console.error);