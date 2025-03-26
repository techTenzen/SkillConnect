import { db } from "../server/db";
import { projects, users, discussions, replies, invitations } from "../shared/schema";

async function checkSchema() {
  console.log("Checking database schema...");

  try {
    // Check users table
    const userColumns = await db.execute(
      "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'users';"
    );
    console.log("Users table columns:", userColumns.rows);
    
    // Check projects table
    const projectColumns = await db.execute(
      "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'projects';"
    );
    console.log("Projects table columns:", projectColumns.rows);
    
    // Check discussions table
    const discussionColumns = await db.execute(
      "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'discussions';"
    );
    console.log("Discussions table columns:", discussionColumns.rows);
    
    // Check replies table
    const replyColumns = await db.execute(
      "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'replies';"
    );
    console.log("Replies table columns:", replyColumns.rows);
    
    // Check invitations table
    const invitationColumns = await db.execute(
      "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'invitations';"
    );
    console.log("Invitations table columns:", invitationColumns.rows);
    
  } catch (error) {
    console.error("Error checking schema:", error);
  }

  process.exit(0);
}

checkSchema();