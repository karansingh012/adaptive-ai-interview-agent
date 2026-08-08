import { GoogleGenAI, Type } from "@google/genai";
import type { InterviewQuestion } from "@/types/question";
import { EVALUATION_PROMPT } from "@/lib/prompts/evaluation";

const GEMINI_MODELS = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-2.5-flash-lite", "gemini-3.6-flash"] as const;

export type GeminiEvaluation = {
  score: number;
  feedback: string;
  strengths: string[];
  improvements: string[];
  confidence: number;
};

export type GeminiGeneratedQuestion = {
  prompt: string;
  difficulty: "easy" | "medium" | "hard";
  expectedConcepts: string[];
  reason: string;
};

class GeminiEvaluationError extends Error {
  diagnostics: ErrorDiagnostics;

  constructor(message: string, diagnostics: ErrorDiagnostics = {}) {
    super(message);
    this.name = "GeminiEvaluationError";
    this.diagnostics = diagnostics;
  }
}

type ErrorDiagnostics = {
  errorClass?: string;
  httpStatus?: number | string;
  googleErrorCode?: number | string;
  googleErrorStatus?: string;
  googleErrorMessage?: string;
  googleErrorDetails?: unknown;
  originalSdkResponse?: unknown;
  attemptedModels?: string[];
  failedModels?: Array<{
    model: string;
    diagnostics: ErrorDiagnostics;
  }>;
};

type GenerateInput = {
  contents: string;
  responseMimeType?: string;
  responseSchema?: unknown;
};

export function getErrorDiagnostics(error: unknown): ErrorDiagnostics {
  if (error instanceof GeminiEvaluationError) {
    return error.diagnostics;
  }

  const errorRecord = error && typeof error === "object" ? error as Record<string, unknown> : {};
  const message = getStandaloneErrorMessage(error);
  const parsedGoogleError = parseGoogleError(message) ?? parseGoogleError(JSON.stringify(errorRecord));
  const googleError = parsedGoogleError?.error;
  const sdkResponse =
    errorRecord.response ??
    errorRecord.cause ??
    parsedGoogleError ??
    null;

  return {
    errorClass: error instanceof Error ? error.constructor.name : typeof error,
    httpStatus: typeof errorRecord.status === "number" || typeof errorRecord.status === "string"
      ? errorRecord.status
      : googleError?.code,
    googleErrorCode: googleError?.code,
    googleErrorStatus: googleError?.status,
    googleErrorMessage: googleError?.message,
    googleErrorDetails: googleError?.details,
    originalSdkResponse: sdkResponse,
  };
}

export class GeminiService {
  async generateQuestionJson(prompt: string): Promise<GeminiGeneratedQuestion> {
    const apiKey =
      process.env.GOOGLE_GENERATIVE_AI_API_KEY ??
      process.env.GEMINI_API_KEY;

    if (!apiKey) {
      throw new GeminiEvaluationError("Missing API key: set GOOGLE_GENERATIVE_AI_API_KEY or GEMINI_API_KEY", {
        attemptedModels: [...GEMINI_MODELS],
      });
    }

    const { model, result } = await this.generateWithFallback(apiKey, {
      contents: prompt,
      responseMimeType: "application/json",
      responseSchema: this.questionSchema(),
    });
    console.log("[GeminiService] Question generation model succeeded:", model);

    const text = result.text ?? "";
    console.log("[GeminiService] Question generation raw response:", text);

    if (!text.trim()) {
      throw new GeminiEvaluationError("Invalid Gemini response: Gemini returned an empty question response");
    }

    return this.normalizeGeneratedQuestion(this.parseResponse(text));
  }

  async generateFollowUpQuestionJson(prompt: string): Promise<GeminiGeneratedQuestion> {
    const apiKey =
      process.env.GOOGLE_GENERATIVE_AI_API_KEY ??
      process.env.GEMINI_API_KEY;

    if (!apiKey) {
      throw new GeminiEvaluationError("Missing API key: set GOOGLE_GENERATIVE_AI_API_KEY or GEMINI_API_KEY", {
        attemptedModels: [...GEMINI_MODELS],
      });
    }

    const { model, result } = await this.generateWithFallback(apiKey, {
      contents: prompt,
      responseMimeType: "application/json",
      responseSchema: this.questionSchema(),
    });
    console.log("[GeminiService] Follow-up question generation model succeeded:", model);

    const text = result.text ?? "";
    console.log("[GeminiService] Follow-up question generation raw response:", text);

    if (!text.trim()) {
      throw new GeminiEvaluationError("Invalid Gemini response: Gemini returned an empty follow-up question response");
    }

    return this.normalizeGeneratedQuestion(this.parseResponse(text));
  }

