import { GoogleGenAI } from "@google/genai";

export const generateLocationLore = async (locationName: string, locationType: string): Promise<string> => {
  // The API key must be obtained exclusively from the environment variable process.env.API_KEY
  const apiKey = process.env.API_KEY;
  
  if (!apiKey) {
    console.warn("API Key missing");
    return "API ключ не найден. Пожалуйста, настройте .env файл.";
  }

  const ai = new GoogleGenAI({ apiKey });

  try {
    const prompt = `Ты гейм-мастер в фэнтезийной ролевой игре. Напиши краткое, атмосферное описание (максимум 3 предложения) для локации с названием "${locationName}". Тип локации: ${locationType}. Используй мистический и загадочный тон на русском языке.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "Не удалось сгенерировать описание.";
  } catch (error) {
    console.error("Gemini API error:", error);
    return "Магические силы сейчас недоступны (Ошибка API).";
  }
};