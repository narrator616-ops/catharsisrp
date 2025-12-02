import { GoogleGenAI } from "@google/genai";

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
};

export const generateLocationLore = async (locationName: string, locationType: string): Promise<string> => {
  const ai = getClient();
  if (!ai) {
    console.warn("API Key missing");
    return "API ключ не найден. Пожалуйста, настройте окружение.";
  }

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
