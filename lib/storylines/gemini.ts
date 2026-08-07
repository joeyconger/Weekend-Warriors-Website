import { GoogleGenAI } from "@google/genai";
import type { StorylineFacts } from "./types";
import { factsToPrompt } from "./prompt";
import { fallbackBody } from "./fallback";

const DEFAULT_MODEL = "gemini-2.5-flash";

export interface GenerationResult {
  body: string;
  source: "gemini" | "template";
}

/**
 * Generates a storyline's body text via Gemini's free-tier Flash model,
 * falling back to a deterministic template if the API key is missing, the
 * call fails, or the free-tier rate limit is hit — the Storylines tab
 * should never show nothing.
 */
export async function generateStorylineBody(facts: StorylineFacts): Promise<GenerationResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return { body: fallbackBody(facts), source: "template" };
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: process.env.GEMINI_MODEL || DEFAULT_MODEL,
      contents: factsToPrompt(facts),
    });
    const text = response.text?.trim();
    if (!text) throw new Error("Gemini returned an empty response");
    return { body: text, source: "gemini" };
  } catch (err) {
    console.error("Gemini generation failed, using template fallback:", err);
    return { body: fallbackBody(facts), source: "template" };
  }
}
