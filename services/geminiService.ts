
import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.API_KEY;

let ai: GoogleGenAI | null = null;
if (apiKey) {
    ai = new GoogleGenAI({ apiKey });
} else {
    console.error("Gemini API key not found. Fun fact feature will be disabled.");
}

export const getFunFact = async (songTitle: string, artist: string): Promise<string> => {
  if (!ai) {
    return "Your request has been submitted! (Fun fact feature is currently offline).";
  }
  
  const prompt = `Tell me one, short, interesting fun fact about the song "${songTitle}" by the artist "${artist}". Keep it to a single, concise sentence. If you don't know, say something cool about the artist.`;

  try {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          thinkingConfig: { thinkingBudget: 0 },
        }
    });
    return response.text;
  } catch (error) {
    console.error("Error fetching fun fact from Gemini:", error);
    return `Could not fetch a fun fact for "${songTitle}", but your request is in the queue!`;
  }
};
