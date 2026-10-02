import React, { useState } from "react";
import {
  BrainCircuit,
  FileCode,
  Layers,
  Network,
  Sparkles,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import type {
  FrontendDifficulty,
  FrontendPillar,
} from "@/services/frontend-mastery/types";

interface TabMockGeneratorProps {
  onGenerateMock: (
    pillar: FrontendPillar,
    difficulty: FrontendDifficulty,
    customScenario: string
  ) => Promise<void>;
  isGenerating?: boolean;
  targetCompany?: string;
  targetRole?: string;
}

const PRESET_MOCKS = [
  {
    pillar: "javascript" as FrontendPillar,
    difficulty: "staff" as FrontendDifficulty,
    title: "High-Frequency State & Microtask Throttling",
    scenario: "Implement an ultra-resilient microtask batching engine for a real-time trading dashboard. It must batch high-frequency WebSocket updates using queueMicrotask without dropping 120fps frames or causing layout thrashing.",
  },
  {
    pillar: "react" as FrontendPillar,
    difficulty: "senior" as FrontendDifficulty,
    title: "Streaming Token Reader with AbortController",
    scenario: "Build a React component that consumes a live LLM token stream (Server-Sent Events) with pause, resume, and instant abort capabilities. Prevent stale closures and unmounted memory leaks.",
  },
  {
    pillar: "system_design" as FrontendPillar,
    difficulty: "staff" as FrontendDifficulty,
    title: "Offline-First Collaborative Canvas (Figma / Miro)",
    scenario: "Architect a browser canvas supporting multi-user cursor sync, optimistic shape transformations, CRDT conflict resolution, and offline IndexedDB persistence with background sync.",
  },
  {
    pillar: "concepts" as FrontendPillar,
    difficulty: "staff" as FrontendDifficulty,
    title: "Hydration Mismatches & Edge Streaming in Next.js",
    scenario: "Diagnose and architect solutions for severe hydration mismatches, layout shifts (CLS), and selective hydration boundaries in high-traffic e-commerce product pages.",
  },
];

export function TabMockGenerator({
  onGenerateMock,
  isGenerating,
  targetCompany,
  targetRole,
}: TabMockGeneratorProps) {
  const [pillar, setPillar] = useState<FrontendPillar>("system_design");
  const [difficulty, setDifficulty] = useState<FrontendDifficulty>("staff");
  const [scenarioPrompt, setScenarioPrompt] = useState<string>(() => {
    if (targetCompany) {
      return `Simulate a comprehensive Senior/Staff Frontend Technical Loop tailored for ${targetCompany}. Target role: ${targetRole || "Senior Frontend Engineer"}. Focus on high-scale frontend architecture, state synchronization, reactive streaming performance, and production fault tolerance.`;
    }
    return "";
  });

  const handleApplyPreset = (preset: (typeof PRESET_MOCKS)[0]) => {
    setPillar(preset.pillar);
    setDifficulty(preset.difficulty);
    setScenarioPrompt(preset.scenario);
  };

  const handleGenerate = async () => {
    if (!scenarioPrompt.trim()) {
      toast.error("Please enter a custom scenario or select a preset challenge.");
      return;
    }
    await onGenerateMock(pillar, difficulty, scenarioPrompt);
  };

  return (
    <div className="space-y-6">
      {/* Introduction Card */}
      <div className="rounded-2xl border border-white/[0.08] bg-[#0C0E18] p-6">
        {targetCompany && (
          <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-xs text-purple-200">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-purple-400 shrink-0" />
              <span>
                Simulating tailored interview for <strong className="text-white font-semibold">{targetCompany}</strong>
                {targetRole ? ` (${targetRole})` : ""}
              </span>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setScenarioPrompt(
                  `Simulate a comprehensive Senior/Staff Frontend Technical Loop tailored for ${targetCompany}. Target role: ${targetRole || "Senior Frontend Engineer"}. Focus on high-scale frontend architecture, state synchronization, reactive streaming performance, and production fault tolerance.`
                );
                toast.success(`Prompt seeded for ${targetCompany}!`);
              }}
              className="h-7 text-xs px-2.5 rounded-lg border-purple-500/40 text-purple-200 bg-[#131726] hover:bg-purple-500/20"
            >
              Reset to {targetCompany} Scenario
            </Button>
          </div>
        )}

        <div className="flex items-center gap-3">
          <div className="rounded-xl border border-indigo-500/30 bg-indigo-500/10 p-2.5 text-indigo-400">
            <BrainCircuit className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">
              Bespoke Big Tech Mock Interview Generator
            </h2>
            <p className="text-xs text-zinc-400">
              Need to simulate a specific interview scenario or prepare for an upcoming technical loop?
              Configure your requirements and Vertex AI will generate a tailored, unscripted challenge with custom rubric parameters.
            </p>
          </div>
        </div>

        {/* Configuration Controls */}
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Pillar Selector */}
          <div>
            <label className="text-xs font-semibold text-zinc-300">Target Pillar</label>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {[
                { id: "concepts", label: "Core Concepts", icon: Layers },
                { id: "javascript", label: "JavaScript Drills", icon: FileCode },
                { id: "react", label: "React Components", icon: Zap },
                { id: "system_design", label: "System Design", icon: Network },
              ].map((p) => {
                const Icon = p.icon;
                const isSelected = pillar === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPillar(p.id as FrontendPillar)}
                    className={`flex items-center gap-2 rounded-xl border p-2.5 text-xs font-medium transition-all ${
                      isSelected
                        ? "border-indigo-500 bg-indigo-500/10 text-white shadow-sm"
                        : "border-[#22283E] bg-[#131726]/60 text-zinc-400 hover:text-white"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5 text-indigo-400" />
                    <span>{p.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Difficulty Bar */}
          <div>
            <label className="text-xs font-semibold text-zinc-300">Seniority Bar</label>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {[
                { id: "mid", label: "L4 • Mid Engineer" },
                { id: "senior", label: "L5 • Senior Engineer" },
                { id: "staff", label: "L6 • Staff Architect" },
              ].map((d) => {
                const isSelected = difficulty === d.id;
                return (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => setDifficulty(d.id as FrontendDifficulty)}
                    className={`rounded-xl border p-2.5 text-xs font-medium transition-all text-center ${
                      isSelected
                        ? "border-indigo-500 bg-indigo-500/10 text-white shadow-sm"
                        : "border-[#22283E] bg-[#131726]/60 text-zinc-400 hover:text-white"
                    }`}
                  >
                    {d.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Custom Scenario Prompt Input */}
        <div className="mt-6">
          <label className="text-xs font-semibold text-zinc-300">
            Custom Scenario / Specific Technical Focus
          </label>
          <p className="text-[11px] text-zinc-500 mt-0.5">
            Describe the problem or target company (e.g. OpenAI real-time streaming, Meta high-frequency feed, Google Docs OT sync).
          </p>
          <Textarea
            value={scenarioPrompt}
            onChange={(e) => setScenarioPrompt(e.target.value)}
            rows={4}
            placeholder="e.g. Implement a reactive state container with selective subscriptions and time-travel debugging. Must prevent memory leaks and handle 10,000 dispatches per second..."
            className="mt-2 bg-[#08090C] text-xs font-mono text-zinc-200 border-[#22283E] focus:border-indigo-500 resize-none"
          />
        </div>

        {/* Generate Button */}
        <div className="mt-4 flex items-center justify-end">
          <Button
            disabled={isGenerating}
            onClick={handleGenerate}
            className="bg-indigo-600 text-white hover:bg-indigo-500 font-semibold text-xs shadow-lg shadow-indigo-500/20"
          >
            {isGenerating ? (
              <>
                <Sparkles className="mr-2 h-4 w-4 animate-spin text-white" />
                <span>Architecting Challenge with Vertex AI...</span>
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-3.5 w-3.5" />
                <span>Generate & Enter Arena</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Preset Inspirations */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-3">
          Popular Big Tech Scenarios (1-Click Presets)
        </h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {PRESET_MOCKS.map((preset, idx) => (
            <div
              key={idx}
              className="flex flex-col justify-between rounded-xl border border-white/[0.08] bg-[#0C0E18] p-4 transition-all hover:border-indigo-500/30"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold uppercase text-indigo-400">
                    {preset.pillar.replace("_", " ")}
                  </span>
                  <span className="rounded-md border border-purple-500/20 bg-purple-500/10 px-2 py-0.5 text-[10px] text-purple-300">
                    {preset.difficulty.toUpperCase()}
                  </span>
                </div>
                <h4 className="mt-2 text-sm font-semibold text-white">{preset.title}</h4>
                <p className="mt-1 text-xs text-zinc-400 line-clamp-3 leading-relaxed">
                  {preset.scenario}
                </p>
              </div>

              <div className="mt-4 border-t border-white/[0.05] pt-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleApplyPreset(preset)}
                  className="h-7 w-full text-xs text-indigo-300 hover:bg-indigo-500/10 hover:text-white"
                >
                  Use This Scenario
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
