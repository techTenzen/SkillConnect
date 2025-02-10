// Deepseek AI API integration
const DEEPSEEK_API_ENDPOINT = "https://api.deepseek.com/v1";
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;

export async function getAIResponse(message: string): Promise<string> {
  try {
    if (!DEEPSEEK_API_KEY) {
      // Fallback response if no API key
      return "I'm currently in demo mode. The AI features will be available soon!";
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
    console.error("AI API error:", error);
    return "I'm currently experiencing technical difficulties. Please try again later.";
  }
}

export async function getSkillSuggestions(skills: Record<string, number>): Promise<string[]> {
  try {
    if (!DEEPSEEK_API_KEY) {
      return ["Programming", "Communication", "Problem Solving"];
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
      return [];
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    if (!content) {
      return [];
    }

    try {
      const result = JSON.parse(content);
      return result.skills || [];
    } catch (parseError) {
      console.error("Failed to parse skill suggestions:", parseError);
      return [];
    }
  } catch (error) {
    console.error("AI API error:", error);
    return [];
  }
}