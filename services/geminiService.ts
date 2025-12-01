import { GoogleGenAI, Type } from "@google/genai";
import { AiParsedResult } from "../types";

const parseTransactionWithGemini = async (text: string): Promise<AiParsedResult | null> => {
  if (!process.env.API_KEY) {
    console.warn("No API Key found for Gemini");
    return null;
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Schema definition for strict JSON output
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Extract financial transaction details from the following text: "${text}". 
      Infer the category from standard business categories if not explicit. 
      If the year is missing, assume 2025. 
      Return null values for missing fields.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            date: { type: Type.STRING, description: "ISO 8601 date format YYYY-MM-DD" },
            category: { type: Type.STRING, description: "Best fit category for the transaction" },
            description: { type: Type.STRING, description: "Brief description of the item or person" },
            amount: { type: Type.NUMBER, description: "The monetary value" },
            type: { type: Type.STRING, enum: ["income", "expense"], description: "Whether money is coming in or going out" }
          },
          required: ["amount", "type"]
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as AiParsedResult;
    }
    return null;
  } catch (error) {
    console.error("Error parsing transaction with Gemini:", error);
    return null;
  }
};

export { parseTransactionWithGemini };
