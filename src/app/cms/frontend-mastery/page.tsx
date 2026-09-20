"use client";

import React, { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BrainCircuit,
  Compass,
  History,
  Zap,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useRegisterCmsPageContext } from "@/lib/cms-page-context";
import {
  getFrontendMasteryOverview,
  startOrGetChallengeSession,
  submitChallengeSession,
  retryChallengeSession,
  createCustomMockInterview,
} from "@/services/frontend-mastery/actions";
import type {
  FrontendDifficulty,
  FrontendMasterySession,
  FrontendPillar,
} from "@/services/frontend-mastery/types";
import { StatsHeader } from "./components/stats-header";
import { TabCurriculum } from "./components/tab-curriculum";
import { TabArena } from "./components/tab-arena";
import { TabMockGenerator } from "./components/tab-mock-generator";
import { TabHistory } from "./components/tab-history";

export default function CmsFrontendMasteryPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<string>("curriculum");
  const [currentSession, setCurrentSession] = useState<FrontendMasterySession | null>(null);
  const [startingTopicId, setStartingTopicId] = useState<string | null>(null);
  const [isLoadingSession, setIsLoadingSession] = useState<boolean>(false);
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [isGeneratingMock, setIsGeneratingMock] = useState<boolean>(false);

  // 1. Fetch Overview & Progress Data
  const { data: overview } = useQuery({
    queryKey: ["frontend-mastery-overview"],
    queryFn: () => getFrontendMasteryOverview(),
  });

  // Derive effective active session
  const activeSession = currentSession ?? overview?.activeSession ?? null;

  // 2. Register with CMS Copilot Context
  useRegisterCmsPageContext(
    useMemo(() => {
      return {
        pageTitle: "Career Hub - Frontend Mastery Gym",
        summary: `Frontend Mastery interview simulation based on OpenAI/Meta/Google bar. Mastered: ${
          overview?.stats.totalMastered ?? 0
        }/${overview?.stats.totalTopics ?? 36} topics. Average Score: ${
          overview?.stats.averageScore ?? 0
        }%. Active Session: ${activeSession?.topicTitle ?? "None"}.`,
        filters: { activeTab },
        activeItems: activeSession
          ? [
              {
                id: activeSession.id,
                name: activeSession.topicTitle,
                details: `Pillar: ${activeSession.pillar}, Level: ${activeSession.difficulty}, Status: ${activeSession.status}`,
              },
            ]
          : [],
      };
    }, [overview, activeSession, activeTab])
  );

  // 3. Start or Resume Topic Challenge
  const handleStartTopic = async (topicId: string, difficulty: FrontendDifficulty) => {
    try {
      setStartingTopicId(topicId);
      setIsLoadingSession(true);
      const session = await startOrGetChallengeSession(topicId, difficulty);
      setCurrentSession(session);
      setActiveTab("arena");
      await queryClient.invalidateQueries({ queryKey: ["frontend-mastery-overview"] });
      toast.success(`Challenge loaded: ${session.topicTitle}`);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Failed to load challenge.";
      toast.error(errorMsg);
    } finally {
      setIsLoadingSession(false);
      setStartingTopicId(null);
    }
  };

  // 4. Submit Answer for Evaluation
  const handleSubmitAnswer = async (
    sessionId: string,
    userCode: string,
    timeSpentSeconds: number
  ) => {
    try {
      setIsEvaluating(true);
      const updated = await submitChallengeSession(sessionId, userCode, timeSpentSeconds);
      setCurrentSession(updated);
      await queryClient.invalidateQueries({ queryKey: ["frontend-mastery-overview"] });
      toast.success(
        `Evaluation complete! Score: ${updated.score ?? 0}% (${updated.evaluationResult?.verdict.replace("_", " ").toUpperCase()})`
      );
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Evaluation failed.";
      toast.error(errorMsg);
    } finally {
      setIsEvaluating(false);
    }
  };

  // 5. Retry Session with Fresh Variation
  const handleRetrySession = async (topicId: string, difficulty: FrontendDifficulty) => {
    try {
      setIsLoadingSession(true);
      const freshSession = await retryChallengeSession(topicId, difficulty);
      setCurrentSession(freshSession);
      setActiveTab("arena");
      await queryClient.invalidateQueries({ queryKey: ["frontend-mastery-overview"] });
      toast.success(`Refreshed challenge variation for ${freshSession.topicTitle}`);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Failed to retry challenge.";
      toast.error(errorMsg);
    } finally {
      setIsLoadingSession(false);
    }
  };

  // 6. Generate Custom Bespoke Mock Interview
  const handleGenerateCustomMock = async (
    pillar: FrontendPillar,
    difficulty: FrontendDifficulty,
    customScenario: string
  ) => {
    try {
      setIsGeneratingMock(true);
      const mockSession = await createCustomMockInterview(pillar, difficulty, customScenario);
      setCurrentSession(mockSession);
      setActiveTab("arena");
      await queryClient.invalidateQueries({ queryKey: ["frontend-mastery-overview"] });
      toast.success("Bespoke mock interview generated! Entering arena.");
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Failed to generate mock.";
      toast.error(errorMsg);
    } finally {
      setIsGeneratingMock(false);
    }
  };

  // 7. Select Session from History
  const handleSelectHistorySession = (session: FrontendMasterySession) => {
    setCurrentSession(session);
    setActiveTab("arena");
  };

  return (
    <div className="space-y-6">
      {/* Top Stats Banner */}
      <StatsHeader
        stats={
          overview?.stats ?? {
            totalTopics: 36,
            totalMastered: 0,
            totalPracticing: 0,
            averageScore: 0,
            completedDrillsCount: 0,
          }
        }
        isAiGenerating={isLoadingSession || isEvaluating || isGeneratingMock}
      />

      {/* Main Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="h-11 border border-white/[0.08] bg-[#0C0E18] p-1">
          <TabsTrigger
            value="curriculum"
            className="gap-2 text-xs data-[state=active]:bg-indigo-600 data-[state=active]:text-white"
          >
            <Compass className="h-3.5 w-3.5" />
            <span>Curriculum Roadmap</span>
            <span className="rounded-full bg-black/40 px-1.5 py-0.2 text-[10px]">
              {overview?.topics.length ?? 36}
            </span>
          </TabsTrigger>

          <TabsTrigger
            value="arena"
            className="gap-2 text-xs data-[state=active]:bg-indigo-600 data-[state=active]:text-white"
          >
            <Zap className="h-3.5 w-3.5" />
            <span>Interactive Arena</span>
            {activeSession && activeSession.status === "in_progress" && (
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            )}
          </TabsTrigger>

          <TabsTrigger
            value="mock-generator"
            className="gap-2 text-xs data-[state=active]:bg-indigo-600 data-[state=active]:text-white"
          >
            <BrainCircuit className="h-3.5 w-3.5" />
            <span>Mock Generator</span>
          </TabsTrigger>

          <TabsTrigger
            value="history"
            className="gap-2 text-xs data-[state=active]:bg-indigo-600 data-[state=active]:text-white"
          >
            <History className="h-3.5 w-3.5" />
            <span>Drill Archive</span>
            <span className="rounded-full bg-black/40 px-1.5 py-0.2 text-[10px]">
              {overview?.recentSessions.length ?? 0}
            </span>
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Curriculum Roadmap */}
        <TabsContent value="curriculum" className="m-0 focus-visible:outline-none">
          <TabCurriculum
            pillars={overview?.pillars ?? []}
            topics={overview?.topics ?? []}
            progressByTopic={overview?.progressByTopic ?? {}}
            activeSessionTopicId={
              activeSession?.status === "in_progress" ? activeSession.topicId : null
            }
            onStartTopic={handleStartTopic}
            isLoadingSession={isLoadingSession}
            selectedTopicIdStarting={startingTopicId}
          />
        </TabsContent>

        {/* Tab 2: Interactive Arena */}
        <TabsContent value="arena" className="m-0 focus-visible:outline-none">
          <TabArena
            session={activeSession}
            onSubmitAnswer={handleSubmitAnswer}
            onBackToCurriculum={() => setActiveTab("curriculum")}
            onRetrySession={handleRetrySession}
            isEvaluating={isEvaluating}
          />
        </TabsContent>

        {/* Tab 3: Mock Interview Generator */}
        <TabsContent value="mock-generator" className="m-0 focus-visible:outline-none">
          <TabMockGenerator
            onGenerateMock={handleGenerateCustomMock}
            isGenerating={isGeneratingMock}
          />
        </TabsContent>

        {/* Tab 4: History & Archives */}
        <TabsContent value="history" className="m-0 focus-visible:outline-none">
          <TabHistory
            sessions={overview?.recentSessions ?? []}
            onSelectSession={handleSelectHistorySession}
            onRetryTopic={handleStartTopic}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
