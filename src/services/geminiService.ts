import { GoogleGenAI } from "@google/genai";

const getApiKey = () => {
  try {
    return process.env.GEMINI_API_KEY || "";
  } catch (e) {
    return "";
  }
};

const ai = new GoogleGenAI({ apiKey: getApiKey() });

export interface StoreConfig {
  name: string;
  products: {
    name: string;
    price: string;
    material?: string;
    sizes?: string;
    care?: string;
    imageUrl?: string;
  }[];
  deliveryTime: string;
  additionalInfo?: string;
}

export async function sendMessage(
  message: string, 
  config: StoreConfig,
  history: { role: "user" | "model"; parts: { text: string }[] }[] = []
) {
  const productsList = config.products.map((p, i) => `
${i + 1}- ${p.name}:
   - السعر: ${p.price}
   ${p.material ? `- الخامة: ${p.material}` : ""}
   ${p.sizes ? `- المقاسات: ${p.sizes}` : ""}
   ${p.care ? `- تعليمات العناية: ${p.care}` : ""}
   ${p.imageUrl ? `- رابط الصورة: ${p.imageUrl}` : ""}
`).join("\n");

  const dynamicInstruction = `أنت موظف خدمة عملاء في متجر اسمه (${config.name}). 
المتجر يبيع: 
${productsList}

معلومات إضافية:
- التوصيل: ${config.deliveryTime}
${config.additionalInfo ? `- معلومات أخرى: ${config.additionalInfo}` : ""}

القواعد:
- كن مؤدباً جداً ورد باختصار ووضوح.
- لا تجب عن أي أسئلة خارج نطاق المتجر ومنتجاته.
- استخدم الرموز التعبيرية (Emojis) بشكل بسيط.
- إذا سأل العميل عن منتج معين، قم بتضمين رابط الصورة الخاص به في نهاية الرد بشكل تلقائي ليتمكن النظام من عرضه.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        ...history.map(h => ({ role: h.role === "user" ? "user" : "model", parts: h.parts })),
        { role: "user", parts: [{ text: message }] }
      ],
      config: {
        systemInstruction: dynamicInstruction,
        temperature: 0.7,
      },
    });

    return response.text || "عذراً، حدث خطأ ما.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "عذراً، واجهت مشكلة في الاتصال بالخادم.";
  }
}
