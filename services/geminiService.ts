import { GoogleGenAI, Type } from "@google/genai";
import { CakeShape } from "../types";

// Helper to convert File to Base64
const fileToGenerativePart = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      // Remove data url part
      const base64Data = base64String.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const analyzeCakeImage = async (file: File): Promise<{ suggestedShape?: CakeShape, suggestedColor?: string, description?: string }> => {
  try {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      console.warn("API Key not found");
      return {};
    }

    const ai = new GoogleGenAI({ apiKey });
    const model = "gemini-2.5-flash"; // Use generic flash for multimodal
    
    const base64Data = await fileToGenerativePart(file);

    const prompt = `Analyze this cake image for a custom order form. 
    1. Identify the shape (Round, Rectangle, Square, Heart).
    2. Identify the dominant color of the surface (return a Hex code).
    3. Write a very short, 1-sentence poetic description of the cake in Czech language.
    
    Return JSON.`;

    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: [
          { inlineData: { mimeType: file.type, data: base64Data } },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            shape: { type: Type.STRING, enum: ["Round", "Rectangle", "Square", "Heart"] },
            hexColor: { type: Type.STRING },
            description: { type: Type.STRING }
          }
        }
      }
    });

    const text = response.text;
    if (!text) return {};

    const data = JSON.parse(text);
    
    let mapShape = undefined;
    if (data.shape === "Round") mapShape = CakeShape.ROUND;
    if (data.shape === "Rectangle") mapShape = CakeShape.RECTANGLE;
    if (data.shape === "Square") mapShape = CakeShape.SQUARE;
    if (data.shape === "Heart") mapShape = CakeShape.HEART;

    return {
      suggestedShape: mapShape,
      suggestedColor: data.hexColor,
      description: data.description
    };

  } catch (error) {
    console.error("Gemini analysis failed:", error);
    return {};
  }
};