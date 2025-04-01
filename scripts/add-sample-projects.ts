import { storage } from "../server/storage";

async function addSampleProjects() {
  console.log("Adding sample projects...");

  // First, get all existing projects to avoid duplicates
  const existingProjects = await storage.getAllProjects();
  console.log(`Found ${existingProjects.length} existing projects`);
  
  // Then get all users
  const users = await storage.getAllUsers();
  console.log(`Found ${users.length} users with IDs: ${users.map(u => u.id).join(', ')}`);
  
  if (users.length < 1) {
    console.error("No users found to create sample projects. Please add users first.");
    return;
  }
  
  // Clear existing projects if requested
  const shouldClearProjects = false; // Set to true to clear existing projects
  if (shouldClearProjects) {
    // We don't have a direct way to clear projects in our storage interface
    // This would require adding a new method to the storage interface
    console.log("Note: Clearing existing projects is not implemented");
  }

  function getRandomUserId(allUsers: { id: number }[], excludeIds: number[] = []): number {
    const availableUsers = allUsers.filter(user => !excludeIds.includes(user.id));
    if (availableUsers.length === 0) return allUsers[0].id;
    
    const randomIndex = Math.floor(Math.random() * availableUsers.length);
    return availableUsers[randomIndex].id;
  }

  const projects = [
    {
      title: "AI Research Assistant",
      description: "Developing an AI-powered research assistant to help students find relevant academic papers and resources for their projects.",
      ownerId: getRandomUserId(users),
      skills: ["Python", "Machine Learning", "Natural Language Processing"],
      tools: ["TensorFlow", "PyTorch", "Hugging Face", "NLTK"],
      rolesSought: ["Backend Developer", "ML Engineer", "UI Designer"],
      setting: "remote",
      location: null,
      deadline: "2023-12-31",
      membersNeeded: 3,
      status: "open"
    },
    {
      title: "Student Collaboration Platform",
      description: "Building a web platform to connect students with complementary skills for project collaboration and peer learning.",
      ownerId: getRandomUserId(users),
      skills: ["JavaScript", "React", "Node.js", "UI/UX Design"],
      tools: ["Next.js", "MongoDB", "Express", "Figma"],
      rolesSought: ["Frontend Developer", "Backend Developer", "UI/UX Designer"],
      setting: "hybrid",
      location: "Campus Library",
      deadline: "2023-11-15",
      membersNeeded: 4,
      status: "open"
    },
    {
      title: "Campus Navigation App",
      description: "Creating a mobile app to help students navigate campus facilities, find classes, and discover available study spaces in real-time.",
      ownerId: getRandomUserId(users),
      skills: ["React Native", "GPS Integration", "Backend Development"],
      tools: ["Expo", "Firebase", "Google Maps API"],
      rolesSought: ["Mobile Developer", "Backend Developer", "UX Researcher"],
      setting: "on-campus",
      location: "Tech Hub",
      deadline: "2024-01-20",
      membersNeeded: 3,
      status: "open"
    },
    {
      title: "Peer Tutoring Matching System",
      description: "Developing a platform to connect students who need academic help with peers who can provide tutoring in specific subjects.",
      ownerId: getRandomUserId(users),
      skills: ["Web Development", "Database Design", "UI/UX"],
      tools: ["Django", "PostgreSQL", "Bootstrap"],
      rolesSought: ["Python Developer", "Frontend Developer", "Database Specialist"],
      setting: "remote",
      location: null,
      deadline: "2023-12-10",
      membersNeeded: 3,
      status: "open"
    },
    {
      title: "Academic Event Management System",
      description: "Building a system to streamline the organization, registration, and management of academic events, conferences, and workshops.",
      ownerId: getRandomUserId(users),
      skills: ["Full Stack Development", "Database Management", "API Integration"],
      tools: ["Vue.js", "Node.js", "MySQL", "AWS"],
      rolesSought: ["Frontend Developer", "Backend Developer", "DevOps"],
      setting: "hybrid",
      location: "Computer Science Department",
      deadline: "2024-02-15",
      membersNeeded: 4,
      status: "open"
    },
    {
      title: "Sustainability Tracking Dashboard",
      description: "Creating a dashboard to visualize and track campus sustainability metrics, including energy usage, waste management, and carbon footprint.",
      ownerId: getRandomUserId(users),
      skills: ["Data Visualization", "Frontend Development", "Data Analysis"],
      tools: ["D3.js", "React", "Python", "Tableau"],
      rolesSought: ["Data Scientist", "UI Developer", "Sustainability Expert"],
      setting: "remote",
      location: null,
      deadline: "2024-01-10",
      membersNeeded: 3,
      status: "open"
    },
    {
      title: "Research Paper Recommendation Engine",
      description: "Developing an AI-powered recommendation engine to suggest relevant research papers based on a student's academic interests and reading history.",
      ownerId: getRandomUserId(users),
      skills: ["Machine Learning", "Backend Development", "API Development"],
      tools: ["Python", "Scikit-learn", "FastAPI", "Elasticsearch"],
      rolesSought: ["ML Engineer", "Backend Developer", "Data Engineer"],
      setting: "remote",
      location: null,
      deadline: "2024-03-01",
      membersNeeded: 3,
      status: "open"
    },
    {
      title: "Course Schedule Optimizer",
      description: "Building a tool to help students create optimal course schedules based on preferences, requirements, and time constraints.",
      ownerId: getRandomUserId(users),
      skills: ["Algorithm Design", "Frontend Development", "Data Processing"],
      tools: ["JavaScript", "React", "Python", "Constraint Programming"],
      rolesSought: ["Algorithm Specialist", "UI Developer", "Data Engineer"],
      setting: "hybrid",
      location: "Engineering Building",
      deadline: "2023-12-20",
      membersNeeded: 3,
      status: "open"
    },
    {
      title: "Campus AR Experience",
      description: "Creating an augmented reality experience to enhance campus tours and provide interactive information about campus landmarks and facilities.",
      ownerId: getRandomUserId(users),
      skills: ["AR Development", "3D Modeling", "Mobile Development"],
      tools: ["Unity", "ARKit", "ARCore", "Blender"],
      rolesSought: ["AR Developer", "3D Artist", "Content Creator"],
      setting: "on-campus",
      location: "Digital Media Lab",
      deadline: "2024-04-15",
      membersNeeded: 4,
      status: "open"
    },
    {
      title: "Student Mental Health Support App",
      description: "Developing a mobile application to provide resources, peer support, and professional connections for student mental health and wellness.",
      ownerId: getRandomUserId(users),
      skills: ["Mobile Development", "Backend Development", "UX Research"],
      tools: ["Flutter", "Firebase", "Figma"],
      rolesSought: ["Mobile Developer", "Backend Developer", "UI/UX Designer", "Mental Health Expert"],
      setting: "remote",
      location: null,
      deadline: "2024-02-28",
      membersNeeded: 4,
      status: "open"
    }
  ];

  // Create the projects
  for (const projectData of projects) {
    try {
      const { ownerId, ...projectDetails } = projectData;
      const project = await storage.createProject({
        ...projectDetails,
        ownerId,
        members: [ownerId],
        joinRequests: [],
      });
      console.log(`Created project: ${project.title}`);
    } catch (error) {
      console.error(`Error creating project ${projectData.title}:`, error);
    }
  }

  console.log("Sample projects added successfully!");
}

// Run the function
addSampleProjects().catch(console.error);