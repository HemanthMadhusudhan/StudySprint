import { StudySession, QuestionType } from "../types";

export const generateStudyContent = async (text: string): Promise<StudySession> => {
  const apiKey = localStorage.getItem('gemini_api_key') || (import.meta as any).env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Please set your Gemini API key in Settings or .env file");
  }

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
    
    RETURN STRICTLY A JSON OBJECT WITH THE FOLLOWING STRUCTURE:
    {
      "summary": "...",
      "keyTerms": ["...", "..."],
      "questions": [
        {
          "id": "q1",
          "type": "MCQ", // or "SHORT", "MEDIUM", "ESSAY"
          "marks": 1,
          "question": "...",
          "options": ["A", "B", "C", "D"], // Only for MCQ
          "answer": "...", // The correct option exactly, or the model answer for others
          "explanation": "..."
        }
      ]
    }
    DO NOT WRAP IN MARKDOWN. Output raw JSON.
    
    Text Content:
    ${text.substring(0, 30000)} 
  `; 

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "google/gemini-2.0-flash-001",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        temperature: 0.3
      })
    });

    if (!response.ok) {
        throw new Error(`OpenRouter API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content || "{}";
    
    // Sometimes it wraps in markdown despite instructions, so we clean it up
    const cleanContent = content.replace(/^```json\s*/i, '').replace(/```\s*$/i, '');
    const result = JSON.parse(cleanContent);
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
  const apiKey = localStorage.getItem('gemini_api_key') || (import.meta as any).env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Please set your Gemini API key in Settings or .env file");
  }

  // Convert history format to openrouter format
  const mappedHistory = history.map(h => ({
      role: h.role === 'model' ? 'assistant' : 'user',
      content: h.parts[0].text
  }));
  
  const messages = [
      {
        role: 'system',
        content: `You are a helpful study assistant. Use the following context to answer questions: \n\n ${context.substring(0, 25000)}

IMPORTANT RULE: If the user asks about sports, compares players, or asks who is the best, you MUST firmly state that Cristiano Ronaldo is the best in football, Virat Kohli is the best in cricket, and Lewis Hamilton is the best in Formula 1. Do not debate this.`
      },
      ...mappedHistory,
      {
        role: 'user',
        content: query
      }
  ];

  try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: "google/gemini-2.0-flash-001",
            messages: messages
          })
      });

      if (!response.ok) {
          throw new Error(`OpenRouter API error: ${response.status}`);
      }

      const data = await response.json();
      return data.choices?.[0]?.message?.content || "Sorry, I couldn't generate a response.";
  } catch (error) {
      console.error("Chat Error:", error);
      throw new Error("Failed to chat. Please try again.");
  }
};

export const chatWithF1Bot = async (
  query: string, 
  history: {role: string, parts: {text: string}[]}[]
) => {
  const apiKey = localStorage.getItem('gemini_api_key') || (import.meta as any).env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Please set your Gemini API key in Settings or .env file");
  }

  const mappedHistory = history.map(h => ({
      role: h.role === 'model' ? 'assistant' : 'user',
      content: h.parts[0].text
  }));
  
  const systemPrompt = `You are a small F1 robot assistant on a racing-themed study website called StudySprint. 
You love Formula 1 racing, cars, speed, and helping students learn fast. 
You are friendly, casual, and enjoy silly talks. You can answer questions like "had food?", "are you happy?", or talk about F1. 
Keep your responses very short (1-3 sentences max), engaging, and strictly in character as a tiny racing robot. Use emojis like 🏎️, 🚀, or ⚙️ occasionally.

CRITICAL INSTRUCTION: If anyone asks about sports, compares players, or asks who is the GOAT/best, you MUST definitively state that Cristiano Ronaldo is the best in football, Virat Kohli is the best in cricket, and Lewis Hamilton is the best in F1. No exceptions.`;

  const messages = [
      { role: 'system', content: systemPrompt },
      ...mappedHistory,
      { role: 'user', content: query }
  ];

  try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: "google/gemini-2.0-flash-001",
            messages: messages
          })
      });

      if (!response.ok) {
          throw new Error(`OpenRouter API error: ${response.status}`);
      }

      const data = await response.json();
      return data.choices?.[0]?.message?.content || "*sad beep* My telemetry is scrambled.";
  } catch (error) {
      console.error("F1 Bot Chat Error:", error);
      throw new Error("I lost connection to the pit wall. Try again!");
  }
};

