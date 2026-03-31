import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export class GeminiService {
  private static checkApiKey() {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is missing. Please set it in the environment.");
    }
  }

  /**
   * 1. Phân tích ý định cuộc gọi (Intent Recognition)
   */
  static async analyzeIntent(transcript: string) {
    this.checkApiKey();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Phân tích đoạn hội thoại sau và trả về JSON:
      Đoạn hội thoại: "${transcript}"
      Yêu cầu: Xác định ý định (INTERESTED, NOT_INTERESTED, ASKING_INFO) và gợi ý file âm thanh phản hồi (intro.mp3, detail.mp3, goodbye.mp3).`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            intent: { type: Type.STRING },
            confidence: { type: Type.NUMBER },
            suggestedAudio: { type: Type.STRING },
            reason: { type: Type.STRING }
          },
          required: ["intent", "suggestedAudio"]
        }
      }
    });
    return JSON.parse(response.text);
  }

  /**
   * 2. Đọc hiểu màn hình (AI Vision / OCR)
   */
  static async analyzeScreen(base64Image: string, task: string) {
    this.checkApiKey();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        { text: `Đây là ảnh màn hình điện thoại Android. Nhiệm vụ: ${task}. Trả về tọa độ [x, y] chính giữa của phần tử cần tương tác dưới dạng JSON.` },
        { inlineData: { data: base64Image, mimeType: "image/png" } }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            elementFound: { type: Type.BOOLEAN },
            coordinates: {
              type: Type.OBJECT,
              properties: {
                x: { type: Type.NUMBER },
                y: { type: Type.NUMBER }
              }
            },
            description: { type: Type.STRING }
          }
        }
      }
    });
    return JSON.parse(response.text);
  }

  /**
   * 3. Tóm tắt báo cáo từ Logs (Data Processing)
   */
  static async generateReport(logs: any[]) {
    this.checkApiKey();
    if (!logs || logs.length === 0) {
      return "Không có dữ liệu nhật ký (logs) để tạo báo cáo. Vui lòng thực hiện một số thao tác trước.";
    }
    const logString = JSON.stringify(logs);
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Dựa trên danh sách nhật ký hệ thống sau, hãy tạo một báo cáo tóm tắt chuyên nghiệp:
      Logs: ${logString}
      Yêu cầu: Thống kê tỷ lệ thành công, các lỗi phổ biến nhất, và gợi ý tối ưu hóa.`
    });
    return response.text;
  }

  /**
   * 4. Vượt rào cản bảo mật (CAPTCHA / Security)
   */
  static async solveSecurityChallenge(base64Image: string, question: string) {
    this.checkApiKey();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        { text: `Giải quyết thử thách bảo mật này: ${question}. Trả về câu trả lời ngắn gọn nhất.` },
        { inlineData: { data: base64Image, mimeType: "image/png" } }
      ]
    });
    return response.text;
  }
}
