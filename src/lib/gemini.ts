import fs from "node:fs";
import path from "node:path";
import { GoogleGenAI } from "@google/genai";

let cachedClient: GoogleGenAI | null = null;

function loadServiceAccountCredentials(): Record<string, unknown> | null {
  // 1. Check raw JSON string from environment variable (Best for Vercel)
  if (process.env.GCP_SERVICE_ACCOUNT_KEY) {
    try {
      return JSON.parse(process.env.GCP_SERVICE_ACCOUNT_KEY);
    } catch (err) {
      console.error("Failed to parse GCP_SERVICE_ACCOUNT_KEY JSON:", err);
    }
  }

  // 2. Check Base64-encoded JSON from environment variable
  if (process.env.GCP_SERVICE_ACCOUNT_BASE64) {
    try {
      const decoded = Buffer.from(process.env.GCP_SERVICE_ACCOUNT_BASE64, "base64").toString(
        "utf-8"
      );
      return JSON.parse(decoded);
    } catch (err) {
      console.error("Failed to parse GCP_SERVICE_ACCOUNT_BASE64 JSON:", err);
    }
  }

  // 3. Check file path from GOOGLE_APPLICATION_CREDENTIALS
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    const filePath = path.isAbsolute(process.env.GOOGLE_APPLICATION_CREDENTIALS)
      ? process.env.GOOGLE_APPLICATION_CREDENTIALS
      : path.resolve(process.cwd(), process.env.GOOGLE_APPLICATION_CREDENTIALS);

    if (fs.existsSync(filePath)) {
      try {
        return JSON.parse(fs.readFileSync(filePath, "utf-8"));
      } catch (err) {
        console.error("Failed to read GOOGLE_APPLICATION_CREDENTIALS file:", err);
      }
    }
  }

  // 4. Check local default path (secrets/service.json)
  const localSecretPath = path.resolve(process.cwd(), "secrets/service.json");
  if (fs.existsSync(localSecretPath)) {
    try {
      return JSON.parse(fs.readFileSync(localSecretPath, "utf-8"));
    } catch (err) {
      console.error("Failed to read local secrets/service.json:", err);
    }
  }

  return null;
}

/**
 * Initializes and returns a GoogleGenAI client configured for Vertex AI (GCP)
 * or Google AI Studio (API Key) based on environment variables.
 */
export function getGeminiClient(): GoogleGenAI {
  if (cachedClient) {
    return cachedClient;
  }

  const useVertex =
    process.env.USE_VERTEX_AI === "true" || process.env.NEXT_PUBLIC_USE_VERTEX_AI === "true";

  if (useVertex) {
    const credentials = loadServiceAccountCredentials();
    const projectId =
      process.env.GOOGLE_CLOUD_PROJECT ||
      process.env.GCP_PROJECT_ID ||
      (credentials?.project_id as string | undefined) ||
      "wismannur-person-1787504146495";

    // Global location supports Gemini 3.7 Flash, 2.5 Flash, and latest models
    const location = process.env.GOOGLE_CLOUD_LOCATION || "global";

    if (credentials) {
      cachedClient = new GoogleGenAI({
        vertexai: true,
        project: projectId,
        location,
        googleAuthOptions: {
          credentials,
        },
      } as Record<string, unknown>);
    } else {
      cachedClient = new GoogleGenAI({
        vertexai: true,
        project: projectId,
        location,
      });
    }

    return cachedClient;
  }

  // Fallback to Google AI Studio via API Key
  const apiKey =
    process.env.GEMINI_API_KEY || process.env.GOOGLE_GENAI_API_KEY || process.env.GOOGLE_API_KEY;

  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY / GOOGLE_GENAI_API_KEY is not set. Please provide a Gemini API key or enable USE_VERTEX_AI in environment variables."
    );
  }

  cachedClient = new GoogleGenAI({ apiKey });
  return cachedClient;
}

/**
 * Resolves the default model name (defaults to gemini-3.7-flash).
 */
export function getGeminiModel(preferredModel?: string): string {
  if (preferredModel) {
    return preferredModel;
  }

  return process.env.GEMINI_MODEL || "gemini-3.7-flash";
}
