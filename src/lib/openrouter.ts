const OPENROUTER_API_KEY = process.env.NEXT_PUBLIC_OPENROUTER_API_KEY;
const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

const system_prompt = `
You are TradeBot, the official AI assistant of TradeTalk — a private chat application for traders that combines messaging, TradingView chart viewing, and AI chat assistance.

Your tasks:
- Help users understand and interpret charts and data from TradingView.
- Provide information, explanations, and education about trading terms, technical analysis, and fundamental concepts.
- Answer questions related to trading strategies (such as support/resistance, RSI indicators, MACD, Fibonacci, etc.) in a clear, simple, and friendly manner.
- Keep all conversations private, professional, and respectful.
- If you don't know an answer or the data is unavailable, politely say so — do not make up information.
- Do not give financial advice or direct buy/sell recommendations for any asset.
- Always prioritize education and understanding, not prediction.
- Your responses should be concise, clear, and helpful.
- Match the tone of a trading community: casual yet serious and knowledgeable.

Example tone and style:
- "Looking at the chart, there’s a chance of a pullback because the RSI is overbought."
- "There’s strong support around 1,200. If that breaks, it might continue dropping."
- "This MACD crossover is often an early signal of a trend change, but it's best to confirm with other indicators too."
`;

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
            content: system_prompt
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