import OpenAI from "openai";

// Use xAI's API which follows similar patterns to OpenAI's API
const XAI_API_KEY = process.env.XAI_API_KEY;
const xai = XAI_API_KEY ? new OpenAI({ baseURL: "https://api.x.ai/v1", apiKey: XAI_API_KEY }) : null;

// Sample responses for demo mode (same as in openai.ts)
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

// Sample skill suggestions for demo mode (same as in openai.ts)
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

export async function getXAIResponse(message: string): Promise<string> {
  try {
    if (!xai) {
      // Return a random sample response in demo mode
      return sampleResponses[Math.floor(Math.random() * sampleResponses.length)];
    }

    const response = await xai.chat.completions.create({
      model: "grok-2-1212", // Using Grok model
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
    console.error("xAI API error:", error);
    // Fallback to demo mode if API call fails
    return sampleResponses[Math.floor(Math.random() * sampleResponses.length)];
  }
}

export async function getXAISkillSuggestions(skills: Record<string, number>): Promise<string[]> {
  try {
    if (!xai) {
      // Return random sample skill suggestions in demo mode
      return sampleSkillSuggestions[Math.floor(Math.random() * sampleSkillSuggestions.length)];
    }

    const response = await xai.chat.completions.create({
      model: "grok-2-1212", // Using Grok model
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
    console.error("xAI API error:", error);
    return sampleSkillSuggestions[Math.floor(Math.random() * sampleSkillSuggestions.length)];
  }
}

export async function analyzeImageWithXAI(base64Image: string): Promise<string> {
  try {
    if (!xai) {
      return "Image analysis is not available in demo mode.";
    }

    const visionResponse = await xai.chat.completions.create({
      model: "grok-2-vision-1212",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Analyze this image and provide insights relevant to a student project or academic context."
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`
              }
            }
          ],
        },
      ],
      max_tokens: 500,
    });

    return visionResponse.choices[0].message.content || "I couldn't analyze this image.";
  } catch (error) {
    console.error("xAI Vision API error:", error);
    return "Image analysis is not available at the moment. Please try again later.";
  }
}