"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Award,
  Briefcase,
  ExternalLink,
  FolderGit2,
  GraduationCap,
  Loader2,
  Pencil,
  Plus,
  Save,
  Star,
  UserCheck,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { formatResumePeriod } from "@/lib/resume";
import { PUBLIC_SUPPORT_EMAIL } from "@/lib/site-url";
import { cn } from "@/lib/utils";
import { masterCvService, type MasterCvStudioSnapshot } from "@/services";

interface TabCurateCvProps {
  snapshot: MasterCvStudioSnapshot;
  onUpdated: () => void;
}

export function TabCurateCv({ snapshot, onUpdated }: TabCurateCvProps) {
  const { user, settings, experiences, education, skills, projects } = snapshot;

  const [displayName, setDisplayName] = useState(
    user?.displayName || settings.siteName || "Wisman Nur"
  );
  const [headline, setHeadline] = useState(
    settings.ogTagline || "Senior Fullstack & Autonomous AI Systems Engineer"
  );
  const [bio, setBio] = useState(
    user?.bio ||
      settings.footerBio ||
      "Senior Fullstack & Autonomous AI Systems Engineer with 7+ years of experience architecting high-performance web applications, sub-second edge runtimes, and autonomous multi-agent pipelines."
  );
  const [publicEmail, setPublicEmail] = useState(
    settings.publicEmail || user?.email || PUBLIC_SUPPORT_EMAIL
  );
  const [location, setLocation] = useState(
    settings.location || user?.location || "Bandung, ID"
  );

  const [isSavingHeader, setIsSavingHeader] = useState(false);
  const [togglingProjectId, setTogglingProjectId] = useState<string | null>(null);

  const handleSaveHeader = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingHeader(true);
    try {
      await masterCvService.updateExecutiveHeader({
        displayName,
        headline,
        bio,
        publicEmail,
        location,
      });
      toast.success("CV Header & Professional Summary berhasil diperbarui!");
      onUpdated();
    } catch (error) {
      console.error("Failed to save CV header:", error);
      toast.error("Gagal menyimpan CV Header.");
    } finally {
      setIsSavingHeader(false);
    }
  };

  const handleToggleProjectFeatured = async (projectId: string, nextFeatured: boolean) => {
    setTogglingProjectId(projectId);
    try {
      await masterCvService.toggleProjectFeatured(projectId, nextFeatured);
      toast.success(
        nextFeatured
          ? "Project ditambahkan ke unggulan /cv!"
          : "Project dihapus dari unggulan /cv."
      );
      onUpdated();
    } catch (error) {
      console.error("Failed to toggle project featured:", error);
      toast.error("Gagal mengubah status featured project.");
    } finally {
      setTogglingProjectId(null);
    }
  };

  const publishedProjects = projects.filter((p) => p.isPublished);
  const featuredProjectsCount = publishedProjects.filter((p) => p.isFeatured).length;

  return (
    <div className="space-y-6">
      {/* 1. Executive Header & Professional Summary Quick Editor */}
      <form
        onSubmit={handleSaveHeader}
        className="rounded-2xl border border-white/[0.08] bg-[#0C0E18]/90 p-6 space-y-5"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.08] pb-4">
          <div>
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-indigo-400" />
              <span>Executive Header & Professional Summary (/cv)</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Mengatur identitas utama, headline ATS, dan ringkasan eksekutif yang tampil di bagian
              atas halaman <code>/cv</code> serta dokumen PDF.
            </p>
          </div>

          <Button
            type="submit"
            disabled={isSavingHeader}
            size="sm"
            className="rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs h-9 px-4 shrink-0"
          >
            {isSavingHeader ? (
              <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5 mr-1.5" />
            )}
            Simpan Header & Summary
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Nama Lengkap di CV</label>
            <Input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="bg-[#080A12] border-white/[0.08] text-xs text-slate-100 h-9 rounded-xl"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">
              Executive Headline / Role Tagline
            </label>
            <Input
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              className="bg-[#080A12] border-white/[0.08] text-xs text-slate-100 h-9 rounded-xl"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Email Publik di CV</label>
            <Input
              value={publicEmail}
              onChange={(e) => setPublicEmail(e.target.value)}
              className="bg-[#080A12] border-white/[0.08] text-xs text-slate-100 h-9 rounded-xl"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Lokasi Domisili</label>
            <Input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="bg-[#080A12] border-white/[0.08] text-xs text-slate-100 h-9 rounded-xl"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-300">
            Professional Summary (Paragraf Pembuka CV)
          </label>
          <Textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={4}
            className="bg-[#080A12] border-white/[0.08] text-xs text-slate-100 leading-relaxed rounded-xl"
          />
        </div>
      </form>

      {/* 2. Key Technical Projects Curation for /cv */}
      <div className="rounded-2xl border border-white/[0.08] bg-[#0C0E18]/90 p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.08] pb-4">
          <div>
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <FolderGit2 className="w-4 h-4 text-teal-400" />
              <span>Kurasi Key Technical Projects di /cv ({featuredProjectsCount} Featured)</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Halaman <code>/cv</code> menampilkan maksimal 4 project teratas yang ditandai{" "}
              <strong>Featured</strong>. Aktifkan switch di bawah untuk memilih project yang masuk
              ke CV.
            </p>
          </div>

          <Button
            asChild
            variant="outline"
            size="sm"
            className="rounded-xl border-white/[0.1] text-xs h-9"
          >
            <Link href="/cms/projects">
              <Pencil className="w-3.5 h-3.5 mr-1.5" />
              Kelola Semua Projects
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {publishedProjects.map((proj, index) => {
            const isTopFourOnCv = index < 4;
            return (
              <div
                key={proj.id}
                className={cn(
                  "rounded-xl border p-4 flex flex-col justify-between gap-3 transition-all",
                  proj.isFeatured
                    ? "border-teal-500/30 bg-teal-500/[0.04]"
                    : "border-white/[0.06] bg-white/[0.01]"
                )}
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-slate-100">{proj.title}</span>
                        {isTopFourOnCv && (
                          <Badge className="bg-emerald-500/15 text-emerald-300 border-emerald-500/30 text-[10px] py-0">
                            Tampil di /cv #{index + 1}
                          </Badge>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1 pt-0.5">
                        {(proj.technologies || []).slice(0, 4).map((tech) => (
                          <span
                            key={tech}
                            className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/[0.04] text-slate-400 border border-white/[0.06]"
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Switch
                        checked={Boolean(proj.isFeatured)}
                        disabled={togglingProjectId === proj.id}
                        onCheckedChange={(checked) => handleToggleProjectFeatured(proj.id, checked)}
                        aria-label={`Toggle featured on CV for ${proj.title}`}
                      />
                      <Star
                        className={cn(
                          "w-4 h-4",
                          proj.isFeatured
                            ? "text-amber-400 fill-amber-400"
                            : "text-slate-600"
                        )}
                      />
                    </div>
                  </div>

                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                    {proj.summary}
                  </p>
                </div>

                <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-[11px] text-slate-500">
                  <span>Views: {proj.views ?? 0}</span>
                  <Link
                    href={`/cms/projects/form/${proj.id}`}
                    className="text-indigo-400 hover:text-indigo-300 font-medium inline-flex items-center gap-1"
                  >
                    <span>Edit Summary / Case Study</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Work Experience, Education & Skills Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Work Experience & Education */}
        <div className="rounded-2xl border border-white/[0.08] bg-[#0C0E18]/90 p-6 space-y-4">
          <div className="flex items-center justify-between gap-2 border-b border-white/[0.08] pb-3.5">
            <div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-indigo-400" />
                <span>
                  Work Experience ({experiences.filter((e) => e.isPublished).length}) & Education (
                  {education.filter((e) => e.isPublished).length})
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Urutan dan daftar riwayat karir yang aktif di <code>/cv</code>.
              </p>
            </div>
            <Button
              asChild
              variant="outline"
              size="sm"
              className="rounded-xl border-white/[0.1] text-xs h-8"
            >
              <Link href="/cms/resume">
                <Pencil className="w-3 h-3 mr-1.5" />
                Kelola Resume
              </Link>
            </Button>
          </div>

          <div className="space-y-2.5 max-h-[340px] overflow-y-auto pr-1">
            {experiences.map((exp) => (
              <div
                key={exp.id}
                className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-100 truncate">{exp.title}</span>
                    {!exp.isPublished && (
                      <Badge variant="outline" className="text-[10px] text-amber-400 py-0">
                        Hidden
                      </Badge>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-400 truncate">
                    {exp.organization} • {formatResumePeriod(exp)}
                  </div>
                </div>
                <Button
                  asChild
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2.5 text-xs text-indigo-300 hover:text-white shrink-0"
                >
                  <Link href={`/cms/resume/form/${exp.id}`}>Edit</Link>
                </Button>
              </div>
            ))}

            {education.map((edu) => (
              <div
                key={edu.id}
                className="rounded-xl border border-white/[0.06] bg-white/[0.01] p-3 flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <GraduationCap className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                    <span className="text-xs font-bold text-slate-200 truncate">{edu.title}</span>
                  </div>
                  <div className="text-[11px] text-slate-400 truncate">
                    {edu.organization} • {formatResumePeriod(edu)}
                  </div>
                </div>
                <Button
                  asChild
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2.5 text-xs text-indigo-300 hover:text-white shrink-0"
                >
                  <Link href={`/cms/resume/form/${edu.id}`}>Edit</Link>
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Technical Skills Matrix */}
        <div className="rounded-2xl border border-white/[0.08] bg-[#0C0E18]/90 p-6 space-y-4">
          <div className="flex items-center justify-between gap-2 border-b border-white/[0.08] pb-3.5">
            <div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-400" />
                <span>
                  Technical Skills & Competencies ({skills.filter((s) => s.isPublished).length}{" "}
                  Published)
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Daftar kompetensi teknis yang dirender di halaman <code>/cv</code> & ATS PDF.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                asChild
                variant="outline"
                size="sm"
                className="rounded-xl border-white/[0.1] text-xs h-8"
              >
                <Link href="/cms/skills/form">
                  <Plus className="w-3 h-3 mr-1" />
                  Tambah
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="sm"
                className="rounded-xl border-white/[0.1] text-xs h-8"
              >
                <Link href="/cms/skills">
                  <Pencil className="w-3 h-3 mr-1.5" />
                  Kelola
                </Link>
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 max-h-[340px] overflow-y-auto pr-1">
            {skills.map((skill) => (
              <Link
                key={skill.id}
                href={`/cms/skills/form/${skill.id}`}
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
                  skill.isPublished
                    ? "bg-white/[0.04] border-white/[0.08] text-slate-200 hover:border-indigo-500/40 hover:text-white"
                    : "bg-white/[0.01] border-dashed border-white/[0.06] text-slate-500"
                )}
              >
                <span>{skill.name}</span>
                {!skill.isPublished && <span className="text-[10px] text-amber-400">(Hidden)</span>}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
