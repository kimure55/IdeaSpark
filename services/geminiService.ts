import { GoogleGenAI, Type, Chat, GenerateContentResponse } from "@google/genai";
import { Idea } from "../types";

// Helper to sanitize JSON string if the model wraps it in markdown blocks
const cleanJsonString = (str: string): string => {
  return str.replace(/```json\n?|\n?```/g, "").trim();
};

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Generates divergent ideas based on a keyword.
 * Uses gemini-2.5-flash for fast responses with high volume (30+ items).
 */
export const generateIdeas = async (
  keyword: string, 
  onStream?: (text: string) => void
): Promise<Idea[]> => {
  
  // Strict instruction for JSON output
  // Updated for maximum divergence, cross-industry leaps, and creative entropy in Chinese
  const systemInstruction = `
    你是一个旨在打破常规思维模式的“横向思维引擎”。
    你的目标是针对给定的关键词生成包含30个联想词的列表，要求如下：
    1. 高度发散：在不相关的领域之间跳跃（例如，从生物学到建筑学，再到古代神话，再到量子物理）。
    2. 无限制：不要局限于一个行业。混合使用专业的术语和抽象的概念。
    3. 非线性：避免明显的同义词。寻找“二阶”或“三阶”的连接。
    4. 跳跃性：进行认知跳跃。如果关键词是“苹果”，不要只说“水果”或“电脑”。要说“万有引力”（牛顿）、“原罪”（伊甸园）、“氰化物”（种子）、“纽约”（大苹果）、“图灵”（咬了一口的苹果）。

    请将你的回答格式化为 JSON 对象数组。
    每个对象应包含：
    - "phrase": 创意短语或概念（中文）。
    - "category": 一个多样化的标签（例如，“量子力学”、“美食学”、“历史”、“植物学”）。
    - "description": 对这种跳跃性联想的简短有力解释（最多15个字）。

    必须生成至少 30 个独特的项目。
    确保输出语言为中文。
  `;

  // Switching to gemini-2.5-flash for "Fast Association" as requested
  const modelId = "gemini-2.5-flash";
  
  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: `生成30个关于"${keyword}"的、极其发散的、跨行业的、意想不到的创意联想。`,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        // Disable thinking to prioritize speed for "fast association" mode
        thinkingConfig: {
            thinkingBudget: 0, 
        }, 
      },
    });

    const text = response.text || "[]";
    const cleanedText = cleanJsonString(text);
    
    try {
        const parsed = JSON.parse(cleanedText);
        // Map to internal Idea type with IDs
        return parsed.map((item: any, index: number) => ({
            id: `idea-${Date.now()}-${index}`,
            phrase: item.phrase,
            category: item.category,
            description: item.description
        }));
    } catch (e) {
        console.error("Failed to parse JSON", e);
        // Fallback if JSON fails, though responseMimeType should prevent this
        return [];
    }

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};

/**
 * Chat service for the assistant.
 */
export class ChatService {
  private chat: Chat;

  constructor() {
    this.chat = ai.chats.create({
      model: "gemini-3-pro-preview",
      config: {
        systemInstruction: "你是一个集成在灵感生成器应用中的乐于助人、富有创意的AI助手。帮助用户完善他们的想法，进行头脑风暴，或回答有关生成内容的问题。回答要简洁、鼓励性强，并使用中文。",
      },
    });
  }

  async sendMessageStream(message: string): Promise<AsyncIterable<GenerateContentResponse>> {
    return this.chat.sendMessageStream({ message });
  }
}