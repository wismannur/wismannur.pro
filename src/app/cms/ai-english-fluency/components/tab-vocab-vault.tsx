"use client";

import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  BookOpen,
  Search,
  Volume2,
  CheckCircle2,
  Trash2,
  Sparkles,
  Plus,
  Loader2,
  Check,
  Lightbulb,
  ChevronLeft,
  ChevronRight,
  Copy,
  Zap,
  Trophy,
  RotateCcw,
  Eye,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTextToSpeech } from "../hooks/use-speech";
import {
  getEnglishVocabularies,
  toggleVocabMastery,
  deleteVocab,
  generateQuickVocabularies,
  saveCustomVocab,
  regenerateVocabExample,
} from "@/services/ai-english-fluency/actions";
import type {
  TargetLevel,
  FluencyCategory,
  VocabExample,
} from "@/services/ai-english-fluency/types";

interface TabVocabVaultProps {
  targetLevel: TargetLevel;
  onVocabUpdated: () => void;
}

export function TabVocabVault({ targetLevel, onVocabUpdated }: TabVocabVaultProps) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  // Dialog states
  const [isAiGenerateOpen, setIsAiGenerateOpen] = useState(false);
  const [aiTopicInput, setAiTopicInput] = useState("");
  const [isGeneratingVocab, setIsGeneratingVocab] = useState(false);

  const [isAddCustomOpen, setIsAddCustomOpen] = useState(false);
  const [customPhrase, setCustomPhrase] = useState("");
  const [customMeaning, setCustomMeaning] = useState("");
  const [customExample, setCustomExample] = useState("");
  const [customCategory, setCustomCategory] = useState<FluencyCategory>("technical");

  const { speak } = useTextToSpeech();

  // Carousel tracking for multiple examples per vocab item
  const [activeExampleIndex, setActiveExampleIndex] = useState<Record<string, number>>({});
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);

  // Handler: Regenerate/Add example
  const handleRegenerateExample = async (vocabId: string) => {
    setRegeneratingId(vocabId);
    try {
      const res = await regenerateVocabExample(vocabId);
      if (res.success && res.examples) {
        // Automatically switch carousel to the newly added example
        setActiveExampleIndex((prev) => ({
          ...prev,
          [vocabId]: res.examples.length - 1,
        }));
        queryClient.invalidateQueries({ queryKey: ["ai-english-vocabularies"] });
        toast.success("New engineering workplace scenario added!");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate new scenario example.");
    } finally {
      setRegeneratingId(null);
    }
  };

  // Copy feedback state
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopyText = async (text: string, key: string, label = "Sentence") => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      toast.success(`${label} copied to clipboard!`);
      setTimeout(() => {
        setCopiedKey((prev) => (prev === key ? null : prev));
      }, 2000);
    } catch (err) {
      console.error(err);
      toast.error("Failed to copy to clipboard.");
    }
  };

  // Query vocabularies
  const {
    data: vocabularies = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["ai-english-vocabularies", statusFilter, categoryFilter, search],
    queryFn: () => getEnglishVocabularies(statusFilter, categoryFilter, search),
  });

  // SRS Flashcard Drill states
  const [isSrsOpen, setIsSrsOpen] = useState(false);
  const [srsIndex, setSrsIndex] = useState(0);
  const [isCardFlipped, setIsCardFlipped] = useState(false);
  const [srsReviewedCount, setSrsReviewedCount] = useState(0);

  // SRS card queue: prioritize "learning" status, otherwise all cards
  const srsCards = useMemo(() => {
    const learning = vocabularies.filter((v) => v.masteryStatus === "learning");
    return learning.length > 0 ? learning : vocabularies;
  }, [vocabularies]);

  const currentSrsCard = srsCards[srsIndex] || null;

  const handleNextSrsCard = (markMastered = false) => {
    if (currentSrsCard && markMastered) {
      toggleMutation.mutate({ id: currentSrsCard.id, newStatus: "mastered" });
      toast.success(`"${currentSrsCard.phrase}" marked as Mastered! 🎉`);
    }
    setIsCardFlipped(false);
    setSrsReviewedCount((prev) => prev + 1);
    setSrsIndex((prev) => prev + 1);
  };

  const handleResetSrs = () => {
    setSrsIndex(0);
    setIsCardFlipped(false);
    setSrsReviewedCount(0);
  };

  const learningCount = useMemo(() => {
    return vocabularies.filter((v) => v.masteryStatus === "learning").length;
  }, [vocabularies]);

  // Toggle mastery mutation
  const toggleMutation = useMutation({
    mutationFn: ({ id, newStatus }: { id: string; newStatus: "learning" | "mastered" }) =>
      toggleVocabMastery(id, newStatus),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ai-english-vocabularies"] });
      queryClient.invalidateQueries({ queryKey: ["ai-english-analytics"] });
      onVocabUpdated();
      toast.success("Mastery status updated!");
    },
    onError: () => {
      toast.error("Failed to update status.");
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteVocab(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ai-english-vocabularies"] });
      queryClient.invalidateQueries({ queryKey: ["ai-english-analytics"] });
      onVocabUpdated();
      toast.success("Phrase removed.");
    },
  });

  // Handler: Generate with AI
  const handleGenerateAiVocab = async () => {
    if (!aiTopicInput.trim()) {
      toast.warning("Please specify a topic or keyword.");
      return;
    }

    setIsGeneratingVocab(true);
    try {
      const newItems = await generateQuickVocabularies(aiTopicInput.trim(), targetLevel);
      toast.success(`Added ${newItems.length} new phrases to your Lexicon!`);
      setIsAiGenerateOpen(false);
      setAiTopicInput("");
      refetch();
      onVocabUpdated();
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate phrases.");
    } finally {
      setIsGeneratingVocab(false);
    }
  };

  // Handler: Save Custom
  const handleSaveCustom = async () => {
    if (!customPhrase.trim() || !customMeaning.trim() || !customExample.trim()) {
      toast.warning("Please fill in phrase, meaning, and example sentence.");
      return;
    }

    try {
      await saveCustomVocab({
        phrase: customPhrase.trim(),
        meaning: customMeaning.trim(),
        techContextExample: customExample.trim(),
        category: customCategory,
        targetLevel,
      });

      toast.success("New phrase saved to your Lexicon!");
      setIsAddCustomOpen(false);
      setCustomPhrase("");
      setCustomMeaning("");
      setCustomExample("");
      refetch();
      onVocabUpdated();
    } catch (err) {
      console.error(err);
      toast.error("Failed to save custom phrase.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Controls & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-2.5" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search phrases, meanings, or keywords..."
              className="pl-9 h-9 text-xs"
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[125px] h-9 text-xs">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="learning">📖 Learning</SelectItem>
              <SelectItem value="mastered">✅ Mastered</SelectItem>
            </SelectContent>
          </Select>

          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[135px] h-9 text-xs">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="technical">⚙️ Technical</SelectItem>
              <SelectItem value="workplace_idiom">💬 Idioms</SelectItem>
              <SelectItem value="collaboration">🤝 Collaboration</SelectItem>
              <SelectItem value="leadership">👑 Leadership</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              handleResetSrs();
              setIsSrsOpen(true);
            }}
            disabled={vocabularies.length === 0}
            className="text-xs h-9 gap-1.5 rounded-xl border-amber-500/40 bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 font-medium"
          >
            <Zap className="w-3.5 h-3.5 fill-current text-amber-500" />
            SRS Flashcards ({learningCount} Due)
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsAddCustomOpen(true)}
            className="text-xs h-9 gap-1.5 rounded-xl border-border/80"
          >
            <Plus className="w-3.5 h-3.5" /> Add Phrase
          </Button>

          <Button
            size="sm"
            onClick={() => setIsAiGenerateOpen(true)}
            className="text-xs h-9 gap-1.5 rounded-xl bg-primary text-white font-medium shadow-sm hover:bg-primary/90"
          >
            <Sparkles className="w-3.5 h-3.5" /> AI Generate 5 Phrases
          </Button>
        </div>
      </div>

      {/* Lexicon Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground text-sm gap-2">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
          Loading your Lexicon Vault...
        </div>
      ) : vocabularies.length === 0 ? (
        <div className="text-center py-16 p-6 rounded-2xl border border-dashed border-border/80 bg-muted/10 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-muted/60 text-muted-foreground flex items-center justify-center mx-auto">
            <BookOpen className="w-6 h-6" />
          </div>
          <h3 className="text-sm md:text-base font-semibold">No phrases found</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Practice speaking drills to automatically extract high-impact tech phrases, or click &quot;AI Generate&quot;
            above to populate your vocabulary bank!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {vocabularies.map((item) => {
            const examples: VocabExample[] =
              item.examples && (item.examples as VocabExample[]).length > 0
                ? (item.examples as VocabExample[])
                : [
                    {
                      workplaceExample: item.techContextExample,
                      casualVsStaff: item.casualVsStaff || undefined,
                      scenarioContext: "Workplace Example",
                    },
                  ];

            const currentIdx = Math.min(
              Math.max(0, activeExampleIndex[item.id] ?? 0),
              examples.length - 1
            );
            const currentExample = examples[currentIdx] || examples[0];

            return (
              <Card
                key={item.id}
                className={`border-border/70 hover:border-border transition-all shadow-sm ${
                  item.masteryStatus === "mastered"
                    ? "bg-gradient-to-br from-emerald-500/5 via-card to-card border-emerald-500/20"
                    : "bg-card"
                }`}
              >
                <CardContent className="p-4 space-y-3">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-foreground text-base font-mono tracking-tight">
                          {item.phrase}
                        </span>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => speak(item.phrase)}
                          className="h-6 w-6 text-muted-foreground hover:text-primary shrink-0"
                          title="Listen Native Pronunciation"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleCopyText(item.phrase, `phrase-${item.id}`, "Phrase")}
                          className="h-6 w-6 text-muted-foreground hover:text-primary shrink-0"
                          title="Copy phrase"
                        >
                          {copiedKey === `phrase-${item.id}` ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </Button>
                      </div>
                      {item.phonetic && (
                        <span className="text-[11px] text-muted-foreground font-mono">
                          {item.phonetic}
                        </span>
                      )}
                    </div>

                    <Badge
                      variant="outline"
                      className={`text-[10px] px-2 py-0.5 capitalize shrink-0 ${
                        item.masteryStatus === "mastered"
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                          : "bg-amber-500/10 text-amber-500 border-amber-500/20"
                      }`}
                    >
                      {item.masteryStatus}
                    </Badge>
                  </div>

                  {/* Meaning */}
                  <p className="text-xs text-foreground/80 leading-relaxed font-medium">
                    {item.meaning}
                  </p>

                  {/* Context Example Carousel with Drag / Swipe */}
                  <div className="p-3 rounded-xl bg-muted/40 border border-border/50 text-[11px] space-y-2 overflow-hidden relative">
                    {/* Carousel Header Controls */}
                    <div className="flex items-center justify-between gap-1">
                      <div className="flex items-center gap-1.5 text-[10px] font-semibold text-primary uppercase tracking-wider min-w-0">
                        <Lightbulb className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span className="truncate max-w-[110px] sm:max-w-[140px] text-foreground/90 font-medium">
                          {currentExample.scenarioContext || "Workplace Example"}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {/* Audio for current example sentence */}
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => speak(currentExample.workplaceExample)}
                          className="h-5 w-5 text-muted-foreground hover:text-primary"
                          title="Listen to this example sentence"
                        >
                          <Volume2 className="w-3 h-3" />
                        </Button>

                        {/* Copy button for current example */}
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() =>
                            handleCopyText(
                              currentExample.workplaceExample,
                              `example-${item.id}-${currentIdx}`,
                              "Example sentence"
                            )
                          }
                          className="h-5 w-5 text-muted-foreground hover:text-primary"
                          title="Copy example sentence to clipboard"
                        >
                          {copiedKey === `example-${item.id}-${currentIdx}` ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </Button>

                        {/* Pagination carousel arrows */}
                        <div className="flex items-center bg-background/80 rounded-md border border-border/60 px-1 py-0.5 gap-0.5">
                          <Button
                            size="icon"
                            variant="ghost"
                            disabled={currentIdx === 0}
                            onClick={() =>
                              setActiveExampleIndex((prev) => ({
                                ...prev,
                                [item.id]: Math.max(0, currentIdx - 1),
                              }))
                            }
                            className="h-4 w-4 p-0 disabled:opacity-30"
                            title="Previous example (or drag right)"
                          >
                            <ChevronLeft className="w-3 h-3" />
                          </Button>
                          <span className="text-[10px] font-mono text-muted-foreground px-1 select-none">
                            {currentIdx + 1}/{examples.length}
                          </span>
                          <Button
                            size="icon"
                            variant="ghost"
                            disabled={currentIdx === examples.length - 1}
                            onClick={() =>
                              setActiveExampleIndex((prev) => ({
                                ...prev,
                                [item.id]: Math.min(examples.length - 1, currentIdx + 1),
                              }))
                            }
                            className="h-4 w-4 p-0 disabled:opacity-30"
                            title="Next example (or drag left)"
                          >
                            <ChevronRight className="w-3 h-3" />
                          </Button>
                        </div>

                        {/* Regenerate / Add new scenario example */}
                        <Button
                          size="icon"
                          variant="ghost"
                          disabled={regeneratingId === item.id}
                          onClick={() => handleRegenerateExample(item.id)}
                          className="h-5 w-5 text-muted-foreground hover:text-primary"
                          title="Generate new distinct workplace scenario with AI"
                        >
                          {regeneratingId === item.id ? (
                            <Loader2 className="w-3 h-3 animate-spin text-primary" />
                          ) : (
                            <Sparkles className="w-3 h-3" />
                          )}
                        </Button>
                      </div>
                    </div>

                    {/* Draggable Slide Content */}
                    <AnimatePresence mode="wait" initial={false}>
                      <motion.div
                        key={currentIdx}
                        drag={examples.length > 1 ? "x" : false}
                        dragConstraints={{ left: 0, right: 0 }}
                        dragElastic={0.2}
                        onDragEnd={(_, info) => {
                          const threshold = 35;
                          if (info.offset.x < -threshold && currentIdx < examples.length - 1) {
                            setActiveExampleIndex((prev) => ({
                              ...prev,
                              [item.id]: currentIdx + 1,
                            }));
                          } else if (info.offset.x > threshold && currentIdx > 0) {
                            setActiveExampleIndex((prev) => ({
                              ...prev,
                              [item.id]: currentIdx - 1,
                            }));
                          }
                        }}
                        initial={{ opacity: 0, x: 15 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -15 }}
                        transition={{ duration: 0.16 }}
                        className={`space-y-1.5 touch-pan-y ${
                          examples.length > 1
                            ? "cursor-grab active:cursor-grabbing select-none"
                            : ""
                        }`}
                      >
                        <p className="italic text-foreground/90 leading-relaxed text-xs">
                          &ldquo;{currentExample.workplaceExample}&rdquo;
                        </p>

                        {/* Casual vs Staff comparison for this specific scenario */}
                        {currentExample.casualVsStaff && (
                          <div className="text-[11px] text-purple-400 font-medium pt-1.5 border-t border-border/30">
                            💡 {currentExample.casualVsStaff}
                          </div>
                        )}
                      </motion.div>
                    </AnimatePresence>

                    {/* Drag pagination indicator dots (if multiple examples) */}
                    {examples.length > 1 && (
                      <div className="flex items-center justify-between pt-1 text-[10px] text-muted-foreground/60 border-t border-border/20">
                        <span className="text-[9px]">↔ Drag left/right to switch</span>
                        <div className="flex items-center gap-1">
                          {examples.map((_, dotIdx) => (
                            <button
                              key={dotIdx}
                              type="button"
                              onClick={() =>
                                setActiveExampleIndex((prev) => ({
                                  ...prev,
                                  [item.id]: dotIdx,
                                }))
                              }
                              className={`h-1.5 rounded-full transition-all ${
                                dotIdx === currentIdx
                                  ? "w-3.5 bg-primary"
                                  : "w-1.5 bg-muted-foreground/30 hover:bg-muted-foreground/60"
                              }`}
                              aria-label={`Slide ${dotIdx + 1}`}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                {/* Bottom Actions */}
                <div className="flex items-center justify-between pt-2 border-t border-border/40 text-xs">
                  <Badge variant="secondary" className="text-[10px] font-mono capitalize">
                    {item.category.replace("_", " ")}
                  </Badge>

                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        toggleMutation.mutate({
                          id: item.id,
                          newStatus: item.masteryStatus === "mastered" ? "learning" : "mastered",
                        })
                      }
                      className="h-7 px-2 text-[11px] text-muted-foreground hover:text-foreground"
                    >
                      {item.masteryStatus === "mastered" ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mr-1" />
                          Mastered
                        </>
                      ) : (
                        <>Mark as Mastered</>
                      )}
                    </Button>

                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => deleteMutation.mutate(item.id)}
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      title="Delete phrase"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      )}

      {/* Dialog: AI Generate Phrases */}
      <Dialog open={isAiGenerateOpen} onOpenChange={setIsAiGenerateOpen}>
        <DialogContent className="sm:max-w-[460px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Sparkles className="w-4 h-4 text-primary" /> AI Generate Tech Phrases
            </DialogTitle>
            <DialogDescription className="text-xs">
              Tell Gemini what engineering scenario or tech stack you want to master phrases for.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Scenario / Topic Keyword:</label>
              <Input
                value={aiTopicInput}
                onChange={(e) => setAiTopicInput(e.target.value)}
                placeholder="e.g. Code Review Pushback, Latency Optimization, Database Sharding"
                className="text-xs"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAiGenerateOpen(false)}
              disabled={isGeneratingVocab}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleGenerateAiVocab}
              disabled={isGeneratingVocab || !aiTopicInput.trim()}
              className="text-xs gap-1.5 bg-primary text-white"
            >
              {isGeneratingVocab ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" /> Generate 5 Phrases
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Add Custom Phrase */}
      <Dialog open={isAddCustomOpen} onOpenChange={setIsAddCustomOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Plus className="w-4 h-4 text-primary" /> Add Phrase to Lexicon
            </DialogTitle>
            <DialogDescription className="text-xs">
              Save a phrase you heard in a tech podcast, YouTube video, or work chat.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div className="space-y-1">
              <label className="font-medium text-muted-foreground">Phrase or Idiom:</label>
              <Input
                value={customPhrase}
                onChange={(e) => setCustomPhrase(e.target.value)}
                placeholder="e.g. Table this for now"
                className="text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="font-medium text-muted-foreground">Indonesian Meaning:</label>
              <Input
                value={customMeaning}
                onChange={(e) => setCustomMeaning(e.target.value)}
                placeholder="e.g. Menunda pembahasan ke waktu lain"
                className="text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="font-medium text-muted-foreground">Workplace / Tech Example Sentence:</label>
              <Input
                value={customExample}
                onChange={(e) => setCustomExample(e.target.value)}
                placeholder="e.g. Let's table this database migration debate until tomorrow."
                className="text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="font-medium text-muted-foreground">Category:</label>
              <Select value={customCategory} onValueChange={(val) => setCustomCategory(val as FluencyCategory)}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="technical">Technical</SelectItem>
                  <SelectItem value="workplace_idiom">Workplace Idiom</SelectItem>
                  <SelectItem value="collaboration">Collaboration</SelectItem>
                  <SelectItem value="leadership">Leadership</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" size="sm" onClick={() => setIsAddCustomOpen(false)} className="text-xs">
              Cancel
            </Button>
            <Button size="sm" onClick={handleSaveCustom} className="text-xs gap-1.5 bg-primary text-white">
              Save Phrase
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Spaced Repetition (SRS) Flashcard Drill */}
      <Dialog open={isSrsOpen} onOpenChange={setIsSrsOpen}>
        <DialogContent className="sm:max-w-[560px] p-0 overflow-hidden border-border/80">
          {srsCards.length === 0 ? (
            <div className="p-8 text-center space-y-3">
              <BookOpen className="w-8 h-8 text-muted-foreground mx-auto" />
              <h4 className="text-sm font-semibold">No phrases in your Lexicon</h4>
              <p className="text-xs text-muted-foreground">Add or generate phrases first to review them in Flashcard mode.</p>
              <Button size="sm" onClick={() => setIsSrsOpen(false)} className="text-xs">Close</Button>
            </div>
          ) : srsIndex < srsCards.length && currentSrsCard ? (
            <div className="flex flex-col">
              {/* Modal Top Bar */}
              <div className="flex items-center justify-between p-4 border-b border-border/60 bg-muted/20">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-amber-500/15 text-amber-500">
                    <Zap className="w-4 h-4 fill-current" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground">Spaced Repetition Active Recall</h3>
                    <p className="text-[11px] text-muted-foreground">Test your tech phrasing reflexes before flipping</p>
                  </div>
                </div>

                <Badge variant="outline" className="text-xs font-mono font-bold text-amber-400 border-amber-500/30">
                  {srsIndex + 1} / {srsCards.length}
                </Badge>
              </div>

              {/* Progress Line */}
              <div className="w-full bg-muted/40 h-1">
                <div
                  className="bg-amber-500 h-1 transition-all duration-300"
                  style={{ width: `${((srsIndex + 1) / srsCards.length) * 100}%` }}
                />
              </div>

              {/* Flashcard Area */}
              <div className="p-6 space-y-4">
                <div className="p-6 rounded-2xl border border-border/80 bg-gradient-to-b from-card to-card/60 shadow-sm space-y-4 text-center relative overflow-hidden">
                  <div className="flex items-center justify-between text-xs">
                    <Badge variant="secondary" className="text-[10px] uppercase font-mono">
                      {currentSrsCard.category}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={`text-[10px] ${
                        currentSrsCard.masteryStatus === "mastered"
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                          : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                      }`}
                    >
                      {currentSrsCard.masteryStatus === "mastered" ? "✅ Mastered" : "📖 In Learning"}
                    </Badge>
                  </div>

                  {/* Phrase & Pronunciation */}
                  <div className="space-y-2 py-2">
                    <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground font-mono">
                      {currentSrsCard.phrase}
                    </h2>
                    {currentSrsCard.phonetic && (
                      <p className="text-xs text-muted-foreground font-mono">{currentSrsCard.phonetic}</p>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => speak(currentSrsCard.phrase)}
                      className="h-7 text-xs gap-1 text-primary hover:bg-primary/10 rounded-lg mx-auto"
                    >
                      <Volume2 className="w-3.5 h-3.5" /> Listen Native Pronunciation
                    </Button>
                  </div>

                  {/* Hidden / Revealed Content */}
                  {!isCardFlipped ? (
                    <div className="pt-3 pb-1 border-t border-border/40">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setIsCardFlipped(true)}
                        className="gap-2 text-xs font-semibold rounded-xl border-border/80 h-9 w-full max-w-xs mx-auto shadow-sm"
                      >
                        <Eye className="w-3.5 h-3.5" /> Flip to Reveal Meaning &amp; Context
                      </Button>
                      <p className="text-[11px] text-muted-foreground mt-2">
                        Try to recall its meaning or a tech sentence using this word first!
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3 pt-3 border-t border-border/50 text-left animate-in fade-in-50 duration-200">
                      <div className="p-3 rounded-xl bg-muted/40 border border-border/60 space-y-1">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                          Meaning:
                        </span>
                        <p className="text-xs font-medium text-foreground">{currentSrsCard.meaning}</p>
                      </div>

                      <div className="p-3 rounded-xl bg-primary/5 border border-primary/20 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-primary uppercase tracking-wider">
                            Engineering Workplace Example:
                          </span>
                          <button
                            onClick={() => speak(currentSrsCard.techContextExample)}
                            className="text-[11px] text-primary hover:underline flex items-center gap-1"
                          >
                            <Volume2 className="w-3 h-3" /> Listen
                          </button>
                        </div>
                        <p className="text-xs text-foreground/90 italic">
                          &ldquo;{currentSrsCard.techContextExample}&rdquo;
                        </p>
                      </div>

                      {currentSrsCard.casualVsStaff && (
                        <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-[11px] text-purple-300">
                          <span className="font-semibold">💡 Upgrade: </span> {currentSrsCard.casualVsStaff}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* SRS Action Footer Buttons when flipped */}
                {isCardFlipped && (
                  <div className="grid grid-cols-2 gap-3 pt-1 animate-in fade-in-50 duration-200">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleNextSrsCard(false)}
                      className="text-xs rounded-xl h-9 border-border/80"
                    >
                      Need Review (Still Learning)
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleNextSrsCard(true)}
                      className="text-xs rounded-xl h-9 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold gap-1.5 shadow-md shadow-emerald-500/20"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Got It! (Mark Mastered)
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Celebration Completion State */
            <div className="p-8 text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/15 text-amber-500 flex items-center justify-center mx-auto shadow-inner">
                <Trophy className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-foreground">Flashcard Review Completed! 🎉</h3>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  Awesome deliberate practice! You actively reviewed {srsReviewedCount} engineering phrases today.
                </p>
              </div>
              <div className="flex items-center justify-center gap-3 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleResetSrs}
                  className="text-xs gap-1.5 rounded-xl"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Review Deck Again
                </Button>
                <Button
                  size="sm"
                  onClick={() => setIsSrsOpen(false)}
                  className="text-xs gap-1 rounded-xl bg-primary text-white"
                >
                  Done
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
