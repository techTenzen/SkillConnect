import { db } from "../server/db";
import { projects, users } from "../shared/schema";
import { sql } from "drizzle-orm";

async function addSingleProject() {
  console.log("Adding a single test project...");

  try {
    // First get all user IDs to use as owner IDs
    const allUsers = await db.select({ id: users.id }).from(users);
    if (allUsers.length === 0) {
      console.error("No users found. Please run add-sample-users.ts first.");
      process.exit(1);
    }
    
    console.log(`Found ${allUsers.length} users to use as project owners`);
    console.log("User IDs:", allUsers.map(user => user.id));

    // Select the first user ID as the owner
    const ownerId = allUsers[0].id;
    console.log("Using owner ID:", ownerId);

    // Create a simple project object
    const project = {
      title: "Test Project",
      description: "This is a test project to verify insertion works correctly.",
      skills: ["JavaScript", "React"],
      tools: ["Node.js", "Express"],
      roles_sought: ["Developer"],
      setting: "remote",
      location: null,
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      members_needed: 2,
      status: "active",
      owner_id: ownerId,
      members: [ownerId],
      join_requests: []
    };

    console.log("Project object:", project);

    // Insert the project directly using SQL to bypass any type issues
    await db.execute(
      sql`INSERT INTO projects 
          (title, description, skills, tools, roles_sought, setting, location, deadline, members_needed, status, owner_id, members, join_requests)
          VALUES 
          (${project.title}, ${project.description}, ${JSON.stringify(project.skills)}, ${JSON.stringify(project.tools)}, 
           ${JSON.stringify(project.roles_sought)}, ${project.setting}, ${project.location}, ${project.deadline}, 
           ${project.members_needed}, ${project.status}, ${project.owner_id}, ${JSON.stringify(project.members)}, ${JSON.stringify(project.join_requests)})
         `
    );

    console.log("Project added successfully!");
  } catch (error) {
    console.error("Error adding project:", error);
  }

  process.exit(0);
}

addSingleProject();