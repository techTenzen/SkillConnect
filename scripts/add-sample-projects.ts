import { db } from "../server/db";
import { projects, users } from "../shared/schema";
import { sql } from "drizzle-orm";

async function addSampleProjects() {
  console.log("Adding sample projects...");

  try {
    // First get all user IDs to use as owner IDs
    const allUsers = await db.select({ id: users.id }).from(users);
    if (allUsers.length === 0) {
      console.error("No users found. Please run add-sample-users.ts first.");
      process.exit(1);
    }
    
    console.log(`Found ${allUsers.length} users to use as project owners`);
    console.log("User IDs:", allUsers.map(user => user.id));

    const sampleProjects = [
      {
        title: "AI-Powered Education Platform",
        description: "Developing an intelligent tutoring system that adapts to student learning styles and provides personalized education through natural language processing and adaptive learning algorithms.",
        skills: ["JavaScript", "React", "Node.js", "Machine Learning", "NLP"],
        tools: ["TensorFlow", "MongoDB", "Express", "React", "Node.js"],
        roles_sought: ["Frontend Developer", "AI Specialist", "Educational Content Creator"],
        setting: "hybrid",
        location: "Engineering Building",
        deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days from now
        members_needed: 4,
        status: "active",
        owner_id: getRandomUserId(allUsers),
        members: [], // Will be updated later
        join_requests: []
      },
      {
        title: "Blockchain-Based Academic Credentials",
        description: "Creating a secure, tamper-proof system for academic credentials using blockchain technology to verify degrees, certificates, and course completions for educational institutions.",
        skills: ["Solidity", "JavaScript", "Blockchain", "Smart Contracts", "Web3.js"],
        tools: ["Ethereum", "Truffle", "Web3.js", "Node.js", "React"],
        roles_sought: ["Blockchain Developer", "UI Designer", "Security Expert"],
        setting: "remote",
        location: null,
        deadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), // 45 days from now
        members_needed: 3,
        status: "active",
        owner_id: getRandomUserId(allUsers),
        members: [],
        join_requests: []
      },
      {
        title: "AR Campus Navigation App",
        description: "Building an augmented reality application that helps new students navigate campus, find classrooms, and discover important facilities through an intuitive AR interface.",
        skills: ["Unity", "AR Development", "Mobile Development", "UI/UX Design", "3D Modeling"],
        tools: ["Unity", "ARKit", "ARCore", "Blender", "Figma"],
        roles_sought: ["AR Developer", "3D Modeler", "UI Designer"],
        setting: "in-person",
        location: "Design Lab",
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        members_needed: 4,
        status: "active",
        owner_id: getRandomUserId(allUsers),
        members: [],
        join_requests: []
      },
      {
        title: "Smart Campus IoT System",
        description: "Developing a network of IoT devices to monitor and optimize energy usage, classroom occupancy, and environmental conditions across campus buildings.",
        skills: ["IoT", "Embedded Systems", "Python", "Data Analysis", "Cloud Computing"],
        tools: ["Raspberry Pi", "Arduino", "AWS IoT", "TensorFlow", "Node-RED"],
        roles_sought: ["IoT Engineer", "Backend Developer", "Data Scientist"],
        setting: "hybrid",
        location: "Engineering Lab",
        deadline: new Date(Date.now() + 75 * 24 * 60 * 60 * 1000), // 75 days from now
        members_needed: 5,
        status: "active",
        owner_id: getRandomUserId(allUsers),
        members: [],
        join_requests: []
      },
      {
        title: "Virtual Science Lab Simulator",
        description: "Creating a virtual reality environment for conducting science experiments that are too dangerous, expensive, or impractical for physical labs, accessible to students remotely.",
        skills: ["Unity", "VR Development", "3D Modeling", "Physics Simulation", "C#"],
        tools: ["Unity", "Oculus SDK", "Blender", "C#", "WebGL"],
        roles_sought: ["VR Developer", "3D Artist", "Physics Programmer"],
        setting: "remote",
        location: null,
        deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days from now
        members_needed: 4,
        status: "active",
        owner_id: getRandomUserId(allUsers),
        members: [],
        join_requests: []
      },
      {
        title: "Peer-to-Peer Tutoring Platform",
        description: "Building a web application that connects students who excel in certain subjects with peers who need help, including scheduling, virtual classrooms, and resource sharing.",
        skills: ["JavaScript", "React", "Node.js", "WebRTC", "UI/UX Design"],
        tools: ["React", "Node.js", "Socket.io", "MongoDB", "Figma"],
        roles_sought: ["Frontend Developer", "UX Designer", "Backend Developer"],
        setting: "hybrid",
        location: "Computer Science Building",
        deadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), // 45 days from now
        members_needed: 3,
        status: "active",
        owner_id: getRandomUserId(allUsers),
        members: [],
        join_requests: []
      },
      {
        title: "Mental Health Support AI",
        description: "Developing an AI chatbot specifically designed to provide mental health resources, stress management techniques, and wellness support for university students.",
        skills: ["Python", "NLP", "Machine Learning", "Psychology", "API Integration"],
        tools: ["TensorFlow", "Flask", "MongoDB", "React", "Node.js"],
        roles_sought: ["AI Developer", "Psychology Student", "Backend Developer"],
        setting: "remote",
        location: null,
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        members_needed: 3,
        status: "active",
        owner_id: getRandomUserId(allUsers),
        members: [],
        join_requests: []
      },
      {
        title: "Campus Events Mobile App",
        description: "Creating a comprehensive mobile application for tracking campus events, club activities, and academic deadlines with personalized recommendations and calendar integration.",
        skills: ["React Native", "JavaScript", "UI/UX Design", "Firebase", "API Development"],
        tools: ["React Native", "Firebase", "Figma", "Node.js", "Express"],
        roles_sought: ["Mobile Developer", "UI Designer", "Backend Developer"],
        setting: "hybrid",
        location: "Student Center",
        deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days from now
        members_needed: 4,
        status: "active",
        owner_id: getRandomUserId(allUsers),
        members: [],
        join_requests: []
      },
      {
        title: "Sustainable Campus Initiatives Tracker",
        description: "Building a platform to track and visualize environmental sustainability initiatives on campus, including energy usage, waste reduction, and carbon footprint calculations.",
        skills: ["Data Visualization", "JavaScript", "React", "Python", "Sustainability"],
        tools: ["D3.js", "React", "Node.js", "MongoDB", "Python"],
        roles_sought: ["Frontend Developer", "Data Visualization Specialist", "Sustainability Researcher"],
        setting: "in-person",
        location: "Environmental Science Building",
        deadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), // 45 days from now
        members_needed: 3,
        status: "active",
        owner_id: getRandomUserId(allUsers),
        members: [],
        join_requests: []
      },
      {
        title: "Collaborative Research Paper Generator",
        description: "Developing a tool that helps research teams collaborate on academic papers with integrated citation management, version control, and AI-assisted writing suggestions.",
        skills: ["NLP", "Machine Learning", "JavaScript", "UI/UX Design", "Research Methods"],
        tools: ["TensorFlow", "React", "Node.js", "MongoDB", "Git"],
        roles_sought: ["AI Developer", "Frontend Developer", "UX Researcher"],
        setting: "remote",
        location: null,
        deadline: new Date(Date.now() + 75 * 24 * 60 * 60 * 1000), // 75 days from now
        members_needed: 3,
        status: "active",
        owner_id: getRandomUserId(allUsers),
        members: [],
        join_requests: []
      }
    ];

    // Add members to each project (2-3 random members including the owner)
    for (const project of sampleProjects) {
      project.members = [project.owner_id];
      
      // Add 1-2 more random members
      const additionalMemberCount = Math.floor(Math.random() * 2) + 1;
      for (let i = 0; i < additionalMemberCount; i++) {
        const randomUserId = getRandomUserId(allUsers, [...project.members]);
        if (randomUserId) {
          project.members.push(randomUserId);
        }
      }
    }

    // Insert projects
    for (const project of sampleProjects) {
      // Check if project already exists
      const existingProjects = await db
        .select()
        .from(projects)
        .where(sql`${projects.title} = ${project.title}`);
      
      if (existingProjects.length === 0) {
        // Use SQL directly to insert the project
        await db.execute(
          sql`INSERT INTO projects 
              (title, description, skills, tools, roles_sought, setting, location, deadline, members_needed, status, owner_id, members, join_requests)
              VALUES 
              (${project.title}, ${project.description}, ${JSON.stringify(project.skills)}, ${JSON.stringify(project.tools)}, 
               ${JSON.stringify(project.roles_sought)}, ${project.setting}, ${project.location}, ${project.deadline.toISOString()}, 
               ${project.members_needed}, ${project.status}, ${project.owner_id}, ${JSON.stringify(project.members)}, ${JSON.stringify(project.join_requests)})
             `
        );
        console.log(`Added project: ${project.title}`);
      } else {
        console.log(`Project "${project.title}" already exists. Skipping.`);
      }
    }

    console.log("Sample projects added successfully!");
  } catch (error) {
    console.error("Error adding sample projects:", error);
  }

  process.exit(0);
}

// Helper function to get a random user ID from the allUsers array
function getRandomUserId(allUsers: { id: number }[], excludeIds: number[] = []): number {
  const availableUsers = allUsers.filter(user => !excludeIds.includes(user.id));
  if (availableUsers.length === 0) {
    // Default to the first user if no available users
    return allUsers[0].id;
  }
  
  const randomIndex = Math.floor(Math.random() * availableUsers.length);
  return availableUsers[randomIndex].id;
}

addSampleProjects();