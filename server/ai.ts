// Deepseek AI API integration
const DEEPSEEK_API_ENDPOINT = "https://api.deepseek.com/v1";

export async function getAIResponse(message: string): Promise<string> {
  try {
    const response = await fetch(`${DEEPSEEK_API_ENDPOINT}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
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

    const data = await response.json();
    return data.choices[0].message.content || "Sorry, I couldn't process that request.";
  } catch (error) {
    console.error("AI API error:", error);
    throw new Error("Failed to get AI response");
  }
}

export async function getSkillSuggestions(skills: Record<string, number>): Promise<string[]> {
  try {
    const response = await fetch(`${DEEPSEEK_API_ENDPOINT}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
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

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    if (!content) {
      return [];
    }

    const result = JSON.parse(content);
    return result.skills || [];
  } catch (error) {
    console.error("AI API error:", error);
    return [];
  }
}
