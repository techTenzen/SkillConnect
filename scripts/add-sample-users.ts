import { storage } from "../server/storage";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  // For development purposes only, using a simple but more secure password hashing
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function addSampleUsers() {
  console.log("Adding sample users...");

  const users = [
    {
      username: "admin",
      password: "pass123", // Special plaintext password for testing
      bio: "Administrator account for testing purposes.",
      avatar: "https://i.pravatar.cc/150?img=20",
      skills: {
        "Administration": 5,
        "Support": 5,
        "Testing": 5,
      },
      social: {
        github: "admin",
        linkedin: "admin-test"
      },
      connections: []
    },
    {
      username: "johndoe",
      password: await hashPassword("password123"),
      bio: "Computer Science student with a passion for AI and machine learning.",
      avatar: "https://i.pravatar.cc/150?img=1",
      skills: {
        "JavaScript": 4,
        "Python": 5,
        "Machine Learning": 3,
        "Data Analysis": 4
      },
      social: {
        github: "johndoe",
        linkedin: "john-doe-cs"
      },
      connections: []
    },
    {
      username: "janedoe",
      password: await hashPassword("password123"),
      bio: "Frontend developer specializing in React and UI/UX design.",
      avatar: "https://i.pravatar.cc/150?img=5",
      skills: {
        "JavaScript": 5,
        "React": 5,
        "CSS": 4,
        "UI/UX Design": 4
      },
      social: {
        github: "janedoe",
        linkedin: "jane-doe-dev"
      },
      connections: []
    },
    {
      username: "alexsmith",
      password: await hashPassword("password123"),
      bio: "Backend developer with expertise in Node.js and database management.",
      avatar: "https://i.pravatar.cc/150?img=3",
      skills: {
        "Node.js": 5,
        "Express": 4,
        "MongoDB": 4,
        "SQL": 3
      },
      social: {
        github: "alexsmith",
        linkedin: "alex-smith-dev"
      },
      connections: []
    },
    {
      username: "samgreen",
      password: await hashPassword("password123"),
      bio: "Cybersecurity enthusiast with a background in network security.",
      avatar: "https://i.pravatar.cc/150?img=4",
      skills: {
        "Network Security": 5,
        "Ethical Hacking": 4,
        "Python": 3,
        "Cryptography": 4
      },
      social: {
        github: "samgreen",
        linkedin: "sam-green-security"
      },
      connections: []
    },
    {
      username: "taylorjones",
      password: await hashPassword("password123"),
      bio: "Mobile app developer specializing in cross-platform solutions.",
      avatar: "https://i.pravatar.cc/150?img=7",
      skills: {
        "React Native": 5,
        "Flutter": 4,
        "JavaScript": 5,
        "Mobile UI Design": 4
      },
      social: {
        github: "taylorjones",
        linkedin: "taylor-jones-mobile"
      },
      connections: []
    },
    {
      username: "jamielee",
      password: await hashPassword("password123"),
      bio: "Data scientist with a focus on predictive analytics and visualization.",
      avatar: "https://i.pravatar.cc/150?img=9",
      skills: {
        "Python": 5,
        "R": 4,
        "Data Visualization": 5,
        "Machine Learning": 4
      },
      social: {
        github: "jamielee",
        linkedin: "jamie-lee-data"
      },
      connections: []
    },
    {
      username: "rileybrown",
      password: await hashPassword("password123"),
      bio: "Full stack developer with a passion for cloud architecture.",
      avatar: "https://i.pravatar.cc/150?img=10",
      skills: {
        "AWS": 4,
        "Docker": 4,
        "React": 5,
        "Node.js": 5
      },
      social: {
        github: "rileybrown",
        linkedin: "riley-brown-cloud"
      },
      connections: []
    },
    {
      username: "jordanwilson",
      password: await hashPassword("password123"),
      bio: "Game developer with expertise in Unity and 3D modeling.",
      avatar: "https://i.pravatar.cc/150?img=12",
      skills: {
        "Unity": 5,
        "C#": 4,
        "3D Modeling": 3,
        "Game Design": 4
      },
      social: {
        github: "jordanwilson",
        linkedin: "jordan-wilson-games"
      },
      connections: []
    },
    {
      username: "caseykim",
      password: await hashPassword("password123"),
      bio: "DevOps engineer focused on CI/CD pipelines and infrastructure automation.",
      avatar: "https://i.pravatar.cc/150?img=14",
      skills: {
        "Jenkins": 5,
        "Kubernetes": 4,
        "Terraform": 4,
        "Linux": 5
      },
      social: {
        github: "caseykim",
        linkedin: "casey-kim-devops"
      },
      connections: []
    },
    {
      username: "morganpatel",
      password: await hashPassword("password123"),
      bio: "AR/VR developer creating immersive experiences with cutting-edge technology.",
      avatar: "https://i.pravatar.cc/150?img=15",
      skills: {
        "Unity": 4,
        "AR Development": 5,
        "3D Design": 4,
        "C#": 4
      },
      social: {
        github: "morganpatel",
        linkedin: "morgan-patel-xr"
      },
      connections: []
    }
  ];

  for (const userData of users) {
    try {
      await storage.createUser(userData);
      console.log(`Created user: ${userData.username}`);
    } catch (error) {
      console.error(`Error creating user ${userData.username}:`, error);
    }
  }

  console.log("Sample users added successfully!");
}

// Run the function
addSampleUsers().catch(console.error);