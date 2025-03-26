import { db } from "../server/db";
import { users } from "../shared/schema";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";
import { sql } from "drizzle-orm";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function addSampleUsers() {
  console.log("Adding sample users...");

  const sampleUsers = [
    {
      username: "TechDev123",
      password: "password123", // Will be hashed
      bio: "Computer Science student passionate about web development and machine learning.",
      avatar: "https://i.pravatar.cc/150?img=1",
      skills: {
        "JavaScript": 85,
        "Python": 75,
        "Machine Learning": 60,
        "React": 80,
        "Node.js": 70
      },
      social: {
        github: "https://github.com/techdev123",
        linkedin: "https://linkedin.com/in/techdev123",
        instagram: "https://instagram.com/techdev123"
      }
    },
    {
      username: "AIResearcher",
      password: "password123",
      bio: "PhD candidate focused on artificial intelligence and natural language processing.",
      avatar: "https://i.pravatar.cc/150?img=2",
      skills: {
        "Python": 90,
        "NLP": 95,
        "Deep Learning": 85,
        "TensorFlow": 80,
        "Research": 90
      },
      social: {
        github: "https://github.com/airesearcher",
        linkedin: "https://linkedin.com/in/airesearcher"
      }
    },
    {
      username: "FullStackDev",
      password: "password123",
      bio: "Full stack developer with 3 years of experience building web applications.",
      avatar: "https://i.pravatar.cc/150?img=3",
      skills: {
        "React": 90,
        "Node.js": 85,
        "TypeScript": 80,
        "MongoDB": 75,
        "AWS": 70
      },
      social: {
        github: "https://github.com/fullstackdev",
        linkedin: "https://linkedin.com/in/fullstackdev",
        instagram: "https://instagram.com/fullstackdev"
      }
    },
    {
      username: "UIDesigner",
      password: "password123",
      bio: "UI/UX designer with a passion for creating beautiful and intuitive interfaces.",
      avatar: "https://i.pravatar.cc/150?img=4",
      skills: {
        "Figma": 95,
        "Adobe XD": 85,
        "UI Design": 90,
        "UX Research": 75,
        "HTML/CSS": 70
      },
      social: {
        github: "https://github.com/uidesigner",
        linkedin: "https://linkedin.com/in/uidesigner",
        instagram: "https://instagram.com/uidesigner"
      }
    },
    {
      username: "DataScientist",
      password: "password123",
      bio: "Data scientist focused on big data analytics and statistical modeling.",
      avatar: "https://i.pravatar.cc/150?img=5",
      skills: {
        "Python": 90,
        "R": 85,
        "SQL": 80,
        "Data Visualization": 85,
        "Machine Learning": 75
      },
      social: {
        github: "https://github.com/datascientist",
        linkedin: "https://linkedin.com/in/datascientist"
      }
    },
    {
      username: "CloudArchitect",
      password: "password123",
      bio: "Cloud architect specializing in AWS and GCP infrastructure design.",
      avatar: "https://i.pravatar.cc/150?img=6",
      skills: {
        "AWS": 95,
        "GCP": 85,
        "Terraform": 80,
        "Kubernetes": 75,
        "Docker": 90
      },
      social: {
        github: "https://github.com/cloudarchitect",
        linkedin: "https://linkedin.com/in/cloudarchitect"
      }
    },
    {
      username: "MobileDev",
      password: "password123",
      bio: "Mobile app developer with expertise in React Native and Flutter.",
      avatar: "https://i.pravatar.cc/150?img=7",
      skills: {
        "React Native": 90,
        "Flutter": 85,
        "JavaScript": 80,
        "Dart": 75,
        "Mobile UI": 85
      },
      social: {
        github: "https://github.com/mobiledev",
        linkedin: "https://linkedin.com/in/mobiledev",
        instagram: "https://instagram.com/mobiledev"
      }
    },
    {
      username: "SecurityExpert",
      password: "password123",
      bio: "Cybersecurity expert with a focus on web application security.",
      avatar: "https://i.pravatar.cc/150?img=8",
      skills: {
        "Penetration Testing": 90,
        "Security Auditing": 85,
        "Network Security": 80,
        "Cryptography": 75,
        "Ethical Hacking": 90
      },
      social: {
        github: "https://github.com/securityexpert",
        linkedin: "https://linkedin.com/in/securityexpert"
      }
    },
    {
      username: "GameDeveloper",
      password: "password123",
      bio: "Game developer with experience in Unity and Unreal Engine.",
      avatar: "https://i.pravatar.cc/150?img=9",
      skills: {
        "Unity": 90,
        "C#": 85,
        "Unreal Engine": 75,
        "3D Modeling": 70,
        "Game Design": 80
      },
      social: {
        github: "https://github.com/gamedeveloper",
        linkedin: "https://linkedin.com/in/gamedeveloper",
        instagram: "https://instagram.com/gamedeveloper"
      }
    },
    {
      username: "BlockchainDev",
      password: "password123",
      bio: "Blockchain developer specializing in smart contracts and decentralized applications.",
      avatar: "https://i.pravatar.cc/150?img=10",
      skills: {
        "Solidity": 90,
        "Ethereum": 85,
        "Web3.js": 80,
        "Smart Contracts": 85,
        "Blockchain Architecture": 75
      },
      social: {
        github: "https://github.com/blockchaindev",
        linkedin: "https://linkedin.com/in/blockchaindev"
      }
    }
  ];

  for (const user of sampleUsers) {
    try {
      // Check if user already exists
      const existingUsers = await db
        .select()
        .from(users)
        .where(sql`${users.username} = ${user.username}`);
      
      if (existingUsers.length === 0) {
        // Hash the password
        const hashedPassword = await hashPassword(user.password);
        
        // Insert the user
        await db.insert(users).values({
          ...user,
          password: hashedPassword
        });
        
        console.log(`Added user: ${user.username}`);
      } else {
        console.log(`User ${user.username} already exists. Skipping.`);
      }
    } catch (error) {
      console.error(`Error adding user ${user.username}:`, error);
    }
  }

  console.log("Sample users added successfully!");
  process.exit(0);
}

addSampleUsers();