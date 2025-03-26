import { db } from "../server/db";
import { discussions, replies, users } from "../shared/schema";
import { sql } from "drizzle-orm";

async function addSampleDiscussions() {
  console.log("Adding sample discussions and replies...");

  try {
    // First get all user IDs
    const allUsers = await db.select({ id: users.id }).from(users);
    if (allUsers.length === 0) {
      console.error("No users found. Please run add-sample-users.ts first.");
      process.exit(1);
    }

    const sampleDiscussions = [
      {
        title: "Best resources to learn React.js in 2023?",
        content: "Hi everyone! I'm looking to improve my React skills this semester. What are the best resources you've found for learning React in depth? Any courses, books, or YouTube channels you'd recommend? Thanks in advance!",
        author_id: getRandomUserId(allUsers),
        category: "Web Development",
        upvoted_by: [],
        created_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) // 14 days ago
      },
      {
        title: "Finding teammates for AI hackathon next month",
        content: "I'm planning to participate in the upcoming AI hackathon next month and I'm looking for teammates. I have experience with TensorFlow and NLP but would love to team up with someone who has strong frontend skills and possibly someone with experience in computer vision. Anyone interested?",
        author_id: getRandomUserId(allUsers),
        category: "AI & Machine Learning",
        upvoted_by: [],
        created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000) // 10 days ago
      },
      {
        title: "How to balance academics with side projects?",
        content: "I'm finding it challenging to balance my coursework with all the side projects I want to work on. Any advice from those who have successfully managed both? How do you prioritize your time and still make progress on personal projects?",
        author_id: getRandomUserId(allUsers),
        category: "Student Life",
        upvoted_by: [],
        created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 7 days ago
      },
      {
        title: "Recommended tools for UI/UX design beginners?",
        content: "I'm a computer science student looking to expand my skills into UI/UX design. What tools would you recommend for a beginner? I've heard of Figma and Adobe XD, but would love to hear your experiences and recommendations for learning resources as well.",
        author_id: getRandomUserId(allUsers),
        category: "Design",
        upvoted_by: [],
        created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) // 5 days ago
      },
      {
        title: "Internship preparation advice needed",
        content: "I'm a sophomore and starting to look for internships for next summer. What should I be focusing on to make my application stand out? Also, how early should I start applying? Any advice on portfolio projects that would impress tech companies?",
        author_id: getRandomUserId(allUsers),
        category: "Career",
        upvoted_by: [],
        created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) // 3 days ago
      },
      {
        title: "Best practices for database design in web applications",
        content: "I'm working on a web application for my senior project and need advice on database design. I'm trying to decide between SQL and NoSQL for my particular use case. The app will need to store user profiles, project details, and messages. What's your approach to database selection and design?",
        author_id: getRandomUserId(allUsers),
        category: "Databases",
        upvoted_by: [],
        created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
      },
      {
        title: "Thoughts on the new CS curriculum changes?",
        content: "Has anyone looked at the proposed changes to the CS curriculum for next year? I noticed they're adding more AI and machine learning courses but reducing the systems programming requirements. What do you all think about these changes?",
        author_id: getRandomUserId(allUsers),
        category: "Education",
        upvoted_by: [],
        created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) // 1 day ago
      },
      {
        title: "Remote collaboration tools for programming teams",
        content: "My project team is completely remote this semester, and we're looking for the best tools to collaborate effectively. We need version control, task tracking, and good communication features. What tools have worked well for your remote teams?",
        author_id: getRandomUserId(allUsers),
        category: "Collaboration",
        upvoted_by: [],
        created_at: new Date(Date.now() - 8 * 60 * 60 * 1000) // 8 hours ago
      }
    ];

    // Add random upvotes to each discussion
    for (const discussion of sampleDiscussions) {
      const upvoteCount = Math.floor(Math.random() * 15) + 1; // 1-15 upvotes
      for (let i = 0; i < upvoteCount; i++) {
        const randomUserId = getRandomUserId(allUsers, discussion.upvoted_by);
        if (randomUserId) {
          discussion.upvoted_by.push(randomUserId);
        }
      }
    }

    // Insert discussions
    const createdDiscussionIds = [];
    for (const discussion of sampleDiscussions) {
      const existingDiscussions = await db
        .select()
        .from(discussions)
        .where(sql`${discussions.title} = ${discussion.title}`);
      
      if (existingDiscussions.length === 0) {
        // Use SQL to insert directly
        const result = await db.execute(
          sql`INSERT INTO discussions 
              (title, content, author_id, category, upvoted_by, created_at)
              VALUES 
              (${discussion.title}, ${discussion.content}, ${discussion.author_id}, ${discussion.category}, 
               ${JSON.stringify(discussion.upvoted_by)}, ${discussion.created_at.toISOString()})
              RETURNING id`
        );
        
        const newId = result.rows[0].id;
        console.log(`Added discussion: ${discussion.title} with ID ${newId}`);
        createdDiscussionIds.push({ id: newId, title: discussion.title });
      } else {
        console.log(`Discussion "${discussion.title}" already exists. Skipping.`);
        createdDiscussionIds.push({ id: existingDiscussions[0].id, title: discussion.title });
      }
    }

    // Add sample replies to discussions
    const sampleReplies = [
      {
        discussion_id: 1, // Will be replaced with actual ID
        content: "I highly recommend the official React documentation as a starting point. It's been completely revamped recently and is very beginner-friendly. After that, I found Josh Comeau's courses to be excellent for deeper understanding.",
        author_id: getRandomUserId(allUsers),
        upvoted_by: [],
        created_at: new Date(Date.now() - 13 * 24 * 60 * 60 * 1000) // 13 days ago
      },
      {
        discussion_id: 1, // Will be replaced with actual ID
        content: "The 'Epic React' course by Kent C. Dodds is absolutely worth the investment if you're serious about React. Also, check out the 'React for Beginners' and 'Advanced React' courses by Wes Bos.",
        author_id: getRandomUserId(allUsers),
        upvoted_by: [],
        created_at: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000) // 12 days ago
      },
      {
        discussion_id: 2, // Will be replaced with actual ID
        content: "I'd be interested in joining your team! I have experience with React and have built several frontend applications. I've also dabbled in TensorFlow but would love to learn more about NLP.",
        author_id: getRandomUserId(allUsers),
        upvoted_by: [],
        created_at: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000) // 9 days ago
      },
      {
        discussion_id: 2, // Will be replaced with actual ID
        content: "I specialize in computer vision and have participated in several AI hackathons before. Would love to join forces! Let's connect and discuss ideas.",
        author_id: getRandomUserId(allUsers),
        upvoted_by: [],
        created_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000) // 8 days ago
      },
      {
        discussion_id: 3, // Will be replaced with actual ID
        content: "Time-blocking has been a game-changer for me. I dedicate specific hours to coursework and others to personal projects. Also, try to find overlap—I often use course assignments as opportunities to explore technologies I'm interested in for my personal projects.",
        author_id: getRandomUserId(allUsers),
        upvoted_by: [],
        created_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000) // 6 days ago
      },
      {
        discussion_id: 4, // Will be replaced with actual ID
        content: "Definitely go with Figma for UI/UX design as a beginner. It's free, has a lower learning curve than Adobe XD, and has tons of community resources. Check out the YouTube channel 'DesignCourse' for great tutorials.",
        author_id: getRandomUserId(allUsers),
        upvoted_by: [],
        created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000) // 4 days ago
      },
      {
        discussion_id: 5, // Will be replaced with actual ID
        content: "Start applying as early as September/October for summer internships at large tech companies. For portfolio projects, focus on quality over quantity—one well-documented, polished project that solves a real problem is better than several half-finished ones.",
        author_id: getRandomUserId(allUsers),
        upvoted_by: [],
        created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
      },
      {
        discussion_id: 6, // Will be replaced with actual ID
        content: "For your use case, I'd recommend a relational database like PostgreSQL. The data you described has clear relationships (users have projects, projects have messages), which SQL handles very well. NoSQL is better when your data structure is less defined or likely to change frequently.",
        author_id: getRandomUserId(allUsers),
        upvoted_by: [],
        created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) // 1 day ago
      },
      {
        discussion_id: 7, // Will be replaced with actual ID
        content: "I'm excited about the increased focus on AI and ML since that's where the industry is heading. However, I think systems programming provides important foundational knowledge. Ideally, they should find a way to include both without sacrificing one for the other.",
        author_id: getRandomUserId(allUsers),
        upvoted_by: [],
        created_at: new Date(Date.now() - 12 * 60 * 60 * 1000) // 12 hours ago
      },
      {
        discussion_id: 8, // Will be replaced with actual ID
        content: "My team has had great success with GitHub for version control, GitHub Projects for task tracking, and Discord for communication. We also use Figma for design collaboration and Notion for documentation. The integration between GitHub and Discord has been particularly helpful.",
        author_id: getRandomUserId(allUsers),
        upvoted_by: [],
        created_at: new Date(Date.now() - 4 * 60 * 60 * 1000) // 4 hours ago
      }
    ];

    // Map the discussion titles to their actual IDs
    for (const reply of sampleReplies) {
      const discussionIndex = reply.discussion_id - 1;
      if (discussionIndex >= 0 && discussionIndex < createdDiscussionIds.length) {
        reply.discussion_id = createdDiscussionIds[discussionIndex].id;
      }
    }

    // Add random upvotes to each reply
    for (const reply of sampleReplies) {
      const upvoteCount = Math.floor(Math.random() * 10) + 1; // 1-10 upvotes
      for (let i = 0; i < upvoteCount; i++) {
        const randomUserId = getRandomUserId(allUsers, reply.upvoted_by);
        if (randomUserId) {
          reply.upvoted_by.push(randomUserId);
        }
      }
    }

    // Insert replies
    for (const reply of sampleReplies) {
      const existingReplies = await db
        .select()
        .from(replies)
        .where(sql`${replies.content} = ${reply.content}`);
      
      if (existingReplies.length === 0) {
        // Use SQL to insert directly
        await db.execute(
          sql`INSERT INTO replies 
              (discussion_id, content, author_id, upvoted_by, created_at)
              VALUES 
              (${reply.discussion_id}, ${reply.content}, ${reply.author_id}, ${JSON.stringify(reply.upvoted_by)}, ${reply.created_at.toISOString()})`
        );
        console.log(`Added reply to discussion ID ${reply.discussion_id}`);
      } else {
        console.log(`Reply already exists. Skipping.`);
      }
    }

    console.log("Sample discussions and replies added successfully!");
  } catch (error) {
    console.error("Error adding sample discussions:", error);
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

addSampleDiscussions();