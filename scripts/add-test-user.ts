import { storage } from "../server/storage";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function addTestUser() {
  console.log("Adding test user...");
  
  const hashedPassword = await hashPassword("test123");
  
  const user = await storage.createUser({
    username: "testuser",
    password: hashedPassword,
    bio: "A test account for trying out the SkillConnect platform.",
    avatar: "https://ui-avatars.com/api/?name=Test+User&background=6366f1&color=fff",
    skills: {
      "JavaScript": 85,
      "React": 75,
      "TypeScript": 65
    },
    social: {
      github: "https://github.com/test",
      linkedin: "https://linkedin.com/in/testuser"
    },
    connections: []
  });
  
  console.log("Added test user:", user);
  console.log("Login with:");
  console.log("Username: testuser");
  console.log("Password: test123");
}

addTestUser().catch(console.error);