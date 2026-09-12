"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";
import {
  getNeuralSpeechAudio,
  transcribeSpokenAudio,
} from "@/services/ai-english-fluency/actions";

// In-memory cache for audio base64 URLs
const audioCache = new Map<string, string>();

// Web Speech API interface definitions
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message?: string;
}

interface ISpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition?: new () => ISpeechRecognition;
    webkitSpeechRecognition?: new () => ISpeechRecognition;
  }
}

export interface VoiceOption {
  id: string;
  label: string;
  gender: "male" | "female";
  style: string;
}

export const NEURAL_VOICE_OPTIONS: VoiceOption[] = [
  {
    id: "en-US-Journey-D",
    label: "David (American Male - Conversational Tech Lead)",
    gender: "male",
    style: "Warm, natural, confident",
  },
  {
    id: "en-US-Journey-F",
    label: "Sarah (American Female - Articulate Executive)",
    gender: "female",
    style: "Clear, fluent, friendly",
  },
  {
    id: "en-US-Journey-O",
    label: "Olivia (American Female - Tech Podcaster)",
    gender: "female",
    style: "Lively, engaging cadence",
  },
  {
    id: "en-US-Neural2-J",
    label: "James (American Male - Executive Architect)",
    gender: "male",
    style: "Deep, calm, professional",
  },
];

/**
 * Hook for ultra-realistic Text-to-Speech using Google Cloud Neural Journey voices,
 * with automatic caching and seamless browser voice fallback.
 */
export function useTextToSpeech() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [rate, setRate] = useState(0.95);
  const [selectedVoice, setSelectedVoice] = useState<string>("en-US-Journey-D");
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);

  const stop = useCallback(() => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current.currentTime = 0;
      currentAudioRef.current = null;
    }
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlaying(false);
    setIsLoadingAudio(false);
  }, []);

  const speakWithBrowser = useCallback(
    (text: string, customRate?: number) => {
      if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "en-US";
      utterance.rate = customRate ?? rate;

      const voices = window.speechSynthesis.getVoices();
      const preferredVoice =
        voices.find((v) => v.name.includes("Natural") || v.name.includes("Enhanced") || v.name.includes("Premium")) ||
        voices.find((v) => v.lang === "en-US" && v.name.includes("Google")) ||
        voices.find((v) => v.lang.startsWith("en-US")) ||
        voices.find((v) => v.lang.startsWith("en"));

      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      utterance.onstart = () => setIsPlaying(true);
      utterance.onend = () => setIsPlaying(false);
      utterance.onerror = () => setIsPlaying(false);

      window.speechSynthesis.speak(utterance);
    },
    [rate]
  );

  const speak = useCallback(
    async (text: string, options?: { voice?: string; rate?: number }) => {
      stop();
      if (!text.trim()) return;

      const voice = options?.voice || selectedVoice;
      const currentRate = options?.rate ?? rate;
      const cacheKey = `${voice}_${currentRate}_${text.trim()}`;

      // 1. Play from instant memory cache if available
      if (audioCache.has(cacheKey)) {
        const cachedUrl = audioCache.get(cacheKey)!;
        const audio = new Audio(cachedUrl);
        currentAudioRef.current = audio;
        audio.onplay = () => setIsPlaying(true);
        audio.onended = () => {
          setIsPlaying(false);
          currentAudioRef.current = null;
        };
        audio.onerror = () => {
          speakWithBrowser(text, currentRate);
        };
        audio.play().catch(() => speakWithBrowser(text, currentRate));
        return;
      }

      // 2. Fetch Google Cloud Neural Journey voice
      setIsLoadingAudio(true);
      try {
        const result = await getNeuralSpeechAudio(text.trim(), {
          voice,
          speakingRate: currentRate,
        });

        if (result.audioUrl) {
          audioCache.set(cacheKey, result.audioUrl);
          const audio = new Audio(result.audioUrl);
          currentAudioRef.current = audio;

          audio.onplay = () => {
            setIsPlaying(true);
            setIsLoadingAudio(false);
          };
          audio.onended = () => {
            setIsPlaying(false);
            currentAudioRef.current = null;
          };
          audio.onerror = () => {
            setIsLoadingAudio(false);
            speakWithBrowser(text, currentRate);
          };

          await audio.play();
        } else {
          setIsLoadingAudio(false);
          speakWithBrowser(text, currentRate);
        }
      } catch (err) {
        console.warn("Neural audio synthesis failed, using fallback:", err);
        setIsLoadingAudio(false);
        speakWithBrowser(text, currentRate);
      }
    },
    [selectedVoice, rate, stop, speakWithBrowser]
  );

  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  return {
    speak,
    stop,
    isPlaying,
    isLoadingAudio,
    rate,
    setRate,
    selectedVoice,
    setSelectedVoice,
    availableVoices: NEURAL_VOICE_OPTIONS,
  };
}

