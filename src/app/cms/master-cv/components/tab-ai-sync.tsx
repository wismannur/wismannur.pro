"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Award,
  Brain,
  Briefcase,
  Check,
  CheckCircle2,
  FolderGit2,
  Loader2,
  RefreshCw,
  Sparkles,
  UserCheck,
  Wand2,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { AI_KNOWLEDGE_CATEGORIES } from "@/services/ai-knowledge/types";
import {
  masterCvService,
  type MasterCvStudioSnapshot,
  type MasterCvSyncProposal,
} from "@/services";

interface TabAiSyncProps {
  snapshot: MasterCvStudioSnapshot;
  proposal: MasterCvSyncProposal | null;
  setProposal: React.Dispatch<React.SetStateAction<MasterCvSyncProposal | null>>;
  isAuditing: boolean;
  onRunAudit: (focusPrompt?: string, categoryFilter?: string) => Promise<void>;
  onApplied: () => void;
}

export function TabAiSync({
  snapshot,
  proposal,
  setProposal,
  isAuditing,
  onRunAudit,
  onApplied,
}: TabAiSyncProps) {
  const [focusPrompt, setFocusPrompt] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [isApplying, setIsApplying] = useState(false);

  // Selection states for the Diff Workbench
  const [applyProfile, setApplyProfile] = useState(true);
  const [editedHeadline, setEditedHeadline] = useState("");
  const [editedBio, setEditedBio] = useState("");

  const [selectedExpIds, setSelectedExpIds] = useState<Record<string, boolean>>({});
  const [editedExpDescriptions, setEditedExpDescriptions] = useState<Record<string, string>>({});

  const [selectedProjIds, setSelectedProjIds] = useState<Record<string, boolean>>({});
  const [editedProjSummaries, setEditedProjSummaries] = useState<Record<string, string>>({});
  const [editedProjFeatured, setEditedProjFeatured] = useState<Record<string, boolean>>({});

  const [selectedSkillNames, setSelectedSkillNames] = useState<Record<string, boolean>>({});

  // Sync local editable states whenever a new proposal arrives
  const [lastSyncedProposal, setLastSyncedProposal] = useState<MasterCvSyncProposal | null>(null);
  if (proposal && proposal !== lastSyncedProposal) {
    setLastSyncedProposal(proposal);
    setApplyProfile(true);
    setEditedHeadline(proposal.executiveProfile.proposedHeadline);
    setEditedBio(proposal.executiveProfile.proposedBio);

    const nextExpSelected: Record<string, boolean> = {};
    const nextExpDesc: Record<string, string> = {};
    for (const exp of proposal.experienceUpgrades) {
      nextExpSelected[exp.entryId] = true;
      nextExpDesc[exp.entryId] = exp.proposedDescription;
    }
    setSelectedExpIds(nextExpSelected);
    setEditedExpDescriptions(nextExpDesc);

    const nextProjSelected: Record<string, boolean> = {};
    const nextProjSum: Record<string, string> = {};
    const nextProjFeat: Record<string, boolean> = {};
    for (const proj of proposal.projectUpgrades) {
      nextProjSelected[proj.projectId] = true;
      nextProjSum[proj.projectId] = proj.proposedSummary;
      nextProjFeat[proj.projectId] = proj.recommendFeatured;
    }
    setSelectedProjIds(nextProjSelected);
    setEditedProjSummaries(nextProjSum);
    setEditedProjFeatured(nextProjFeat);

    const nextSkills: Record<string, boolean> = {};
    for (const skill of proposal.missingSkills) {
      nextSkills[skill.name] = true;
    }
    setSelectedSkillNames(nextSkills);
  }

  const handleTriggerAudit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    await onRunAudit(focusPrompt, categoryFilter);
  };

  const selectedExpCount = Object.values(selectedExpIds).filter(Boolean).length;
  const selectedProjCount = Object.values(selectedProjIds).filter(Boolean).length;
  const selectedSkillsCount = Object.values(selectedSkillNames).filter(Boolean).length;
  const totalSelectedActions =
    (applyProfile ? 1 : 0) + selectedExpCount + selectedProjCount + selectedSkillsCount;

  const handleApplySelected = async () => {
    if (!proposal || totalSelectedActions === 0) {
      toast.error("Pilih minimal satu perubahan untuk diterapkan ke database.");
      return;
    }

    setIsApplying(true);
    const toastId = toast.loading("Applying approved Second Brain upgrades to Master CV...");
    try {
      const result = await masterCvService.applySyncPlan({
        updateExecutiveProfile: applyProfile
          ? {
              headline: editedHeadline,
              bio: editedBio,
            }
          : undefined,
        experienceUpdates: proposal.experienceUpgrades
          .filter((e) => selectedExpIds[e.entryId])
          .map((e) => ({
            entryId: e.entryId,
            description: editedExpDescriptions[e.entryId] ?? e.proposedDescription,
          })),
        projectUpdates: proposal.projectUpgrades
          .filter((p) => selectedProjIds[p.projectId])
          .map((p) => ({
            projectId: p.projectId,
            summary: editedProjSummaries[p.projectId] ?? p.proposedSummary,
            isFeatured: editedProjFeatured[p.projectId] ?? p.recommendFeatured,
          })),
        skillsToAdd: proposal.missingSkills
          .filter((s) => selectedSkillNames[s.name])
          .map((s) => ({
            name: s.name,
            sortOrder: s.recommendedSortOrder,
          })),
      });

      const summaryParts: string[] = [];
      if (result.updatedProfile) summaryParts.push("Executive Summary");
      if (result.updatedExperiencesCount > 0)
        summaryParts.push(`${result.updatedExperiencesCount} Experiences`);
      if (result.updatedProjectsCount > 0)
        summaryParts.push(`${result.updatedProjectsCount} Projects`);
      if (result.addedSkillsCount > 0) summaryParts.push(`${result.addedSkillsCount} New Skills`);

      toast.success(
        `Master CV berhasil di-sync! (${summaryParts.join(", ") || "All changes applied"})`,
        { id: toastId }
      );
      setProposal(null);
      onApplied();
    } catch (error) {
      console.error("Failed to apply Master CV sync plan:", error);
      toast.error(
        error instanceof Error ? error.message : "Gagal menerapkan perubahan ke Master CV.",
        { id: toastId }
      );
    } finally {
      setIsApplying(false);
    }
  };

  const activeBrainCount = snapshot.knowledgeItems.filter((k) => k.isPublished).length;

  return (
    <div className="space-y-6">
      {/* Control Center Card */}
      <div className="relative overflow-hidden rounded-2xl border border-indigo-500/25 bg-gradient-to-br from-[#0F1326] via-[#0C0E18] to-[#131024] p-6 shadow-2xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/25 text-indigo-300 text-xs font-semibold">
              <Brain className="w-3.5 h-3.5 text-indigo-400" />
              <span>Hub-and-Spoke Knowledge Synthesizer</span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-100">
              Re-Generate & Audit Master CV dari My Second Brain
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Memindai <strong className="text-slate-200">{activeBrainCount} wawasan aktif</strong>{" "}
              di My Second Brain bersama{" "}
              <strong className="text-slate-200">{snapshot.projects.length} Projects</strong>,{" "}
              <strong className="text-slate-200">{snapshot.experiences.length} Experiences</strong>,
              dan <strong className="text-slate-200">{snapshot.skills.length} Skills</strong> untuk
              merumuskan bullet Google XYZ, ringkasan ATS Project, dan mengekstrak skill baru tanpa
              menimpa data secara buta.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <Button
              asChild
              variant="outline"
              size="sm"
              className="rounded-xl border-white/[0.1] bg-white/[0.03] text-slate-300 hover:text-white hover:bg-white/[0.07] text-xs h-10"
            >
              <Link href="/cms/ai-knowledge">
                <Brain className="w-3.5 h-3.5 mr-1.5 text-purple-400" />
                Kelola Second Brain
              </Link>
            </Button>

            <Button
              onClick={() => handleTriggerAudit()}
              disabled={isAuditing}
              className="rounded-xl bg-gradient-to-r from-indigo-500 via-indigo-600 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold shadow-lg shadow-indigo-500/25 px-5 h-10 text-xs sm:text-sm"
            >
              {isAuditing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Synthesizing Ecosystem...
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4 mr-2" />
                  {proposal ? "Re-Run AI Ecosystem Audit" : "Audit & Re-Generate Master CV"}
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Optional Focus Prompt & Category Filter */}
        <form
          onSubmit={handleTriggerAudit}
          className="mt-5 pt-5 border-t border-white/[0.08] flex flex-col sm:flex-row gap-3"
        >
          <div className="flex-1">
            <Input
              placeholder="Instruksi fokus opsional (misal: 'Tonjolkan arsitektur AI Agentic, Next.js, dan optimasi performa database')..."
              value={focusPrompt}
              onChange={(e) => setFocusPrompt(e.target.value)}
              disabled={isAuditing}
              className="bg-[#080A12]/80 border-white/[0.08] text-slate-100 placeholder:text-slate-500 rounded-xl text-xs h-10"
            />
          </div>
          <Select
            value={categoryFilter}
            onValueChange={setCategoryFilter}
            disabled={isAuditing}
          >
            <SelectTrigger className="w-full sm:w-[210px] bg-[#080A12]/80 border-white/[0.08] text-slate-200 rounded-xl text-xs h-10">
              <SelectValue placeholder="Semua Kategori Brain" />
            </SelectTrigger>
            <SelectContent className="bg-[#0C0E18] border-white/[0.08] text-slate-200">
              <SelectItem value="all">Semua Kategori Second Brain</SelectItem>
              {AI_KNOWLEDGE_CATEGORIES.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </form>
      </div>

      {/* Loading State */}
      {isAuditing && (
        <div className="rounded-2xl border border-indigo-500/20 bg-[#0C0E18]/90 p-10 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/25 flex items-center justify-center mx-auto">
            <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h3 className="text-base font-bold text-slate-100">
              Menganalisis Delta Antara My Second Brain & Master CV...
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Gemini AI sedang melakukan cross-check seluruh wawasan karir, metrik terverifikasi,
              studi kasus project, dan skills untuk menyusun draf pembaruan CV.
            </p>
          </div>
        </div>
      )}

      {/* Diff Review & Approval Workbench */}
      {!isAuditing && proposal && (
        <div className="space-y-6">
          {/* Audit Summary & Score Banner */}
          <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/[0.05] p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 shrink-0 mt-0.5">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-bold text-slate-100">
                    Hasil Audit Ekosistem Second Brain
                  </span>
                  <Badge className="bg-emerald-500/15 text-emerald-300 border-emerald-500/30 text-xs">
                    Alignment Score: {proposal.alignmentScore}%
                  </Badge>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {proposal.executiveAuditSummary}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setProposal(null)}
                disabled={isApplying}
                className="rounded-xl border-white/[0.1] text-xs h-9"
              >
                Tutup Review
              </Button>
              <Button
                onClick={handleApplySelected}
                disabled={isApplying || totalSelectedActions === 0}
                size="sm"
                className="rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs h-9 px-4 shadow-lg shadow-emerald-600/25"
              >
                {isApplying ? (
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                ) : (
                  <Check className="w-3.5 h-3.5 mr-1.5" />
                )}
                Apply {totalSelectedActions} Perubahan Terpilih
              </Button>
            </div>
          </div>

          {/* 1. Executive Headline & Professional Summary Upgrade */}
          <div className="rounded-2xl border border-white/[0.08] bg-[#0C0E18]/90 p-5 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <Checkbox
                  id="apply-profile"
                  checked={applyProfile}
                  onCheckedChange={(checked) => setApplyProfile(Boolean(checked))}
                  className="mt-1"
                />
                <div>
                  <label
                    htmlFor="apply-profile"
                    className="text-sm font-bold text-slate-100 flex items-center gap-2 cursor-pointer"
                  >
                    <UserCheck className="w-4 h-4 text-indigo-400" />
                    <span>1. Executive Headline & Professional Summary (/cv)</span>
                  </label>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {proposal.executiveProfile.reasoning}
                  </p>
                </div>
              </div>
              <Badge
                variant="outline"
                className={cn(
                  "text-[11px]",
                  applyProfile
                    ? "border-indigo-500/30 bg-indigo-500/10 text-indigo-300"
                    : "border-white/10 text-slate-500"
                )}
              >
                {applyProfile ? "Akan Diterapkan" : "Dilewati"}
              </Badge>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-2">
              {/* Current */}
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3.5 space-y-2">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Saat Ini di /cv
                </div>
                <div className="text-xs font-semibold text-indigo-300">
                  {proposal.executiveProfile.currentHeadline}
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {proposal.executiveProfile.currentBio}
                </p>
              </div>

              {/* Proposed (Editable) */}
              <div className="rounded-xl border border-indigo-500/25 bg-indigo-500/[0.04] p-3.5 space-y-2.5">
                <div className="text-[11px] font-bold uppercase tracking-wider text-indigo-300 flex items-center justify-between">
                  <span>Usulan Baru (Dapat Diedit Sebelum Apply)</span>
                  <Sparkles className="w-3 h-3 text-indigo-400" />
                </div>
                <Input
                  value={editedHeadline}
                  onChange={(e) => setEditedHeadline(e.target.value)}
                  className="bg-[#080A12] border-white/[0.1] text-xs font-semibold text-slate-100 h-8 rounded-lg"
                />
                <Textarea
                  value={editedBio}
                  onChange={(e) => setEditedBio(e.target.value)}
                  rows={3}
                  className="bg-[#080A12] border-white/[0.1] text-xs text-slate-200 leading-relaxed rounded-lg"
                />
              </div>
            </div>
          </div>

          {/* 2. Missing Skills Extracted from Second Brain & Projects */}
          {proposal.missingSkills.length > 0 && (
            <div className="rounded-2xl border border-white/[0.08] bg-[#0C0E18]/90 p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                    <Award className="w-4 h-4 text-amber-400" />
                    <span>
                      2. Ekstraksi Skills Baru dari Second Brain & Projects (
                      {selectedSkillsCount}/{proposal.missingSkills.length} dipilih)
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Skill di bawah ini terdeteksi di Second Brain atau Projects Anda tetapi belum
                    terdaftar di tabel Skills `/cv`. Klik untuk memilih yang ingin ditambahkan.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const allSelected = selectedSkillsCount === proposal.missingSkills.length;
                      const next: Record<string, boolean> = {};
                      for (const s of proposal.missingSkills) {
                        next[s.name] = !allSelected;
                      }
                      setSelectedSkillNames(next);
                    }}
                    className="text-xs h-7 px-2.5 text-slate-300 hover:text-white"
                  >
                    {selectedSkillsCount === proposal.missingSkills.length
                      ? "Batal Pilih Semua"
                      : "Pilih Semua"}
                  </Button>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {proposal.missingSkills.map((skill) => {
                  const isChecked = Boolean(selectedSkillNames[skill.name]);
                  return (
                    <button
                      key={skill.name}
                      type="button"
                      onClick={() =>
                        setSelectedSkillNames((prev) => ({
                          ...prev,
                          [skill.name]: !prev[skill.name],
                        }))
                      }
                      className={cn(
                        "group flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs transition-all text-left",
                        isChecked
                          ? "bg-amber-500/15 border-amber-500/40 text-amber-200 shadow-sm"
                          : "bg-white/[0.02] border-white/[0.08] text-slate-400 hover:border-white/20"
                      )}
                    >
                      <div
                        className={cn(
                          "w-3.5 h-3.5 rounded flex items-center justify-center border",
                          isChecked
                            ? "bg-amber-500 border-amber-400 text-black"
                            : "border-slate-600"
                        )}
                      >
                        {isChecked && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                      </div>
                      <span className="font-semibold">{skill.name}</span>
                      <span className="text-[10px] text-slate-400/80 border-l border-white/10 pl-2">
                        {skill.source}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 3. Work Experience XYZ Bullet Upgrades */}
          {proposal.experienceUpgrades.length > 0 && (
            <div className="rounded-2xl border border-white/[0.08] bg-[#0C0E18]/90 p-5 space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-indigo-400" />
                  <span>
                    3. Upgrade Work Experience Bullets dengan Formula Google XYZ (
                    {selectedExpCount}/{proposal.experienceUpgrades.length} dipilih)
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Menyuntikkan metrik nyata dan pencapaian arsitektural dari My Second Brain ke
                  masing-masing posisi kerja.
                </p>
              </div>

              <div className="space-y-4">
                {proposal.experienceUpgrades.map((exp) => {
                  const isChecked = Boolean(selectedExpIds[exp.entryId]);
                  return (
                    <div
                      key={exp.entryId}
                      className={cn(
                        "rounded-xl border p-4 space-y-3 transition-all",
                        isChecked
                          ? "border-indigo-500/30 bg-indigo-500/[0.03]"
                          : "border-white/[0.06] bg-white/[0.01] opacity-75"
                      )}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-start gap-3">
                          <Checkbox
                            id={`exp-${exp.entryId}`}
                            checked={isChecked}
                            onCheckedChange={(checked) =>
                              setSelectedExpIds((prev) => ({
                                ...prev,
                                [exp.entryId]: Boolean(checked),
                              }))
                            }
                            className="mt-1"
                          />
                          <div>
                            <label
                              htmlFor={`exp-${exp.entryId}`}
                              className="text-sm font-bold text-slate-100 cursor-pointer"
                            >
                              {exp.title} —{" "}
                              <span className="text-indigo-300">{exp.organization}</span>
                            </label>
                            <p className="text-xs text-slate-400">{exp.changeSummary}</p>
                          </div>
                        </div>

                        <span className="text-[11px] font-mono text-slate-400 shrink-0">
                          {exp.period}
                        </span>
                      </div>

                      {exp.matchedSecondBrainTopics.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5 pl-7">
                          <span className="text-[10px] text-purple-300 font-semibold flex items-center gap-1">
                            <Brain className="w-3 h-3" /> Sumber Brain:
                          </span>
                          {exp.matchedSecondBrainTopics.map((topic, idx) => (
                            <Badge
                              key={idx}
                              variant="secondary"
                              className="bg-purple-500/10 text-purple-300 border-purple-500/20 text-[10px] py-0"
                            >
                              {topic}
                            </Badge>
                          ))}
                        </div>
                      )}

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 pl-7">
                        <div className="rounded-lg border border-white/[0.06] bg-[#080A12]/60 p-3 space-y-1.5">
                          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                            Deskripsi Saat Ini
                          </div>
                          <pre className="text-xs text-slate-400 whitespace-pre-wrap font-sans leading-relaxed">
                            {exp.currentDescription || "(Belum ada deskripsi)"}
                          </pre>
                        </div>

                        <div className="rounded-lg border border-indigo-500/25 bg-[#080A12] p-3 space-y-1.5">
                          <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-300">
                            Usulan Bullet XYZ (Dapat Diedit)
                          </div>
                          <Textarea
                            value={editedExpDescriptions[exp.entryId] ?? exp.proposedDescription}
                            onChange={(e) =>
                              setEditedExpDescriptions((prev) => ({
                                ...prev,
                                [exp.entryId]: e.target.value,
                              }))
                            }
                            rows={6}
                            className="bg-transparent border-white/[0.08] text-xs text-slate-100 leading-relaxed font-sans"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 4. Key Technical Projects Curation & Summary Upgrades */}
          {proposal.projectUpgrades.length > 0 && (
            <div className="rounded-2xl border border-white/[0.08] bg-[#0C0E18]/90 p-5 space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <FolderGit2 className="w-4 h-4 text-teal-400" />
                  <span>
                    4. Sinkronisasi Key Technical Projects di CV ({selectedProjCount}/
                    {proposal.projectUpgrades.length} dipilih)
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Memoles ringkasan project agar padat metrik (ATS-friendly) dan mengatur project
                  unggulan yang ditampilkan di `/cv`.
                </p>
              </div>

              <div className="space-y-3.5">
                {proposal.projectUpgrades.map((proj) => {
                  const isChecked = Boolean(selectedProjIds[proj.projectId]);
                  const isFeat =
                    editedProjFeatured[proj.projectId] ?? proj.recommendFeatured;

                  return (
                    <div
                      key={proj.projectId}
                      className={cn(
                        "rounded-xl border p-4 space-y-3 transition-all",
                        isChecked
                          ? "border-teal-500/30 bg-teal-500/[0.03]"
                          : "border-white/[0.06] bg-white/[0.01] opacity-75"
                      )}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-start gap-3">
                          <Checkbox
                            id={`proj-${proj.projectId}`}
                            checked={isChecked}
                            onCheckedChange={(checked) =>
                              setSelectedProjIds((prev) => ({
                                ...prev,
                                [proj.projectId]: Boolean(checked),
                              }))
                            }
                            className="mt-1"
                          />
                          <div>
                            <label
                              htmlFor={`proj-${proj.projectId}`}
                              className="text-sm font-bold text-slate-100 cursor-pointer flex items-center gap-2 flex-wrap"
                            >
                              <span>{proj.title}</span>
                              {proj.technologies.slice(0, 4).map((t) => (
                                <Badge
                                  key={t}
                                  variant="secondary"
                                  className="text-[10px] bg-white/[0.05] text-slate-300 py-0"
                                >
                                  {t}
                                </Badge>
                              ))}
                            </label>
                            <p className="text-xs text-slate-400 mt-0.5">{proj.changeSummary}</p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            setEditedProjFeatured((prev) => ({
                              ...prev,
                              [proj.projectId]: !isFeat,
                            }))
                          }
                          className={cn(
                            "text-xs px-3 py-1 rounded-full border font-semibold transition-colors shrink-0",
                            isFeat
                              ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-300"
                              : "bg-white/[0.04] border-white/10 text-slate-400"
                          )}
                        >
                          {isFeat ? "★ Tampilkan di /cv (Featured)" : "Tidak Ditampilkan di /cv"}
                        </button>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 pl-7">
                        <div className="rounded-lg border border-white/[0.06] bg-[#080A12]/60 p-3 space-y-1">
                          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                            Ringkasan Saat Ini
                          </div>
                          <p className="text-xs text-slate-400 leading-relaxed">
                            {proj.currentSummary}
                          </p>
                        </div>

                        <div className="rounded-lg border border-teal-500/25 bg-[#080A12] p-3 space-y-1.5">
                          <div className="text-[10px] font-bold uppercase tracking-wider text-teal-300">
                            Ringkasan ATS Baru (Dapat Diedit)
                          </div>
                          <Textarea
                            value={editedProjSummaries[proj.projectId] ?? proj.proposedSummary}
                            onChange={(e) =>
                              setEditedProjSummaries((prev) => ({
                                ...prev,
                                [proj.projectId]: e.target.value,
                              }))
                            }
                            rows={3}
                            className="bg-transparent border-white/[0.08] text-xs text-slate-100 leading-relaxed"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Bottom Sticky Action Bar */}
          <div className="sticky bottom-4 z-30 rounded-2xl border border-indigo-500/30 bg-[#0C0E18]/95 backdrop-blur-xl p-4 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 text-xs text-slate-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                Siap menerapkan <strong>{totalSelectedActions} pembaruan</strong> ke Database &
                me-revalidate halaman publik <code>/cv</code> dan <code>/about</code>.
              </span>
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setProposal(null)}
                disabled={isApplying}
                className="rounded-xl border-white/[0.1] text-xs h-9"
              >
                Batal
              </Button>
              <Button
                onClick={handleApplySelected}
                disabled={isApplying || totalSelectedActions === 0}
                size="sm"
                className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-xs h-9 px-5 shadow-lg shadow-emerald-500/25"
              >
                {isApplying ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5 mr-1.5" />
                    Apply Selected Upgrades to /cv
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Empty State when no audit has been run yet */}
      {!isAuditing && !proposal && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-white/[0.08] bg-[#0C0E18]/70 p-5 space-y-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <Brain className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-100">
              1. Single Source of Truth (My Second Brain)
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Setiap kali Anda mencatat pencapaian arsitektur, metrik baru, atau opini teknis di{" "}
              <Link href="/cms/ai-knowledge" className="text-indigo-400 hover:underline">
                My Second Brain
              </Link>
              , mesin ini siap mendistribusikannya ke CV.
            </p>
          </div>

          <div className="rounded-2xl border border-white/[0.08] bg-[#0C0E18]/70 p-5 space-y-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <RefreshCw className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-100">
              2. Interactive Diff & Zero-Fabrication
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              AI tidak pernah menimpa data secara diam-diam. Anda mendapatkan perbandingan{" "}
              <em>Before vs After</em> untuk Summary, Experience XYZ, Projects, dan Skills baru.
            </p>
          </div>

          <div className="rounded-2xl border border-white/[0.08] bg-[#0C0E18]/70 p-5 space-y-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <ArrowRight className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-100">
              3. Instant Live Sync ke /cv & Vector PDF
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Begitu Anda klik Apply, tabel Resume, Projects, Skills, dan Profile otomatis
              diperbarui serta cache halaman <code>/cv</code> langsung di-revalidate.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
