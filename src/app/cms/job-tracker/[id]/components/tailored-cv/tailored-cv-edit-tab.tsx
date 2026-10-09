"use client";

import React from "react";
import {
  Edit3,
  Save,
  Loader2,
  FileText,
  Sparkles,
  Plus,
  Trash2,
  Code,
  Cpu,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { TailoredBullet, TailoredProjectHighlight } from "@/services/job-tracker/types";
import type { RankedSkillItem } from "@/lib/tailored-skills";

interface TailoredCvEditTabProps {
  hasUpdateHandler: boolean;
  isSavingDialog: boolean;
  onSaveDialogChanges: () => Promise<void>;
  headlineText: string;
  setHeadlineText: (v: string) => void;
  activeSummary: string;
  setActiveSummary: (v: string) => void;
  activeBullets: TailoredBullet[];
  onAddBullet: () => void;
  onUpdateBullet: (index: number, field: keyof TailoredBullet, value: string) => void;
  onDeleteBullet: (index: number) => void;
  activeProjects: TailoredProjectHighlight[];
  onAddProject: () => void;
  onUpdateProject: (index: number, field: keyof TailoredProjectHighlight, value: string | string[]) => void;
  onDeleteProject: (index: number) => void;
  onAddProjectBullet: (projIndex: number) => void;
  onUpdateProjectBullet: (projIndex: number, bulletIndex: number, val: string) => void;
  onDeleteProjectBullet: (projIndex: number, bulletIndex: number) => void;
  activeSkills: string[];
  matchedSkillNamesSet: Set<string>;
  rankedSkillsMap: Map<string, RankedSkillItem>;
  newSkillInput: string;
  setNewSkillInput: (v: string) => void;
  onAddCustomSkill: () => void;
  onResetSkillsToJd: () => void;
  onMoveSkill: (index: number, direction: "left" | "right") => void;
  onRemoveSkill: (index: number) => void;
}

export function TailoredCvEditTab({
  hasUpdateHandler,
  isSavingDialog,
  onSaveDialogChanges,
  headlineText,
  setHeadlineText,
  activeSummary,
  setActiveSummary,
  activeBullets,
  onAddBullet,
  onUpdateBullet,
  onDeleteBullet,
  activeProjects,
  onAddProject,
  onUpdateProject,
  onDeleteProject,
  onAddProjectBullet,
  onUpdateProjectBullet,
  onDeleteProjectBullet,
  activeSkills,
  matchedSkillNamesSet,
  rankedSkillsMap,
  newSkillInput,
  setNewSkillInput,
  onAddCustomSkill,
  onResetSkillsToJd,
  onMoveSkill,
  onRemoveSkill,
}: TailoredCvEditTabProps) {
  return (
    <div className="p-5 bg-[#08090C] rounded-xl border border-white/[0.08] max-h-[50vh] overflow-y-auto space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/[0.08]">
        <div>
          <div className="text-xs font-bold text-white flex items-center gap-1.5">
            <Edit3 className="w-3.5 h-3.5 text-amber-400" />
            <span>Live Resume Content Editor</span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Edits here immediately update the ATS Document Preview, Markdown, and printed PDF.
          </p>
        </div>
        {hasUpdateHandler && (
          <Button
            size="sm"
            disabled={isSavingDialog}
            onClick={onSaveDialogChanges}
            className="text-xs h-8 px-3.5 bg-primary text-white font-bold gap-1.5 shadow-md shadow-primary/20 shrink-0"
          >
            {isSavingDialog ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            <span>Save to Application</span>
          </Button>
        )}
      </div>

      {/* Headline Editor */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-indigo-400" />
            <span>Role Title / Headline</span>
          </label>
          <span className="text-[11px] text-muted-foreground">
            Displays below name (or toggle off in toolbar)
          </span>
        </div>
        <Input
          value={headlineText}
          onChange={(e) => setHeadlineText(e.target.value)}
          placeholder="e.g. Frontend Engineer or Senior Frontend Engineer"
          className="h-8 text-xs bg-[#0C0E18] border-white/[0.1] text-indigo-300 font-semibold"
        />
      </div>

      {/* Summary Editor */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5 text-primary" />
          <span>Professional Summary</span>
        </label>
        <Textarea
          value={activeSummary}
          onChange={(e) => setActiveSummary(e.target.value)}
          rows={4}
          className="bg-[#0C0E18] border-white/[0.1] text-xs text-white resize-y font-sans leading-relaxed"
          placeholder="Edit professional summary..."
        />
      </div>

      {/* Bullets Editor */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <div>
            <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>In-Place Experience Bullets (XYZ Method)</span>
            </label>
            <p className="text-[11px] text-muted-foreground">
              Customized achievements replacing roles in your work experience
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onAddBullet}
            className="text-xs h-7 gap-1 border-dashed border-white/[0.15] bg-white/[0.02] text-gray-300 hover:text-white"
          >
            <Plus className="w-3 h-3 text-primary" />
            <span>Add Bullet</span>
          </Button>
        </div>

        <div className="space-y-3">
          {activeBullets.map((bullet, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-xl border border-white/[0.08] bg-[#0C0E18] space-y-2 text-xs"
            >
              <div className="flex items-center justify-between gap-2">
                <Input
                  value={bullet.roleContext || ""}
                  onChange={(e) => onUpdateBullet(idx, "roleContext", e.target.value)}
                  placeholder="Target Role / Company (e.g. Senior Software Engineer at Kick Avenue)"
                  className="h-7 text-xs bg-[#08090C] border-white/[0.1] text-indigo-300 font-semibold"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDeleteBullet(idx)}
                  className="h-7 w-7 p-0 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 shrink-0"
                  title="Delete bullet"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
              <Textarea
                value={bullet.tailored}
                onChange={(e) => onUpdateBullet(idx, "tailored", e.target.value)}
                rows={2}
                placeholder="Accomplished [X] as measured by [Y] by doing [Z]..."
                className="text-xs bg-[#08090C] border-white/[0.08] text-white resize-y"
              />
              <Input
                value={bullet.rationale || ""}
                onChange={(e) => onUpdateBullet(idx, "rationale", e.target.value)}
                placeholder="JD Alignment Rationale (optional)"
                className="h-7 text-[11px] bg-[#08090C] border-white/[0.06] text-gray-400 italic"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Projects Editor */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <div>
            <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <Code className="w-3.5 h-3.5 text-indigo-400" />
              <span>Key Technical Projects</span>
            </label>
            <p className="text-[11px] text-muted-foreground">
              Showcase independent platforms, architecture, and systems (never duplicate employer companies)
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onAddProject}
            className="text-xs h-7 gap-1 border-dashed border-white/[0.15] bg-white/[0.02] text-gray-300 hover:text-white"
          >
            <Plus className="w-3 h-3 text-primary" />
            <span>Add Project</span>
          </Button>
        </div>

        <div className="space-y-3">
          {activeProjects.map((proj, idx) => {
            const bullets =
              proj.bullets && proj.bullets.length > 0
                ? proj.bullets
                : proj.description
                  ? [proj.description]
                  : [""];

            return (
              <div
                key={idx}
                className="p-3.5 rounded-xl border border-white/[0.08] bg-[#0C0E18] space-y-2.5 text-xs"
              >
                <div className="flex items-center justify-between gap-2">
                  <Input
                    value={proj.title}
                    onChange={(e) => onUpdateProject(idx, "title", e.target.value)}
                    placeholder="Project Title (e.g. wismannur.pro — Autonomous AI Fullstack Platform)"
                    className="h-7 text-xs bg-[#08090C] border-white/[0.1] text-indigo-300 font-semibold"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDeleteProject(idx)}
                    className="h-7 w-7 p-0 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 shrink-0"
                    title="Delete project"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
                <Input
                  value={(proj.technologies || []).join(", ")}
                  onChange={(e) =>
                    onUpdateProject(
                      idx,
                      "technologies",
                      e.target.value.split(",").map((s) => s.trim()).filter(Boolean)
                    )
                  }
                  placeholder="Technologies (comma separated, e.g. Next.js 16, React 19, Neon PostgreSQL)"
                  className="h-7 text-xs bg-[#08090C] border-white/[0.08] text-amber-300/90 font-mono"
                />

                <div className="space-y-2 pt-1 border-t border-white/[0.05]">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-slate-300">
                      Architectural Bullets ({bullets.length})
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => onAddProjectBullet(idx)}
                      className="text-[10px] h-6 px-2 text-indigo-300 hover:text-white gap-1"
                    >
                      <Plus className="w-2.5 h-2.5" /> Add Bullet
                    </Button>
                  </div>

                  <div className="space-y-2">
                    {bullets.map((bullet, bIdx) => (
                      <div key={bIdx} className="flex items-start gap-1.5">
                        <Textarea
                          value={bullet}
                          onChange={(e) => onUpdateProjectBullet(idx, bIdx, e.target.value)}
                          rows={2}
                          className="text-xs bg-[#08090C] border-white/[0.08] text-white resize-y flex-1"
                          placeholder={`Architectural bullet ${bIdx + 1}...`}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDeleteProjectBullet(idx, bIdx)}
                          className="h-7 w-7 p-0 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 shrink-0"
                          title="Delete bullet"
                          disabled={bullets.length <= 1}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Skills Editor */}
      <div className="space-y-3 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-emerald-400" />
              <span>Core Skills & Technologies ({activeSkills.length})</span>
            </label>
            <p className="text-[11px] text-muted-foreground">
              Skills are automatically prioritized based on target Job Description match. Use arrows to re-order.
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onResetSkillsToJd}
            className="text-xs h-7 text-indigo-300 hover:text-white hover:bg-white/[0.06] gap-1 self-start sm:self-auto"
            title="Reset to default JD-matched ranking order"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset JD Priority</span>
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Input
            value={newSkillInput}
            onChange={(e) => setNewSkillInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                onAddCustomSkill();
              }
            }}
            placeholder="Add new custom skill (e.g. Next.js 16, GraphQL, Kubernetes)..."
            className="h-8 text-xs bg-[#0C0E18] border-white/[0.1] text-white flex-1"
          />
          <Button
            type="button"
            size="sm"
            onClick={onAddCustomSkill}
            disabled={!newSkillInput.trim()}
            className="h-8 text-xs px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-medium gap-1"
          >
            <Plus className="w-3 h-3" /> Add
          </Button>
        </div>

        <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto p-2 bg-[#0C0E18] rounded-xl border border-white/[0.06]">
          {activeSkills.length === 0 ? (
            <span className="text-xs text-muted-foreground italic p-2">No skills included</span>
          ) : (
            activeSkills.map((skill, idx) => {
              const lower = skill.toLowerCase().trim();
              const isMatched = matchedSkillNamesSet.has(lower);
              const info = rankedSkillsMap.get(lower);

              return (
                <div
                  key={`${skill}-${idx}`}
                  className={`group inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono border transition-all ${
                    isMatched
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                      : "bg-[#131726] border-white/[0.08] text-slate-300"
                  }`}
                >
                  <span className="font-semibold">{skill}</span>
                  {isMatched && (
                    <span
                      className="text-[9px] px-1 py-0.2 rounded bg-emerald-500/20 text-emerald-200 font-sans font-bold"
                      title={info?.matchReasons?.join("; ") || "Explicitly mentioned in target job description"}
                    >
                      Match
                    </span>
                  )}
                  <div className="flex items-center gap-0.5 ml-1 opacity-70 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => onMoveSkill(idx, "left")}
                      className="p-0.5 hover:text-white text-slate-400 disabled:opacity-20 disabled:hover:text-slate-400"
                      title="Move earlier in CV"
                    >
                      <ChevronLeft className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === activeSkills.length - 1}
                      onClick={() => onMoveSkill(idx, "right")}
                      className="p-0.5 hover:text-white text-slate-400 disabled:opacity-20 disabled:hover:text-slate-400"
                      title="Move later in CV"
                    >
                      <ChevronRight className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onRemoveSkill(idx)}
                      className="p-0.5 hover:text-rose-400 text-slate-400 ml-0.5"
                      title="Remove skill from tailored export"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
