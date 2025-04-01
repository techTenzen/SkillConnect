import { storage } from "../server/storage";
import { InsertInvitation } from "../shared/schema";

async function addSampleInvitations() {
  console.log("Adding sample project invitations...");

  // First, get all users and projects
  const users = await storage.getAllUsers();
  const projects = await storage.getAllProjects();
  
  console.log(`Found ${users.length} users and ${projects.length} projects`);
  
  if (users.length < 2 || projects.length < 1) {
    console.error("Need at least 2 users and 1 project to create invitations.");
    return;
  }

  // Create dynamic invitations based on actual projects and their owners
  const invitationData: InsertInvitation[] = [];
  
  // Map through available projects and create invitations
  for (let i = 0; i < Math.min(4, projects.length); i++) {
    const project = projects[i];
    // Find users who are not already members
    const eligibleRecipients = users.filter(user => 
      !project.members.includes(user.id) && user.id !== project.ownerId
    );
    
    if (eligibleRecipients.length > 0) {
      // Pick a random eligible recipient
      const recipient = eligibleRecipients[Math.floor(Math.random() * eligibleRecipients.length)];
      
      const messages = [
        `Your skills would be perfect for our ${project.title} project. Would you like to join?`,
        `We need your expertise for the ${project.title}. Interested in joining?`,
        `Looking for a team member for ${project.title}. Would you be interested?`,
        `Your profile matches what we're looking for in the ${project.title} project. Want to collaborate?`
      ];
      
      invitationData.push({
        projectId: project.id,
        senderId: project.ownerId,
        recipientId: recipient.id,
        message: messages[Math.floor(Math.random() * messages.length)]
      });
    }
  }

  for (const invitation of invitationData) {
    try {
      // Verify the project exists and the sender is the owner
      const project = await storage.getProject(invitation.projectId);
      
      if (!project) {
        console.error(`Project with ID ${invitation.projectId} not found.`);
        continue;
      }
      
      // Skip if the sender is not the owner (this might happen due to random owner assignment)
      if (project.ownerId !== invitation.senderId) {
        console.log(`Skipping invitation: User ${invitation.senderId} is not the owner of project ${invitation.projectId}`);
        continue;
      }
      
      // Check if recipient is already a member
      if (project.members.includes(invitation.recipientId)) {
        console.log(`User ${invitation.recipientId} is already a member of project ${invitation.projectId}`);
        continue;
      }
      
      const createdInvitation = await storage.createInvitation(invitation);
      
      console.log(`Created invitation for user ${invitation.recipientId} to join project "${project.title}"`);
      
      // Accept some invitations randomly
      if (Math.random() > 0.7) {
        await storage.respondToInvitation(createdInvitation.id, "accepted");
        console.log(`User ${invitation.recipientId} accepted invitation to project "${project.title}"`);
      }
    } catch (error) {
      console.error(`Error creating invitation:`, error);
    }
  }

  console.log("Sample project invitations added successfully!");
}

// Run the function
addSampleInvitations().catch(console.error);