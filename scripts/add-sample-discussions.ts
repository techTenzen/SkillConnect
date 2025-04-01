import { storage } from "../server/storage";

async function addSampleDiscussions() {
  console.log("Adding sample discussions...");

  // First, get all users
  const users = await storage.getAllUsers();
  if (users.length < 3) {
    console.error("Not enough users to create sample discussions. Please add more users first.");
    return;
  }

  function getRandomUserId(allUsers: { id: number }[], excludeIds: number[] = []): number {
    const availableUsers = allUsers.filter(user => !excludeIds.includes(user.id));
    if (availableUsers.length === 0) return allUsers[0].id;
    
    const randomIndex = Math.floor(Math.random() * availableUsers.length);
    return availableUsers[randomIndex].id;
  }

  const discussions = [
    {
      title: "Best Practices for Remote Team Collaboration",
      content: "I'm working on a project with team members across different locations and time zones. What tools and practices do you recommend for effective remote collaboration?",
      category: "teamwork",
      authorId: getRandomUserId(users),
      upvotes: 0,
      upvotedBy: []
    },
    {
      title: "Learning Machine Learning: Where to Start?",
      content: "I'm a second-year CS student interested in getting into ML. What courses, resources, or projects would you recommend for a beginner?",
      category: "learning",
      authorId: getRandomUserId(users),
      upvotes: 0,
      upvotedBy: []
    },
    {
      title: "Internship Opportunities in Amaravati",
      content: "Does anyone know companies in or around Amaravati that offer internships for CS/IT students? Looking for summer opportunities.",
      category: "career",
      authorId: getRandomUserId(users),
      upvotes: 0,
      upvotedBy: []
    },
    {
      title: "React vs Angular for Student Projects",
      content: "I'm planning to build a web application for my final year project. Should I go with React or Angular? What are the pros and cons for a student project?",
      category: "technical",
      authorId: getRandomUserId(users),
      upvotes: 0,
      upvotedBy: []
    },
    {
      title: "Balancing Academics and Project Work",
      content: "How do you manage your time between regular coursework and extracurricular tech projects? Looking for practical time management strategies.",
      category: "lifestyle",
      authorId: getRandomUserId(users),
      upvotes: 0,
      upvotedBy: []
    },
    {
      title: "VIT-AP Hackathon: Team Formation",
      content: "The annual hackathon is coming up! I'm looking for team members with experience in mobile development and UI/UX design. Anyone interested?",
      category: "events",
      authorId: getRandomUserId(users),
      upvotes: 0,
      upvotedBy: []
    },
    {
      title: "Database Design Resources",
      content: "I'm taking a database course and struggling with schema design. Can anyone recommend good books, videos, or websites to learn database modeling?",
      category: "learning",
      authorId: getRandomUserId(users),
      upvotes: 0,
      upvotedBy: []
    },
    {
      title: "Campus Wi-Fi Issues in Engineering Block",
      content: "Has anyone else experienced poor Wi-Fi connectivity in the engineering block lately? Any workarounds or should I report it to IT support?",
      category: "campus",
      authorId: getRandomUserId(users),
      upvotes: 0,
      upvotedBy: []
    },
    {
      title: "Python Libraries for Data Visualization",
      content: "Working on a data analysis project and need to create compelling visualizations. Which Python libraries would you recommend beyond Matplotlib?",
      category: "technical",
      authorId: getRandomUserId(users),
      upvotes: 0,
      upvotedBy: []
    },
    {
      title: "Setting Up a Portfolio Website",
      content: "As a CS student, what should I include in my portfolio website? And what platforms/technologies do you recommend for building it?",
      category: "career",
      authorId: getRandomUserId(users),
      upvotes: 0,
      upvotedBy: []
    }
  ];

  // Create the discussions and add some replies
  for (const discussionData of discussions) {
    try {
      const discussion = await storage.createDiscussion({
        ...discussionData,
        createdAt: new Date().toISOString()
      });

      console.log(`Created discussion: ${discussion.title}`);

      // Add 1-3 replies to each discussion
      const numReplies = Math.floor(Math.random() * 3) + 1;
      for (let i = 0; i < numReplies; i++) {
        const replyAuthorId = getRandomUserId(users, [discussionData.authorId]);
        
        const replyContent = [
          "Thanks for sharing this. I've been looking for information on this topic.",
          "I had a similar experience and found that...",
          "Have you tried looking into alternative approaches?",
          "This is really helpful! I'm going to try implementing some of these ideas.",
          "Great question! I've been wondering about this too.",
          "Based on my experience, I would recommend...",
          "Could you provide more details about your specific use case?",
          "I disagree with some points here. In my view...",
          "I've compiled some resources that might help with this.",
          "Let's organize a study group to explore this further!"
        ][Math.floor(Math.random() * 10)];
        
        const reply = await storage.createReply({
          discussionId: discussion.id,
          parentReplyId: null,
          authorId: replyAuthorId,
          content: replyContent,
          upvotes: 0,
          upvotedBy: [],
          createdAt: new Date().toISOString()
        });
        
        // Occasionally add a nested reply
        if (Math.random() > 0.7) {
          const nestedReplyAuthorId = getRandomUserId(users, [replyAuthorId]);
          
          const nestedReplyContent = [
            "Good point! I agree with your approach.",
            "Have you considered the implications of this?",
            "Thanks for the detailed response!",
            "I've had mixed results with that method.",
            "Could you elaborate on that point?"
          ][Math.floor(Math.random() * 5)];
          
          await storage.createReply({
            discussionId: discussion.id,
            parentReplyId: reply.id,
            authorId: nestedReplyAuthorId,
            content: nestedReplyContent,
            upvotes: 0,
            upvotedBy: [],
            createdAt: new Date().toISOString()
          });
        }
      }
    } catch (error) {
      console.error(`Error creating discussion ${discussionData.title}:`, error);
    }
  }

  console.log("Sample discussions added successfully!");
}

// Run the function
addSampleDiscussions().catch(console.error);