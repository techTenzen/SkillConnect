import { getAIResponse as getOpenAIResponse, getSkillSuggestions as getOpenAISkillSuggestions } from "./openai";
import { getXAIResponse, getXAISkillSuggestions } from "./xai";

// Deepseek AI API integration
const DEEPSEEK_API_ENDPOINT = "https://api.deepseek.com/v1";
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const XAI_API_KEY = process.env.XAI_API_KEY;

// Sample responses for demo mode - unified across providers
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

async function getDeepseekResponse(message: string): Promise<string> {
  try {
    if (!DEEPSEEK_API_KEY) {
      // Fallback response if no API key
      return sampleResponses[Math.floor(Math.random() * sampleResponses.length)];
    }

    const response = await fetch(`${DEEPSEEK_API_ENDPOINT}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          {
            role: "system",
            content: "You are a helpful AI assistant for VIT-AP students, focusing on academic and technical topics. Keep responses concise and relevant."
          },
          { role: "user", content: message }
        ],
        temperature: 0.7,
        max_tokens: 500
      })
    });

    if (!response.ok) {
      // Log the error for debugging
      console.error("Deepseek API error:", await response.text());
      return "Sorry, I'm having trouble processing your request right now. Please try again later.";
    }

    const data = await response.json();
    return data.choices[0].message.content || "Sorry, I couldn't process that request.";
  } catch (error) {
    console.error("Deepseek API error:", error);
    return sampleResponses[Math.floor(Math.random() * sampleResponses.length)];
  }
}

async function getDeepseekSkillSuggestions(skills: Record<string, number>): Promise<string[]> {
  try {
    if (!DEEPSEEK_API_KEY) {
      return sampleSkillSuggestions[Math.floor(Math.random() * sampleSkillSuggestions.length)];
    }

    const response = await fetch(`${DEEPSEEK_API_ENDPOINT}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: "deepseek-chat",
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
        temperature: 0.7,
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) {
      console.error("Deepseek API error:", await response.text());
      return sampleSkillSuggestions[Math.floor(Math.random() * sampleSkillSuggestions.length)];
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    if (!content) {
      return sampleSkillSuggestions[Math.floor(Math.random() * sampleSkillSuggestions.length)];
    }

    try {
      const result = JSON.parse(content);
      return result.skills || sampleSkillSuggestions[Math.floor(Math.random() * sampleSkillSuggestions.length)];
    } catch (parseError) {
      console.error("Failed to parse skill suggestions:", parseError);
      return sampleSkillSuggestions[Math.floor(Math.random() * sampleSkillSuggestions.length)];
    }
  } catch (error) {
    console.error("Deepseek API error:", error);
    return sampleSkillSuggestions[Math.floor(Math.random() * sampleSkillSuggestions.length)];
  }
}

// Determine which AI provider to use based on available API keys
// Priority: 1. xAI, 2. OpenAI, 3. Deepseek, 4. Sample responses
export async function getAIResponse(message: string): Promise<string> {
  if (XAI_API_KEY) {
    console.log("Using xAI for response");
    return getXAIResponse(message);
  } else if (OPENAI_API_KEY) {
    console.log("Using OpenAI for response");
    return getOpenAIResponse(message);
  } else if (DEEPSEEK_API_KEY) {
    console.log("Using Deepseek for response");
    return getDeepseekResponse(message);
  } else {
    console.log("Using sample responses (demo mode)");
    return sampleResponses[Math.floor(Math.random() * sampleResponses.length)];
  }
}

export async function getSkillSuggestions(skills: Record<string, number>): Promise<string[]> {
  if (XAI_API_KEY) {
    console.log("Using xAI for skill suggestions");
    return getXAISkillSuggestions(skills);
  } else if (OPENAI_API_KEY) {
    console.log("Using OpenAI for skill suggestions");
    return getOpenAISkillSuggestions(skills);
  } else if (DEEPSEEK_API_KEY) {
    console.log("Using Deepseek for skill suggestions");
    return getDeepseekSkillSuggestions(skills);
  } else {
    console.log("Using sample skill suggestions (demo mode)");
    return sampleSkillSuggestions[Math.floor(Math.random() * sampleSkillSuggestions.length)];
  }
}