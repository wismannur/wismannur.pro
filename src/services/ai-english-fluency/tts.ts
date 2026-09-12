import crypto from "node:crypto";
import { loadServiceAccountCredentials } from "@/lib/gemini";

let cachedAccessToken: string | null = null;
let tokenExpiresAt = 0;

function base64Url(str: string): string {
  return Buffer.from(str).toString("base64url");
}

/**
 * Retrieves a cached or fresh OAuth2 access token using GCP service account credentials.
 */
async function getGcpAccessToken(): Promise<string | null> {
  const now = Math.floor(Date.now() / 1000);
  if (cachedAccessToken && now < tokenExpiresAt - 60) {
    return cachedAccessToken;
  }

  const creds = loadServiceAccountCredentials() as {
    client_email?: string;
    private_key?: string;
    token_uri?: string;
  } | null;

  if (!creds?.client_email || !creds?.private_key) {
    return null;
  }

  const header = { alg: "RS256", typ: "JWT" };
  const claim = {
    iss: creds.client_email,
    scope: "https://www.googleapis.com/auth/cloud-platform",
    aud: creds.token_uri || "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now,
  };

  const tokenPayload = `${base64Url(JSON.stringify(header))}.${base64Url(JSON.stringify(claim))}`;
  const sign = crypto.createSign("RSA-SHA256");
  sign.update(tokenPayload);
  const signature = sign.sign(creds.private_key, "base64url");
  const jwt = `${tokenPayload}.${signature}`;

  const tokenResp = await fetch(creds.token_uri || "https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });

  if (!tokenResp.ok) {
    console.error("Failed to obtain GCP access token for TTS:", await tokenResp.text());
    return null;
  }

  const tokenData = await tokenResp.json();
  cachedAccessToken = tokenData.access_token;
  tokenExpiresAt = now + (tokenData.expires_in || 3600);

  return cachedAccessToken;
}

export type GoogleVoiceId =
  | "en-US-Journey-D" // Male - Conversational Tech Lead
  | "en-US-Journey-F" // Female - Conversational Articulate
  | "en-US-Journey-O" // Female - Clear Podcast
  | "en-US-Neural2-J"; // Male - Executive

export interface SynthesizeOptions {
  voice?: GoogleVoiceId | string;
  speakingRate?: number;
}

/**
 * Synthesizes ultra-natural speech using Google Cloud Neural / Journey voices.
 * Returns a base64 MP3 data URL for instant playback in browser.
 */
export async function synthesizeNeuralSpeech(
  text: string,
  options: SynthesizeOptions = {}
): Promise<{ audioUrl: string | null; error?: string }> {
  try {
    const token = await getGcpAccessToken();
    if (!token) {
      return { audioUrl: null, error: "GCP service account credentials not configured." };
    }

    const voiceName = options.voice || "en-US-Journey-D";
    const speakingRate = options.speakingRate ?? 0.95;

    const response = await fetch("https://texttospeech.googleapis.com/v1/text:synthesize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        input: { text },
        voice: {
          languageCode: "en-US",
          name: voiceName,
        },
        audioConfig: {
          audioEncoding: "MP3",
          speakingRate,
        },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Google Cloud TTS API error:", response.status, errText);
      return { audioUrl: null, error: `TTS API error (${response.status})` };
    }

    const data = await response.json();
    if (!data.audioContent) {
      return { audioUrl: null, error: "No audio content returned." };
    }

    const audioUrl = `data:audio/mp3;base64,${data.audioContent}`;
    return { audioUrl };
  } catch (err) {
    console.error("synthesizeNeuralSpeech error:", err);
    return { audioUrl: null, error: (err as Error).message };
  }
}
