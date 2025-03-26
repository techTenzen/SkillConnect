import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

// Sample responses for demo mode
const sampleResponses = [
  "That's an interesting question! Based on my knowledge, I'd recommend looking into the latest research papers on this topic. VIT-AP's library has excellent resources on this.",
  "Great question! Have you considered collaborating with students from different departments? Interdisciplinary projects often lead to innovative solutions.",
  "I'd suggest breaking down this problem into smaller components. Start with a proof of concept, then iterate based on feedback from your peers.",
  "For this topic, I recommend checking Professor Kumar's lectures on the subject. His approach is particularly helpful for beginners.",
  "This is a common challenge for students. I'd recommend forming a study group with peers who have complementary skills to yours.",
  "The Computer Science department at VIT-AP has a workshop on this topic next month. It might be worth attending to get hands-on experience.",
  "Have you considered applying for the university's innovation grant? Your project idea seems well-aligned with their funding priorities.",
  "This is a rapidly evolving field. I'd recommend following the latest developments through IEEE papers and joining relevant student chapters.",
  "Your approach seems solid. Consider adding unit tests to ensure your code remains robust as the project scales.",
  "The Mathematics department offers a course that covers these concepts in depth. It might be helpful to sit in on a few lectures."
];

// Sample skill suggestions for demo mode
const sampleSkillSuggestions = [
  ["Machine Learning", "Data Visualization", "Cloud Computing"],
  ["React.js", "Node.js", "GraphQL"],
  ["Python", "TensorFlow", "Data Analysis"],
  ["Public Speaking", "Technical Writing", "Project Management"],
  ["Docker", "Kubernetes", "CI/CD Pipelines"],
  ["UX Design", "UI Prototyping", "User Research"],
  ["Database Design", "SQL Optimization", "NoSQL Concepts"],
  ["Mobile Development", "Cross-platform Frameworks", "App Security"],
  ["Blockchain", "Smart Contracts", "Decentralized Applications"],
  ["Cybersecurity", "Network Protocols", "Ethical Hacking"]
];

export async function getAIResponse(message: string): Promise<string> {
  try {
    if (!OPENAI_API_KEY) {
      // Return a random sample response in demo mode
      return sampleResponses[Math.floor(Math.random() * sampleResponses.length)];
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a helpful AI assistant for VIT-AP students, focusing on academic and technical topics. Keep responses concise and relevant."
        },
        { role: "user", content: message }
      ],
      temperature: 0.7,
      max_tokens: 500
    });

    return response.choices[0].message.content || "Sorry, I couldn't process that request.";
  } catch (error) {
    console.error("OpenAI API error:", error);
    // Fallback to demo mode if API call fails
    return sampleResponses[Math.floor(Math.random() * sampleResponses.length)];
  }
}

export async function getSkillSuggestions(skills: Record<string, number>): Promise<string[]> {
  try {
    if (!OPENAI_API_KEY) {
      // Return random sample skill suggestions in demo mode
      return sampleSkillSuggestions[Math.floor(Math.random() * sampleSkillSuggestions.length)];
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a career advisor specializing in technology skills. Suggest 3 relevant skills based on the user's current skillset."
        },
        {
          role: "user",
          content: `Based on these skills and proficiency levels (0-100): ${JSON.stringify(skills)}, what are 3 complementary skills I should learn next?`
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7
    });

    if (!response.choices[0].message.content) {
      return sampleSkillSuggestions[Math.floor(Math.random() * sampleSkillSuggestions.length)];
    }

    const result = JSON.parse(response.choices[0].message.content);
    return result.skills || sampleSkillSuggestions[Math.floor(Math.random() * sampleSkillSuggestions.length)];
  } catch (error) {
    console.error("OpenAI API error:", error);
    return sampleSkillSuggestions[Math.floor(Math.random() * sampleSkillSuggestions.length)];
  }
}