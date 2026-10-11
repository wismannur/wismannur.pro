"use server";

import { assertAdmin } from "../core/auth-guard";
import { getGeminiClient, getGeminiModel } from "@/lib/gemini";
import { synthesizeNeuralSpeech, type SynthesizeOptions } from "./tts";

/**
 * Server action to generate ultra-realistic native English audio using Google Cloud Journey neural voices.
 */
export async function getNeuralSpeechAudio(
  text: string,
  options?: SynthesizeOptions
): Promise<{ audioUrl: string | null; error?: string }> {
  await assertAdmin();
  return synthesizeNeuralSpeech(text, options);
}

/**
 * Transcribes user speech from an audio recording using Gemini's native multimodal capabilities.
 * Serves as a rock-solid, browser-independent fallback for Brave, Safari, Firefox, or mobile environments.
 */
export async function transcribeSpokenAudio(
  base64Audio: string,
  mimeType = "audio/webm"
): Promise<{ transcript: string }> {
  await assertAdmin();

  if (!base64Audio || base64Audio.length < 50) {
    return { transcript: "" };
  }

  const ai = getGeminiClient();
  const modelName = getGeminiModel();

  // Strip data:audio/xxx;base64, if present
  const cleanBase64 = base64Audio.includes("base64,")
    ? base64Audio.split("base64,")[1]
    : base64Audio;

  const prompt = `You are a high-accuracy English speech-to-text transcriber for a software engineer practicing speaking drills.
Transcribe the English speech in this audio recording accurately.
Guidelines:
- Return ONLY the exact transcribed text spoken in the audio.
- Accurately capture technical engineering terminology (e.g., Kubernetes, Redis, Docker, microservices, latency, throughput, PR, API, PostgreSQL).
- Do not include conversational commentary, explanations, labels, or quotation marks.
- If there is no speech or only background silence/noise, return an empty string.`;

  const response = await ai.models.generateContent({
    model: modelName,
    contents: [
      {
        inlineData: {
          mimeType: mimeType || "audio/webm",
          data: cleanBase64,
        },
      },
      {
        text: prompt,
      },
    ],
  });

  const transcript = response.text?.trim() || "";
  return { transcript };
}

/**
 * Synthesizes neural audio for a specific character dialogue line in curriculum role-play.
 */
export async function synthesizeDialogueLine(params: {
  text: string;
  speaker: string;
}): Promise<{ audioUrl: string | null }> {
  await assertAdmin();

  let voice = "en-US-Journey-D";
  const lowerSpeaker = params.speaker.toLowerCase();
  if (lowerSpeaker.includes("sarah") || lowerSpeaker.includes("maria")) {
    voice = "en-US-Journey-F";
  } else if (lowerSpeaker.includes("alex") || lowerSpeaker.includes("hiring")) {
    voice = "en-US-Neural2-A";
  } else if (lowerSpeaker.includes("david")) {
    voice = "en-US-Journey-D";
  } else if (lowerSpeaker.includes("tom")) {
    voice = "en-US-Studio-O";
  }

  try {
    const speech = await synthesizeNeuralSpeech(params.text, { voice, speakingRate: 0.98 });
    return { audioUrl: speech.audioUrl };
  } catch (err) {
    console.warn("Dialogue line TTS failed:", err);
    return { audioUrl: null };
  }
}