  async evaluateAnswer(question: InterviewQuestion, answer: string, expectedConcepts: string[]): Promise<GeminiEvaluation> {
    const apiKey =
      process.env.GOOGLE_GENERATIVE_AI_API_KEY ??
      process.env.GEMINI_API_KEY;
    const prompt = this.buildPrompt(question, answer, expectedConcepts);

    if (!apiKey) {
      this.logDebugContext({
        apiKeyExists: false,
        question,
        answer,
        expectedConcepts,
        prompt,
      });
      throw new GeminiEvaluationError("Missing API key: set GOOGLE_GENERATIVE_AI_API_KEY or GEMINI_API_KEY", {
        attemptedModels: [...GEMINI_MODELS],
      });
    }

    try {
      this.logDebugContext({
        apiKeyExists: true,
        question,
        answer,
        expectedConcepts,
        prompt,
      });

      const { model, result } = await this.generateWithFallback(apiKey, {
        contents: prompt,
        responseMimeType: "application/json",
        responseSchema: this.evaluationSchema(),
      });
      console.log("[GeminiService] Model succeeded:", model);

      const text = result.text ?? "";
      console.log("========== STEP 9 ==========");
      console.log("[GeminiService] Gemini raw response:", text);

      if (!text.trim()) {
        throw new GeminiEvaluationError("Invalid Gemini response: Gemini returned an empty response");
      }
      const parsed = this.parseResponse(text);
      console.log("========== STEP 10 ==========");
      console.log("[GeminiService] Parsed JSON:", parsed);

      const evaluation = this.normalizeEvaluation(parsed);
      console.log("========== STEP 11 ==========");
      console.log("[GeminiService] Final evaluation object:", evaluation);

      return evaluation;
    } catch (error) {
      const diagnostics = getErrorDiagnostics(error);
      const message = this.classifyError(error, diagnostics);
      console.error("[GeminiService] Gemini evaluation failed:", message);
      console.error("[GeminiService] Original exception:", error);
      console.error("[GeminiService] Error diagnostics:", diagnostics);
      if (error instanceof Error && error.stack) {
        console.error("[GeminiService] Stack trace:", error.stack);
      }
      throw new GeminiEvaluationError(message, diagnostics);
    }
  }

