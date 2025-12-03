import { GoogleGenAI } from "@google/genai";

export const generateLocationLore = async (locationName: string, locationType: string): Promise<string> => {
  // Access Vite env variable safely
  const apiKey = import.meta.env ? import.meta.env.VITE_API_KEY : undefined;
  
  if (!apiKey) {
    console.warn("API Key missing (VITE_API_KEY)");
    return "API ключ не найден. Пожалуйста, проверьте файл .env и убедитесь, что ключ называется VITE_API_KEY.";
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