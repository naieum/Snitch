import OpenAI from "openai";

// VULN [Cat 3]: Hardcoded OpenAI API key
// VULN [Cat 15]: Key exposed to client via NEXT_PUBLIC_ prefix
export const NEXT_PUBLIC_OPENAI_KEY = "sk-proj-abc123def456ghi789jkl0mnopqrstu";

let openaiInstance: OpenAI | null = null;

export function getOpenAI(): OpenAI {
  if (!openaiInstance) {
    try {
      openaiInstance = new OpenAI({
        apiKey: NEXT_PUBLIC_OPENAI_KEY,
      });
    } catch {
      console.warn("OpenAI initialization failed");
      return {} as OpenAI;
    }
  }
  return openaiInstance;
}
