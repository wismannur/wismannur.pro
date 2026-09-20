"use client";

import { useState } from "react";
import {
  Briefcase,
  CheckCircle2,
  Code,
  Copy,
  Download,
  Edit3,
  FileText,
  Lightbulb,
  Loader2,
  Plus,
  Save,
  Send,
  Sparkles,
  Trash2,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getAtsScoreColor } from "@/lib/job-tracker";
import type { JobApplication, TailoredBullet } from "@/services/job-tracker/types";
import { ExportTailoredCvDialog } from "./export-tailored-cv-dialog";

interface TabCvTailoringProps {
  application: JobApplication;
  isAnalyzingATS: boolean;
  onRunATSAnalysis: () => void;
  onCopyText: (text?: string, label?: string) => void;
  onUpdate?: (updated: Partial<JobApplication>) => Promise<void>;
}

export function TabCvTailoring({
  application,
  isAnalyzingATS,
  onRunATSAnalysis,
  onCopyText,
  onUpdate,
}: TabCvTailoringProps) {
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isEditingSummary, setIsEditingSummary] = useState(false);
  const [summaryDraft, setSummaryDraft] = useState(application.tailoredSummary || "");

  const [isEditingBullets, setIsEditingBullets] = useState(false);
  const [bulletsDraft, setBulletsDraft] = useState<TailoredBullet[]>(application.tailoredBulletPoints || []);

  const [isEditingCoverLetter, setIsEditingCoverLetter] = useState(false);
  const [coverLetterDraft, setCoverLetterDraft] = useState(application.coverLetter || "");

  const [isSaving, setIsSaving] = useState(false);

  const handleSaveSummary = async () => {
    if (!onUpdate) return;
    setIsSaving(true);
    try {
      await onUpdate({ tailoredSummary: summaryDraft });
      setIsEditingSummary(false);
      toast.success("Tailored summary updated!");
    } catch {
      toast.error("Failed to update summary");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveBullets = async () => {
    if (!onUpdate) return;
    setIsSaving(true);
    try {
      await onUpdate({ tailoredBulletPoints: bulletsDraft });
      setIsEditingBullets(false);
      toast.success("Tailored bullets updated!");
    } catch {
      toast.error("Failed to update bullets");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveCoverLetter = async () => {
    if (!onUpdate) return;
    setIsSaving(true);
    try {
      await onUpdate({ coverLetter: coverLetterDraft });
      setIsEditingCoverLetter(false);
      toast.success("Cover letter updated!");
    } catch {
      toast.error("Failed to update cover letter");
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateBullet = (index: number, field: keyof TailoredBullet, value: string) => {
    setBulletsDraft((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  const handleDeleteBullet = (index: number) => {
    setBulletsDraft((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddBullet = () => {
    setBulletsDraft((prev) => [
      ...prev,
      {
        roleContext: "",
        tailored: "",
        rationale: "",
      },
    ]);
  };

  const atsColor = getAtsScoreColor(application.atsScore);

  return (
    <>
      <div className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-br from-[#0C0E18] via-[#090A10] to-[#08090C] p-6 sm:p-8 shadow-2xl backdrop-blur-xl space-y-6">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div>
            <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-300" />
              Gemini AI Resume Matcher & ATS Optimizer
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Tailor your master experience to align specifically with this job description
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              variant="outline"
              onClick={() => setIsExportOpen(true)}
              className="gap-2 text-xs h-9 px-4 rounded-xl border-white/[0.12] bg-white/[0.04] text-gray-300 hover:text-white hover:bg-white/[0.08] font-medium transition-all"
            >
              <Download className="w-4 h-4 text-primary" />
              <span>Export Tailored CV (PDF / MD)</span>
            </Button>

            <Button
              onClick={onRunATSAnalysis}
              disabled={isAnalyzingATS}
              className="gap-2 text-xs h-9 px-4 rounded-xl bg-primary text-white font-bold shadow-lg shadow-primary/25 hover:bg-primary/90 transition-all"
            >
              {isAnalyzingATS ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Optimizing with Gemini AI...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>{application.atsAnalysis ? "Re-Analyze & Re-Tailor" : "Analyze & Tailor CV"}</span>
                </>
              )}
            </Button>
          </div>
        </div>

        {application.atsAnalysis ? (
          <div className="space-y-6 pt-2">
            {/* Score and Match Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div
                className={`p-5 rounded-2xl border ${atsColor.bgColor} ${atsColor.borderColor} flex flex-col justify-center shadow-lg`}
              >
                <div className="text-xs text-gray-300 font-semibold uppercase tracking-wider">AI Match Score</div>
                <div className={`text-4xl font-extrabold mt-1 font-mono ${atsColor.color}`}>
                  {application.atsScore}%
                </div>
                <div className="text-xs font-bold mt-1 text-white">{atsColor.label}</div>
              </div>

              {application.atsAnalysis.deterministicScore != null ? (
                <div className="p-5 rounded-2xl border border-indigo-500/30 bg-indigo-500/10 flex flex-col justify-center shadow-lg">
                  <div className="text-xs text-indigo-300 font-semibold uppercase tracking-wider">
                    Keyword Overlap
                  </div>
                  <div className="text-4xl font-extrabold mt-1 font-mono text-indigo-400">
                    {application.atsAnalysis.deterministicScore}%
                  </div>
                  <div className="text-[11px] text-gray-300 mt-1">
                    {application.atsAnalysis.matchedKeywords?.length || 0} skills detected in JD
                  </div>
                </div>
              ) : null}

              <div
                className={`p-5 rounded-2xl border border-white/[0.08] bg-[#131726] ${
                  application.atsAnalysis.deterministicScore != null ? "md:col-span-2" : "md:col-span-3"
                } space-y-2 shadow-lg`}
              >
                <div className="text-xs font-bold uppercase tracking-wider text-gray-400">
                  AI Match Summary
                </div>
                <p className="text-xs text-gray-200 leading-relaxed">
                  {application.atsAnalysis.summaryFeedback}
                </p>
              </div>
            </div>

            {/* Strengths & Missing Keywords */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-5 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 space-y-3 shadow-lg">
                <div className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Matching Strengths in Your Profile</span>
                </div>
                <ul className="space-y-2 text-xs text-gray-200">
                  {(application.atsAnalysis.matchStrengths || []).map((str, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-emerald-400 font-bold">•</span>
                      <span>{str}</span>
                    </li>
                  ))}
                </ul>

                {application.atsAnalysis.matchedKeywords && application.atsAnalysis.matchedKeywords.length > 0 && (
                  <div className="pt-2 border-t border-emerald-500/20 space-y-1.5">
                    <div className="text-[11px] font-semibold text-emerald-300/90">
                      Exact Skills Found in Job Description:
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {application.atsAnalysis.matchedKeywords.map((kw, idx) => (
                        <span
                          key={idx}
                          className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                        >
                          ✓ {kw}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="p-5 rounded-2xl border border-rose-500/30 bg-rose-500/10 space-y-3 shadow-lg">
                <div className="text-xs font-bold text-rose-300 flex items-center gap-1.5">
                  <XCircle className="w-4 h-4 text-rose-400" />
                  <span>Missing Keywords & Skill Gaps</span>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {(application.atsAnalysis.missingKeywords || []).map((kw, idx) => (
                    <Badge
                      key={idx}
                      variant="outline"
                      className="text-[11px] bg-rose-500/20 text-rose-300 border-rose-500/40 font-semibold"
                    >
                      {kw}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            {/* Tailored Professional Summary */}
            {application.tailoredSummary && (
              <div className="p-5 rounded-2xl border border-white/[0.08] bg-[#131726] space-y-2.5 shadow-lg">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-primary" />
                    <span>Tailored Professional Summary (For this Application)</span>
                  </span>
                  <div className="flex items-center gap-1.5">
                    {onUpdate && !isEditingSummary && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSummaryDraft(application.tailoredSummary || "");
                          setIsEditingSummary(true);
                        }}
                        className="text-xs gap-1 h-7 rounded-lg text-gray-400 hover:text-white hover:bg-white/[0.06]"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Edit</span>
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onCopyText(application.tailoredSummary, "Summary")}
                      className="text-xs gap-1 h-7 rounded-lg text-gray-400 hover:text-white hover:bg-white/[0.06]"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </Button>
                  </div>
                </div>

                {isEditingSummary ? (
                  <div className="space-y-3 pt-1">
                    <Textarea
                      value={summaryDraft}
                      onChange={(e) => setSummaryDraft(e.target.value)}
                      rows={4}
                      className="bg-[#08090C] border-white/[0.12] text-xs text-white resize-y font-sans leading-relaxed"
                      placeholder="Edit your tailored professional summary..."
                    />
                    <div className="flex justify-end items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsEditingSummary(false)}
                        className="text-xs h-7 text-gray-400 hover:text-white"
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        disabled={isSaving}
                        onClick={handleSaveSummary}
                        className="text-xs h-7 bg-primary text-white gap-1 font-bold shadow-md shadow-primary/20"
                      >
                        {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                        <span>Save Summary</span>
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs leading-relaxed bg-[#08090C] p-3.5 rounded-xl border border-white/[0.06] text-gray-200 font-mono">
                    {application.tailoredSummary}
                  </p>
                )}
              </div>
            )}

            {/* Tailored Bullet Points (XYZ Method) */}
            {application.tailoredBulletPoints && application.tailoredBulletPoints.length > 0 && (
              <div className="p-5 rounded-2xl border border-white/[0.08] bg-[#131726] space-y-3.5 shadow-lg">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                      <Lightbulb className="w-4 h-4 text-amber-400" />
                      <span>In-Place Experience Bullets (XYZ Method)</span>
                      <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/20">
                        In-Place Alignment
                      </Badge>
                    </div>
                    <div className="text-[11px] text-gray-400">
                      Accomplished [X] as measured by [Y] by doing [Z] — directly replaces each role description in exported CV
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 self-start sm:self-auto">
                    {onUpdate && !isEditingBullets && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setBulletsDraft(application.tailoredBulletPoints || []);
                          setIsEditingBullets(true);
                        }}
                        className="text-xs gap-1 h-7 rounded-lg text-gray-400 hover:text-white hover:bg-white/[0.06]"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Edit Bullets</span>
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        onCopyText(
                          application.tailoredBulletPoints?.map((b) => `• ${b.tailored}`).join("\n"),
                          "Bullet points"
                        )
                      }
                      className="text-xs gap-1 h-7 rounded-lg text-gray-400 hover:text-white hover:bg-white/[0.06]"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy All</span>
                    </Button>
                  </div>
                </div>

                {isEditingBullets ? (
                  <div className="space-y-3 pt-1">
                    {bulletsDraft.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-xl border border-white/[0.1] bg-[#08090C] space-y-2 text-xs"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <Input
                            value={item.roleContext || ""}
                            onChange={(e) => handleUpdateBullet(idx, "roleContext", e.target.value)}
                            placeholder="Role / Company (e.g. Senior Software Engineer at Kick Avenue)"
                            className="h-7 text-xs bg-[#0C0E18] border-white/[0.12] text-indigo-300 font-semibold"
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteBullet(idx)}
                            className="h-7 w-7 p-0 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 shrink-0"
                            title="Delete bullet point"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                        <Textarea
                          value={item.tailored}
                          onChange={(e) => handleUpdateBullet(idx, "tailored", e.target.value)}
                          rows={2}
                          placeholder="XYZ bullet: Accomplished [X] as measured by [Y] by doing [Z]..."
                          className="text-xs bg-[#0C0E18] border-white/[0.1] text-white resize-y"
                        />
                        <Input
                          value={item.rationale || ""}
                          onChange={(e) => handleUpdateBullet(idx, "rationale", e.target.value)}
                          placeholder="JD Alignment Rationale (optional explanation)"
                          className="h-7 text-[11px] bg-[#0C0E18] border-white/[0.08] text-gray-400 italic"
                        />
                      </div>
                    ))}

                    <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-2 pt-2 border-t border-white/[0.06]">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleAddBullet}
                        className="text-xs h-8 gap-1.5 border-dashed border-white/[0.15] bg-white/[0.02] text-gray-300 hover:text-white hover:bg-white/[0.05]"
                      >
                        <Plus className="w-3.5 h-3.5 text-primary" />
                        <span>Add Bullet Point</span>
                      </Button>
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setIsEditingBullets(false)}
                          className="text-xs h-8 text-gray-400 hover:text-white"
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          disabled={isSaving}
                          onClick={handleSaveBullets}
                          className="text-xs h-8 bg-primary text-white gap-1 font-bold shadow-md shadow-primary/20"
                        >
                          {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                          <span>Save Bullets</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {application.tailoredBulletPoints.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-xl border border-white/[0.06] bg-[#08090C] space-y-1.5 text-xs"
                      >
                        <div className="flex items-center justify-between gap-2">
                          {item.roleContext ? (
                            <span className="text-[11px] font-bold text-primary px-2.5 py-0.5 rounded-full bg-primary/15 border border-primary/25 inline-flex items-center gap-1.5">
                              <Briefcase className="w-3 h-3 text-primary" />
                              <span>{item.roleContext}</span>
                            </span>
                          ) : (
                            <span className="text-[10px] text-gray-500 font-mono">General Highlight</span>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onCopyText(item.tailored, "Bullet point")}
                            className="h-6 px-2 text-[10px] text-gray-400 hover:text-white"
                          >
                            <Copy className="w-3 h-3 mr-1" /> Copy
                          </Button>
                        </div>
                        <p className="font-semibold text-white pt-1 leading-relaxed">• {item.tailored}</p>
                        {item.rationale && (
                          <p className="text-[11px] text-gray-400 italic bg-white/[0.02] p-2 rounded-lg border border-white/[0.04]">
                            💡 <span className="font-medium text-amber-300/90">JD Alignment:</span> {item.rationale}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Targeted Key Projects Showcase */}
            {application.atsAnalysis.tailoredProjects && application.atsAnalysis.tailoredProjects.length > 0 && (
              <div className="p-5 rounded-2xl border border-white/[0.08] bg-[#131726] space-y-3.5 shadow-lg">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                    <Code className="w-4 h-4 text-indigo-400" />
                    <span>Targeted Key Projects (Architecture Showcase)</span>
                    <Badge variant="outline" className="text-[10px] bg-indigo-500/15 text-indigo-300 border-indigo-500/30">
                      Senior Impact
                    </Badge>
                  </div>
                  <span className="text-[11px] text-gray-400">
                    Curated from your published portfolio to prove technology & architectural alignment
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {application.atsAnalysis.tailoredProjects.map((proj, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl border border-white/[0.06] bg-[#08090C] space-y-2.5 text-xs flex flex-col justify-between"
                    >
                      <div className="space-y-2">
                        <div className="flex items-baseline justify-between gap-2">
                          <h4 className="font-bold text-white text-sm">{proj.title}</h4>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onCopyText(`${proj.title}: ${proj.description}`, "Project highlight")}
                            className="h-6 px-2 text-[10px] text-gray-400 hover:text-white"
                          >
                            <Copy className="w-3 h-3 mr-1" /> Copy
                          </Button>
                        </div>
                        {proj.technologies && proj.technologies.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {proj.technologies.map((t, tIdx) => (
                              <span
                                key={tIdx}
                                className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/[0.04] text-amber-300/90 border border-white/[0.06]"
                              >
                                {t}
                              </span>
                            ))}
                          </div>
                        )}
                        <p className="text-gray-300 text-xs leading-relaxed">• {proj.description}</p>
                      </div>

                      {proj.relevanceRationale && (
                        <div className="text-[11px] text-gray-400 italic bg-white/[0.02] p-2.5 rounded-lg border border-white/[0.04] mt-1">
                          🎯 <span className="font-medium text-indigo-300">Why this fits JD:</span>{" "}
                          {proj.relevanceRationale}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tailored Cover Letter / Cold Message */}
            {application.coverLetter && (
              <div className="p-5 rounded-2xl border border-white/[0.08] bg-[#131726] space-y-2.5 shadow-lg">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                    <Send className="w-4 h-4 text-emerald-400" />
                    <span>Tailored Cover Letter / Cold Outreach Message</span>
                  </span>
                  <div className="flex items-center gap-1.5">
                    {onUpdate && !isEditingCoverLetter && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setCoverLetterDraft(application.coverLetter || "");
                          setIsEditingCoverLetter(true);
                        }}
                        className="text-xs gap-1 h-7 rounded-lg text-gray-400 hover:text-white hover:bg-white/[0.06]"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Edit</span>
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onCopyText(application.coverLetter, "Cover letter")}
                      className="text-xs gap-1 h-7 rounded-lg text-gray-400 hover:text-white hover:bg-white/[0.06]"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Message</span>
                    </Button>
                  </div>
                </div>

                {isEditingCoverLetter ? (
                  <div className="space-y-3 pt-1">
                    <Textarea
                      value={coverLetterDraft}
                      onChange={(e) => setCoverLetterDraft(e.target.value)}
                      rows={6}
                      className="bg-[#08090C] border-white/[0.12] text-xs text-white resize-y font-mono leading-relaxed"
                      placeholder="Edit your tailored cover letter / cold outreach message..."
                    />
                    <div className="flex justify-end items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsEditingCoverLetter(false)}
                        className="text-xs h-7 text-gray-400 hover:text-white"
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        disabled={isSaving}
                        onClick={handleSaveCoverLetter}
                        className="text-xs h-7 bg-primary text-white gap-1 font-bold shadow-md shadow-primary/20"
                      >
                        {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                        <span>Save Message</span>
                      </Button>
                    </div>
                  </div>
                ) : (
                  <pre className="text-xs leading-relaxed bg-[#08090C] p-4 rounded-xl border border-white/[0.06] text-gray-200 font-mono whitespace-pre-wrap custom-scrollbar">
                    {application.coverLetter}
                  </pre>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="py-14 flex flex-col items-center justify-center text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-amber-300" />
            </div>
            <h3 className="font-bold text-base text-white">No AI Match Analysis Yet</h3>
            <p className="text-xs text-gray-400 max-w-md">
              Click the button below to compare your master CV with this job description. Gemini AI will compute your ATS score, reveal keyword gaps, and tailor your bullet points.
            </p>
            <Button
              onClick={onRunATSAnalysis}
              disabled={isAnalyzingATS}
              className="gap-2 mt-2 rounded-xl bg-primary text-white font-bold shadow-lg shadow-primary/25 hover:bg-primary/90 text-xs px-5 h-10"
            >
              {isAnalyzingATS ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Running Gemini ATS Analysis...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Run ATS Analysis & Tailor CV</span>
                </>
              )}
            </Button>
          </div>
        )}
      </div>

      <ExportTailoredCvDialog
        key={`${application.id}-${application.updatedAt ? new Date(application.updatedAt).getTime() : "init"}-${isExportOpen ? "open" : "closed"}`}
        open={isExportOpen}
        onOpenChange={setIsExportOpen}
        application={application}
        onUpdate={onUpdate}
      />
    </>
  );
}