/**
 * Hook for Speech-to-Text (STT) recording using Web Speech Recognition.
 * Includes auto-reconnect on pauses/silence, pre-flight microphone permission checks,
 * and friendly error notifications (e.g. for Brave/Chromium localhost restrictions).
 */
/**
 * Hook for Speech-to-Text (STT) recording with dual-engine architecture:
 * 1. Web Speech API (real-time interim/final transcription in Chrome)
 * 2. MediaStream & MediaRecorder with Gemini Multimodal AI fallback (Brave, Arc, Safari, Firefox)
 * 3. Real-time Audio Meter (0-100 decibel volume scale via AudioContext & AnalyserNode)
 * 4. User Speech Audio Playback preview
 */
export function useSpeechRecognition() {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0); // 0 - 100
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [recordedAudioBase64, setRecordedAudioBase64] = useState<string | null>(null);
  const [recordedMimeType, setRecordedMimeType] = useState<string>("audio/webm");
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isSupported] = useState(true);

  const recognitionRef = useRef<ISpeechRecognition | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isUserRecordingRef = useRef(false);
  const accumulatedTranscriptRef = useRef("");

  // MediaStream & AnalyserNode refs
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const webSpeechFailedRef = useRef(false);

  // Initialize Web Speech API if supported
  useEffect(() => {
    if (typeof window === "undefined") return;
    const SpeechRecognitionClass =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognitionClass) {
      // Even without Web Speech, MediaRecorder + Gemini works everywhere!
      return;
    }

    try {
      const recognition = new SpeechRecognitionClass();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let currentInterim = "";
        let finalChunk = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const res = event.results[i];
          if (res.isFinal) {
            finalChunk += res[0].transcript + " ";
          } else {
            currentInterim += res[0].transcript;
          }
        }

        if (finalChunk) {
          accumulatedTranscriptRef.current = (
            accumulatedTranscriptRef.current +
            " " +
            finalChunk
          ).trim();
        }

        const combined = (
          accumulatedTranscriptRef.current +
          (currentInterim ? " " + currentInterim : "")
        ).trim();

        setTranscript(combined);
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.warn("Speech recognition notice:", event.error);

        // 'no-speech' is triggered when the user pauses
        if (event.error === "no-speech") {
          return;
        }

        if (event.error === "not-allowed" || event.error === "audio-capture") {
          webSpeechFailedRef.current = true;
          return;
        }

        // On Brave or restricted Chromium where Google services are disabled:
        if (event.error === "network" || event.error === "service-not-allowed") {
          webSpeechFailedRef.current = true;
          console.info(
            "Web Speech service unavailable. Native audio recording is active and will transcribe via Gemini AI upon stop."
          );
        }
      };

      recognition.onend = () => {
        if (isUserRecordingRef.current) {
          try {
            recognition.start();
          } catch {
            // Browser in transition
          }
        }
      };

      recognitionRef.current = recognition;
    } catch (err) {
      console.warn("Failed to initialize speech recognition:", err);
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isUserRecordingRef.current = false;
      if (timerRef.current) clearInterval(timerRef.current);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (audioContextRef.current && audioContextRef.current.state !== "closed") {
        audioContextRef.current.close().catch(() => {});
      }
    };
  }, []);

  const transcribeWithAi = useCallback(
    async (customBase64?: string, customMime?: string) => {
      const b64 = customBase64 || recordedAudioBase64;
      const mime = customMime || recordedMimeType || "audio/webm";
      if (!b64) {
        toast.warning("No audio recorded yet to transcribe.");
        return;
      }

      setIsTranscribing(true);
      try {
        const res = await transcribeSpokenAudio(b64, mime);
        if (res.transcript && res.transcript.trim()) {
          setTranscript(res.transcript.trim());
          accumulatedTranscriptRef.current = res.transcript.trim();
          toast.success("Speech transcribed with Gemini AI!");
        } else {
          toast.info("No audible speech detected in the audio.");
        }
      } catch (err) {
        console.error("AI Transcription failed:", err);
        toast.error("Failed to transcribe audio with Gemini AI.");
      } finally {
        setIsTranscribing(false);
      }
    },
    [recordedAudioBase64, recordedMimeType]
  );

  const startRecording = useCallback(async () => {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      toast.error("Microphone access is not supported on this device/browser.");
      return;
    }

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
    } catch (err) {
      console.warn("Microphone permission denied:", err);
      toast.error("Please allow microphone access to record your English response.");
      return;
    }

    // 1. Audio Level Meter (AudioContext + AnalyserNode)
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        audioContextRef.current = ctx;
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 128;
        analyser.smoothingTimeConstant = 0.4;
        analyserRef.current = analyser;
        const source = ctx.createMediaStreamSource(stream);
        source.connect(analyser);

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        const updateMeter = () => {
          if (!isUserRecordingRef.current) return;
          analyser.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
          }
          const avg = sum / dataArray.length;
          // Normal speaking average in human voice is 10-65
          const normalized = Math.min(100, Math.round((avg / 65) * 100));
          setAudioLevel(normalized);
          animFrameRef.current = requestAnimationFrame(updateMeter);
        };
        animFrameRef.current = requestAnimationFrame(updateMeter);
      }
    } catch (e) {
      console.warn("AudioContext setup error:", e);
    }

    // 2. MediaRecorder setup for robust recording & Gemini fallback
    try {
      audioChunksRef.current = [];
      const preferredMime =
        typeof MediaRecorder !== "undefined" &&
        MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
          ? "audio/webm;codecs=opus"
          : typeof MediaRecorder !== "undefined" &&
            MediaRecorder.isTypeSupported("audio/webm")
          ? "audio/webm"
          : typeof MediaRecorder !== "undefined" &&
            MediaRecorder.isTypeSupported("audio/mp4")
          ? "audio/mp4"
          : "";

      const recorder = preferredMime
        ? new MediaRecorder(stream, { mimeType: preferredMime })
        : new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const mime = recorder.mimeType || preferredMime || "audio/webm";
        const blob = new Blob(audioChunksRef.current, { type: mime });
        if (blob.size > 0) {
          const url = URL.createObjectURL(blob);
          setRecordedAudioUrl(url);
          setRecordedMimeType(mime);

          const reader = new FileReader();
          reader.onloadend = () => {
            const base64 = reader.result as string;
            setRecordedAudioBase64(base64);

            // Auto-fallback: if Web Speech produced no text or failed, trigger Gemini
            if (
              webSpeechFailedRef.current ||
              !accumulatedTranscriptRef.current.trim()
            ) {
              transcribeWithAi(base64, mime);
            }
          };
          reader.readAsDataURL(blob);
        }
      };

      recorder.start(250);
    } catch (e) {
      console.warn("MediaRecorder error:", e);
    }

    // 3. Reset states & start timer
    accumulatedTranscriptRef.current = "";
    setTranscript("");
    setRecordingSeconds(0);
    setRecordedAudioUrl(null);
    setRecordedAudioBase64(null);
    webSpeechFailedRef.current = false;
    isUserRecordingRef.current = true;
    setIsRecording(true);

    // 4. Start Web Speech recognition if available
    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.warn("Speech recognition start:", e);
      }
    }

    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setRecordingSeconds((prev) => prev + 1);
    }, 1000);
  }, [transcribeWithAi]);

  const stopRecording = useCallback(() => {
    isUserRecordingRef.current = false;
    setIsRecording(false);
    setAudioLevel(0);

    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.warn("Stop recognition error:", e);
      }
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {
        console.warn("Stop mediaRecorder error:", e);
      }
    }

    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      try {
        audioContextRef.current.close();
      } catch {}
      audioContextRef.current = null;
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
  }, []);

  const resetTranscript = useCallback(() => {
    accumulatedTranscriptRef.current = "";
    setTranscript("");
    setRecordingSeconds(0);
    setRecordedAudioUrl(null);
    setRecordedAudioBase64(null);
    setAudioLevel(0);
  }, []);

  return {
    isRecording,
    transcript,
    setTranscript,
    recordingSeconds,
    audioLevel,
    recordedAudioUrl,
    recordedAudioBase64,
    isTranscribing,
    isSupported,
    startRecording,
    stopRecording,
    resetTranscript,
    transcribeWithAi,
  };
}
