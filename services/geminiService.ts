import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export const refineText = async (text: string, context: string): Promise<string> => {
  if (!apiKey) {
    console.warn("API Key not found");
    return "API Key missing. Please configure.";
  }

  try {
    const prompt = `You are a professional copywriter for a high-end wedding photography studio called 'Mera Studio & Films'. 
    
    Refine the following text which is used in a quotation for the section: "${context}".
    Make it sound professional, polite, and clear. Maintain a premium tone.
    Do not add markdown formatting or quotes around the output.
    
    Text to refine:
    ${text}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text?.trim() || text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return text;
  }
};