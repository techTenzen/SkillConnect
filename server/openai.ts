import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function getAIResponse(message: string): Promise<string> {
  try {
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
    throw new Error("Failed to get AI response");
  }
}

export async function getSkillSuggestions(skills: Record<string, number>): Promise<string[]> {
  try {
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
      return [];
    }

    const result = JSON.parse(response.choices[0].message.content);
    return result.skills || [];
  } catch (error) {
    console.error("OpenAI API error:", error);
    return [];
  }
}