const OPENROUTER_API_KEY = process.env.NEXT_PUBLIC_OPENROUTER_API_KEY;
const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

export interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

export async function getChatCompletion(messages: Message[]) {
  if (!OPENROUTER_API_KEY || OPENROUTER_API_KEY === "your_openrouter_api_key_here") {
    throw new Error("Please set your OpenRouter API key in the .env file");
  }
  try {
    const response = await fetch(OPENROUTER_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "HTTP-Referer": window.location.origin,
        "X-Title": "AI Chat Assistant"
      },
      body: JSON.stringify({
        model: "meta-llama/llama-3.3-70b-instruct:free",
        messages: [
          {
            role: "system",
            content: "You are a helpful, friendly, and knowledgeable AI assistant. Provide accurate, informative, and engaging responses while maintaining a natural conversational tone."
          },
          ...messages
        ],
        temperature: 0.7,
        max_tokens: 1000,
        top_p: 0.9,
        stream: false
      })
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error?.message || data.message || "Failed to get AI response");
    }
    if (!data.choices?.[0]?.message?.content) {
      throw new Error("Invalid response format from OpenRouter API");
    }
    return data.choices[0].message.content;
  } catch (error: any) {
    if (error instanceof Error) {
      throw new Error(`OpenRouter API Error: ${error.message}`);
    }
    throw new Error("An unexpected error occurred while calling OpenRouter API");
  }
}