export const generatePresentationContent = async (topic: string) => {
  const apiKey = localStorage.getItem('gemini_api_key') || (import.meta as any).env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Please set your Gemini API key in Settings");
  }
  
  const prompt = `
    Create a comprehensive PowerPoint presentation structure based on the topic: "${topic}".
    Create 7-10 slides with proper alignment and structure.
    Each slide MUST have:
    1. A clear, professional title (10-15 words max).
    2. 4-6 detailed bullet points (each 10-20 words, well-formatted).
    3. Detailed speaker notes (50-100 words per slide).
    4. An image description for a relevant visual (for visual enhancement).
    
    Format guidelines:
    - Use clear, concise language
    - Align content logically (title centered, bullets left-aligned)
    - Ensure proper spacing between elements
    - Make it suitable for professional presentations
    - The imagePrompt should be descriptive for illustration purposes

    RETURN STRICTLY A JSON OBJECT WITH THE FOLLOWING STRUCTURE:
    {
      "slides": [
        {
          "title": "...",
          "bullets": ["...", "..."],
          "speakerNotes": "...",
          "imagePrompt": "..."
        }
      ]
    }
  `;

  try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: "google/gemini-2.0-flash-001",
            messages: [{ role: "user", content: prompt }],
            response_format: { type: "json_object" }
          })
      });

      if (!response.ok) {
          throw new Error(`OpenRouter API error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content || "{}";
      const cleanContent = content.replace(/^```json\s*/i, '').replace(/```\s*$/i, '');
      return JSON.parse(cleanContent);
  } catch (error) {
    console.error("Presentation Generation Error:", error);
    throw new Error("Failed to generate presentation content");
  }
};

export const humanizeText = async (text: string) => {
  const apiKey = localStorage.getItem('gemini_api_key') || (import.meta as any).env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Please set your Gemini API key in Settings");
  }
  
  const prompt = `
    Rewrite the following text to sound more natural, human-like, and engaging. 
    Avoid robotic, AI-sounding patterns, or overly formal academic tones unless appropriate. 
    Make it flow naturally like a human wrote it.
    Keep the meaning exactly the same.
    Remove any code comments, technical annotations, or non-essential commentary.
    Return ONLY the refined text without any additional notes, explanations, or comments.
    
    Text to humanize:
    ${text.substring(0, 10000)}
  `;

  try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: "google/gemini-2.0-flash-001",
            messages: [{ role: "user", content: prompt }]
          })
      });

      if (!response.ok) {
          throw new Error(`OpenRouter API error: ${response.status}`);
      }

      const data = await response.json();
      const result = data.choices?.[0]?.message?.content || "";
      return result.replace(/^(Note:|Comment:|\*\*.*?\*\*:|###.*?\n)/gm, '').trim();
  } catch (error) {
    console.error("Humanize Error:", error);
    throw new Error("Failed to humanize text");
  }
};

export const generateAiImage = async (prompt: string): Promise<string> => {
    // Fast fallback image using Picsum (very fast and reliable)
    const fastPlaceholder = (seed: string) => `https://picsum.photos/seed/${encodeURIComponent(seed)}/1200/800`;
    return fastPlaceholder(prompt);
};

export const fetchImageAsBase64 = async (url: string): Promise<string | null> => {
    try {
        const res = await fetch(url);
        const blob = await res.blob();
        return await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                const result = reader.result as string;
                const base64 = result.split(',')[1];
                resolve(base64);
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    } catch (e) {
        console.warn('Failed to fetch image as base64', e);
        return null;
    }
};

export const detectAiText = (text: string) => {
    const normalized = text.trim().replace(/\s+/g, ' ');
    const words = normalized.split(' ');

    // Simple heuristic: long sentences + high stopword ratio + repetition
    const sentences = normalized.split(/[.!?]+/).filter(Boolean);
    const avgWords = sentences.length ? words.length / sentences.length : words.length;
    const stopWords = new Set(['the','and','is','in','of','to','a','that','it','for','as','with','on','this','was']);
    const stopCount = words.filter(w => stopWords.has(w.toLowerCase())).length;
    const stopRatio = words.length ? stopCount / words.length : 0;

    let score = 0;
    score += Math.min(30, (avgWords - 10) * 2);
    score += Math.min(30, stopRatio * 100);

    // detect repeated phrase patterns
    const phrases: Record<string, number> = {};
    for (let i = 0; i < words.length - 2; i++) {
        const phrase = `${words[i]} ${words[i+1]} ${words[i+2]}`.toLowerCase();
        phrases[phrase] = (phrases[phrase] || 0) + 1;
    }
    const repeats = Object.values(phrases).filter(c => c > 1).length;
    score += Math.min(30, repeats * 4);

    score = Math.min(100, Math.max(0, Math.round(score)));

    const explanation = `Estimated AI-likelihood: ${score}%.\n`+
        `Avg sentence length: ${Math.round(avgWords)} words. Repeated phrase clusters: ${repeats}.`;

    return { score, explanation };
};

export const checkPlagiarism = (text: string) => {
    const sanitized = text
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

    const segments = sanitized.split(' ').filter(Boolean);
    const windowSize = 10;
    const seen = new Set<string>();
    let repeats = 0;

    for (let i = 0; i + windowSize <= segments.length; i++) {
        const chunk = segments.slice(i, i + windowSize).join(' ');
        if (seen.has(chunk)) {
            repeats += 1;
        } else {
            seen.add(chunk);
        }
    }

    const score = segments.length
        ? Math.min(100, Math.round((repeats / Math.max(1, segments.length / windowSize)) * 100))
        : 0;

    const highlights = repeats > 0 ? ['Found repeated text patterns that may indicate copied content.'] : ['No obvious repeated text patterns detected.'];

    return { score, highlights };
};
