import { GoogleGenAI, Type, Schema } from "@google/genai";
import { StudySession, QuestionType } from "../types";

// Schema for structured output
const questionSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    id: { type: Type.STRING },
    type: { type: Type.STRING, enum: ['MCQ', 'SHORT', 'MEDIUM', 'ESSAY'] },
    marks: { type: Type.NUMBER },
    question: { type: Type.STRING },
    options: { 
      type: Type.ARRAY, 
      items: { type: Type.STRING },
      description: "Only for MCQ type. Provide 4 distinct options."
    },
    answer: { type: Type.STRING, description: "For MCQ, this MUST be the exact string of the correct option. For others, the model answer." },
    explanation: { type: Type.STRING }
  },
  required: ["id", "type", "marks", "question", "answer"],
};

const studySessionSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    summary: { type: Type.STRING, description: "A comprehensive 200-word exam-focused summary." },
    keyTerms: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Extract exactly 5 most important terms or concepts." },
    questions: {
      type: Type.ARRAY,
      items: questionSchema,
    }
  },
  required: ["summary", "keyTerms", "questions"]
};

// Schema for PPT generation
const slideSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING },
    bullets: { type: Type.ARRAY, items: { type: Type.STRING } },
    speakerNotes: { type: Type.STRING, description: "Detailed speaker notes for the presenter to explain this slide." }
  },
  required: ["title", "bullets", "speakerNotes"]
};

const pptSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    slides: { type: Type.ARRAY, items: slideSchema }
  },
  required: ["slides"]
};

export const generateStudyContent = async (text: string): Promise<StudySession> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const prompt = `
    You are an expert tutor for Indian competitive exams (JEE, NEET, UPSC, CBSE). 
    Analyze the following text content.
    
    1. Create a 200-word summary focusing on high-yield exam topics, formulas, and dates.
    2. Extract 5 key terms.
    3. Generate a set of exam questions based on the text:
       - 5 MCQs (1 mark each) testing recall. IMPORTANT: The 'answer' field for MCQs MUST match exactly one of the strings provided in 'options'.
       - 5 Short Answer questions (2 marks each).
       - 3 Medium Answer questions (5 marks each).
       - 2 Essay/Long Answer questions (10 marks each).
    
    Ensure questions are challenging and relevant to the text provided.
    
    Text Content:
    ${text.substring(0, 30000)} 
  `; 

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: studySessionSchema,
        temperature: 0.3, 
      }
    });

    const result = JSON.parse(response.text || "{}");
    return result as StudySession;
  } catch (error) {
    console.error("AI Generation Error:", error);
    throw new Error("Failed to generate study content. Please check your network and try again.");
  }
};

export const chatWithContext = async (
  query: string, 
  context: string, 
  history: {role: string, parts: {text: string}[]}[]
) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const chat = ai.chats.create({
    model: 'gemini-3-flash-preview',
    history: [
      {
        role: 'user',
        parts: [{ text: `You are a helpful study assistant. Use the following context to answer questions: \n\n ${context.substring(0, 25000)}` }]
      },
      {
        role: 'model',
        parts: [{ text: "Understood. I will answer questions based on the provided text." }]
      },
      ...history
    ],
  });

  const result = await chat.sendMessage({ message: query });
  return result.text;
};

// Updated to take a TOPIC instead of full text for generation
export const generatePresentationContent = async (topic: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `
    Create a comprehensive PowerPoint presentation structure based on the topic: "${topic}".
    Create 7-10 slides. 
    Each slide MUST have:
    1. A clear, professional title.
    2. 4-6 detailed bullet points that explain the concept thoroughly (not just keywords).
    3. Detailed speaker notes that the presenter can read to elaborate on the slide.
    
    The content should be educational, accurate, and suitable for students.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: pptSchema
      }
    });
    return JSON.parse(response.text || "{}");
  } catch (error) {
    throw new Error("Failed to generate presentation content");
  }
};

export const humanizeText = async (text: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `
    Rewrite the following text to sound more natural, human-like, and engaging. 
    Avoid robotic, AI-sounding patterns, or overly formal academic tones unless appropriate. 
    Make it flow naturally like a human wrote it.
    Keep the meaning exactly the same.
    
    Text to humanize:
    ${text.substring(0, 10000)}
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt
    });
    return response.text;
  } catch (error) {
    throw new Error("Failed to humanize text");
  }
};

export const generateAiImage = async (prompt: string): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [{ text: prompt }]
            },
            config: {
                imageConfig: {
                    aspectRatio: "1:1"
                }
            }
        });
        
        // Iterate through parts to find the image
        if (response.candidates && response.candidates[0].content && response.candidates[0].content.parts) {
            for (const part of response.candidates[0].content.parts) {
                if (part.inlineData) {
                    return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
                }
            }
        }
        throw new Error("No image generated.");
    } catch (error) {
        console.error("Image Gen Error:", error);
        throw new Error("Failed to generate image.");
    }
};