  async debugSayHello() {
    const apiKey =
      process.env.GOOGLE_GENERATIVE_AI_API_KEY ??
      process.env.GEMINI_API_KEY;

    const request = {
      contents: "Say Hello",
    };

    console.log("[GeminiService Debug] API key exists?", Boolean(apiKey));
    console.log("[GeminiService Debug] Project ID:", this.projectId());
    console.log("[GeminiService Debug] Project Number:", this.projectNumber());
    console.log("[GeminiService Debug] Raw Gemini request:", request);

    if (!apiKey) {
      throw new GeminiEvaluationError("Missing API key: set GOOGLE_GENERATIVE_AI_API_KEY or GEMINI_API_KEY", {
        attemptedModels: [...GEMINI_MODELS],
      });
    }

    const response = await this.generateWithFallback(apiKey, request);
    console.log("[GeminiService Debug] Authentication succeeds?", true);
    console.log("[GeminiService Debug] Model succeeded:", response.model);
    console.log("[GeminiService Debug] Raw Gemini response:", response.result);

    return {
      model: response.model,
      text: response.result.text ?? "",
      rawResponse: response.result,
    };
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

  private async generateWithFallback(apiKey: string, input: GenerateInput) {
    const ai = new GoogleGenAI({ apiKey });
    const failedModels: Array<{ model: string; diagnostics: ErrorDiagnostics }> = [];

    for (const model of GEMINI_MODELS) {
      const request = {
        model,
        contents: input.contents,
        config: {
          ...(input.responseMimeType ? { responseMimeType: input.responseMimeType } : {}),
          ...(input.responseSchema ? { responseSchema: input.responseSchema } : {}),
        },
      };

      console.log("========== STEP 7 ==========");
      console.log("Gemini model", model);
      console.log("========== STEP 8 ==========");
      console.log("Raw Gemini request", request);

      try {
        const result = await ai.models.generateContent(request);
        return { model, result };
      } catch (error) {
        const diagnostics = getErrorDiagnostics(error);
        failedModels.push({ model, diagnostics });
        this.logSdkException(error, diagnostics);

        if (this.isResourceExhausted(diagnostics)) {
          console.warn("[GeminiService] RESOURCE_EXHAUSTED for model, trying next model:", model);
          continue;
        }

        if (this.isModelUnavailable(diagnostics)) {
          console.warn("[GeminiService] Model unavailable, trying next model:", model);
          continue;
        }

        throw new GeminiEvaluationError(this.classifyError(error, diagnostics), {
          ...diagnostics,
          attemptedModels: [...GEMINI_MODELS],
          failedModels,
        });
      }
    }

    throw new GeminiEvaluationError("Gemini request failed: all configured Gemini models failed", {
      attemptedModels: [...GEMINI_MODELS],
      failedModels,
    });
  }

  private evaluationSchema() {
    return {
      type: Type.OBJECT,
      properties: {
        score: { type: Type.NUMBER },
        feedback: { type: Type.STRING },
        strengths: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
        },
        improvements: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
        },
        confidence: { type: Type.NUMBER },
      },
      required: ["score", "feedback", "strengths", "improvements", "confidence"],
    };
  }

  private questionSchema() {
    return {
      type: Type.OBJECT,
      properties: {
        prompt: { type: Type.STRING },
        difficulty: {
          type: Type.STRING,
          enum: ["easy", "medium", "hard"],
        },
        expectedConcepts: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
        },
        reason: { type: Type.STRING },
      },
      required: ["prompt", "difficulty", "expectedConcepts", "reason"],
    };
  }

  private parseResponse(text: string): unknown {
    try {
      const cleaned = text
        .trim()
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/```$/i, "")
        .trim();

      return JSON.parse(cleaned);
    } catch (directError) {
      const jsonText = this.extractJsonObject(text);

      if (!jsonText) {
        console.error("[GeminiService] Invalid JSON response. Raw Gemini response:", text);
        if (directError instanceof Error && directError.stack) {
          console.error("[GeminiService] JSON parse stack trace:", directError.stack);
        }
        throw new GeminiEvaluationError(`Invalid JSON response: ${this.getErrorMessage(directError)}`);
      }

      try {
        return JSON.parse(jsonText);
      } catch (extractedError) {
        console.error("[GeminiService] Invalid JSON response. Raw Gemini response:", text);
        console.error("[GeminiService] Extracted JSON candidate:", jsonText);
        if (extractedError instanceof Error && extractedError.stack) {
          console.error("[GeminiService] JSON parse stack trace:", extractedError.stack);
        }
        throw new GeminiEvaluationError(`Invalid JSON response: ${this.getErrorMessage(extractedError)}`);
      }
    }
  }

  private normalizeEvaluation(parsed: unknown): GeminiEvaluation {
    if (!parsed || typeof parsed !== "object") {
      throw new GeminiEvaluationError("Invalid Gemini response: expected a JSON object");
    }

    const data = parsed as Record<string, unknown>;
    const score = Number(data.score);
    const confidence = Number(data.confidence);

    if (typeof data.feedback !== "string" || Number.isNaN(score) || Number.isNaN(confidence)) {
      throw new GeminiEvaluationError("Invalid Gemini response: missing score, feedback, or confidence");
    }

    return {
      score: this.clamp(score, 0, 10),
      feedback: data.feedback,
      strengths: this.normalizeStringArray(data.strengths),
      improvements: this.normalizeStringArray(data.improvements),
      confidence: this.clamp(confidence, 0, 1),
    };
  }

  private normalizeGeneratedQuestion(parsed: unknown): GeminiGeneratedQuestion {
    if (!parsed || typeof parsed !== "object") {
      throw new GeminiEvaluationError("Invalid Gemini response: expected a question JSON object");
    }

    const data = parsed as Record<string, unknown>;
    const difficulty = typeof data.difficulty === "string" ? data.difficulty.toLowerCase() : "";

    if (
      typeof data.prompt !== "string" ||
      !["easy", "medium", "hard"].includes(difficulty)
    ) {
      throw new GeminiEvaluationError("Invalid Gemini response: missing prompt or difficulty");
    }

    return {
      prompt: data.prompt.trim(),
      difficulty: difficulty as GeminiGeneratedQuestion["difficulty"],
      expectedConcepts: this.normalizeStringArray(data.expectedConcepts),
      reason: typeof data.reason === "string" ? data.reason : "Generated from candidate and curriculum context.",
    };
  }

  private normalizeStringArray(value: unknown): string[] {
    if (!Array.isArray(value)) {
      return [];
    }

    return value.filter((item): item is string => typeof item === "string");
  }

  private extractJsonObject(text: string): string | null {
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");

    if (start === -1 || end === -1 || end <= start) {
      return null;
    }

    return text.slice(start, end + 1);
  }

  private logDebugContext(input: {
    apiKeyExists: boolean;
    question: InterviewQuestion;
    answer: string;
    expectedConcepts: string[];
    prompt: string;
  }) {
    console.log("========== STEP 6 ==========");
    console.log("[GeminiService] API key exists?", input.apiKeyExists);
    console.log("[GeminiService] Project ID:", this.projectId());
    console.log("[GeminiService] Project Number:", this.projectNumber());
    console.log("[GeminiService] Authentication succeeds?", "pending Gemini API response");
    console.log("[GeminiService] Question:", input.question.prompt);
    console.log("[GeminiService] Candidate answer:", input.answer);
    console.log("[GeminiService] Expected concepts:", input.expectedConcepts);
    console.log("[GeminiService] Prompt sent to Gemini:", input.prompt);
  }

  private classifyError(error: unknown, diagnostics = getErrorDiagnostics(error)): string {
    const message = this.getErrorMessage(error);
    const status = diagnostics.httpStatus ?? diagnostics.googleErrorCode;
    const lowerMessage = message.toLowerCase();

    if (error instanceof GeminiEvaluationError) {
      return error.message;
    }

    if (status === 401 || status === 403 || lowerMessage.includes("api key") || lowerMessage.includes("permission")) {
      return `Gemini authentication failed: ${message}`;
    }

    if (status === 404 || lowerMessage.includes("not found")) {
      return `Model not found: ${message}`;
    }

    if (status === 429 || lowerMessage.includes("quota") || lowerMessage.includes("rate")) {
      return `Rate limit exceeded: ${message}`;
    }

    if (lowerMessage.includes("fetch") || lowerMessage.includes("network") || lowerMessage.includes("econn")) {
      return `Network error: ${message}`;
    }

    return `SDK error: ${message}`;
  }

  private logSdkException(error: unknown, diagnostics: ErrorDiagnostics) {
    console.error("[GeminiService] Gemini exception class:", diagnostics.errorClass);
    console.error("[GeminiService] Gemini HTTP status:", diagnostics.httpStatus);
    console.error("[GeminiService] Google error code:", diagnostics.googleErrorCode);
    console.error("[GeminiService] Google error message:", diagnostics.googleErrorMessage);
    console.error("[GeminiService] Google error details:", diagnostics.googleErrorDetails);
    console.error("[GeminiService] Original SDK response:", diagnostics.originalSdkResponse);
    console.error("[GeminiService] Original exception:", error);
    if (error instanceof Error && error.stack) {
      console.error("[GeminiService] Full stack trace:", error.stack);
    }
  }

  private isResourceExhausted(diagnostics: ErrorDiagnostics) {
    return diagnostics.googleErrorStatus === "RESOURCE_EXHAUSTED" ||
      diagnostics.httpStatus === 429 ||
      diagnostics.googleErrorCode === 429;
  }

  private isModelUnavailable(diagnostics: ErrorDiagnostics) {
    return diagnostics.googleErrorStatus === "NOT_FOUND" ||
      diagnostics.httpStatus === 404 ||
      diagnostics.googleErrorCode === 404;
  }

  private projectId() {
    return process.env.GOOGLE_CLOUD_PROJECT ??
      process.env.GOOGLE_PROJECT_ID ??
      "not available from environment";
  }

  private projectNumber() {
    return process.env.GOOGLE_CLOUD_PROJECT_NUMBER ??
      process.env.GOOGLE_PROJECT_NUMBER ??
      "not available from environment";
  }

  private getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }

    if (typeof error === "string") {
      return error;
    }

    try {
      return JSON.stringify(error);
    } catch {
      return "Unknown Gemini error";
    }
  }

  private getErrorStatus(error: unknown): number | undefined {
    if (!error || typeof error !== "object") {
      return undefined;
    }

    const record = error as Record<string, unknown>;
    const status = record.status ?? record.code;

    return typeof status === "number" ? status : undefined;
  }

  private clamp(value: number, min: number, max: number) {
    if (Number.isNaN(value)) {
      return min;
    }

    return Math.min(max, Math.max(min, value));
  }
}

export const geminiService = new GeminiService();

function getStandaloneErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  try {
    return JSON.stringify(error);
  } catch {
    return "Unknown Gemini error";
  }
}

function parseGoogleError(value: string): {
  error?: {
    code?: number;
    message?: string;
    status?: string;
    details?: unknown;
  };
} | null {
  const start = value.indexOf("{");
  const end = value.lastIndexOf("}");

  if (start === -1 || end === -1 || end <= start) {
    return null;
  }

  try {
    const parsed = JSON.parse(value.slice(start, end + 1)) as {
      error?: {
        code?: number;
        message?: string;
        status?: string;
        details?: unknown;
      };
    };

    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}
