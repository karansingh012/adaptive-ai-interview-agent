import { GoogleGenAI } from "@google/genai";
import type { InterviewQuestion } from "@/types/question";
import { EVALUATION_PROMPT } from "@/lib/prompts/evaluation";

export class GeminiService {
  async evaluateAnswer(question: InterviewQuestion, answer: string, expectedConcepts: string[]) {
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

    if (!apiKey) {
      throw new Error("Missing Gemini API key");
    }

    try {
      const ai = new GoogleGenAI({ apiKey });

      const prompt = this.buildPrompt(question, answer, expectedConcepts);

      const result = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        },
      });

      const text = result.text ?? "";
      const parsed = this.parseResponse(text);

      if (
        !parsed ||
        typeof parsed !== "object" ||
        typeof parsed.feedback !== "string"
      ) {
        throw new Error("Invalid Gemini response");
      }

      return {
        score: this.clamp(Number(parsed.score ?? 0), 0, 10),
        feedback: parsed.feedback,
        strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
        improvements: Array.isArray(parsed.improvements) ? parsed.improvements : [],
        confidence: this.clamp(Number(parsed.confidence ?? 0), 0, 1),
      };
    } catch (error) {
      console.error("Gemini evaluation failed", {
        error,
        question: question.prompt,
      });
      throw new Error("Gemini evaluation failed");
    }
  }

  private buildPrompt(question: InterviewQuestion, answer: string, expectedConcepts: string[]) {
    const basePrompt = EVALUATION_PROMPT || "You are a Senior Technical Interviewer.";

    return `${basePrompt}

You are evaluating a technical interview answer.

Question:
${question.prompt}

Answer:
${answer}

Expected concepts:
${expectedConcepts.join(", ") || "None"}

Return STRICT JSON ONLY with this shape:
{
  "score": 0,
  "feedback": "string",
  "strengths": ["string"],
  "improvements": ["string"],
  "confidence": 0.0
}

Rules:
- Score from 0 to 10.
- Confidence from 0.0 to 1.0.
- No markdown.
- No explanation outside the JSON object.`;
  }

  private parseResponse(text: string) {
    try {
      const cleaned = text
        .trim()
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/```$/i, "")
        .trim();

      return JSON.parse(cleaned);
    } catch {
      return null;
    }
  }

  private clamp(value: number, min: number, max: number) {
    if (Number.isNaN(value)) {
      return min;
    }

    return Math.min(max, Math.max(min, value));
  }
}

export const geminiService = new GeminiService();
