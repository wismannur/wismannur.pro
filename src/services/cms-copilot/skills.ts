export type CopilotSkillCategory = "knowledge" | "career" | "finder" | "content" | "assistant";

export interface CopilotSkillDefinition {
  id: string;
  command: string; // e.g. "/my-second-brain"
  label: string;
  description: string;
  category: CopilotSkillCategory;
  categoryLabel: string;
  iconName: "Brain" | "FileText" | "Search" | "PenTool" | "Sparkles";
  placeholder: string;
  status: "active" | "planned";
  badgeText?: string;
  samplePrompt?: string;
}

export const COPILOT_SKILLS: CopilotSkillDefinition[] = [
  {
    id: "my-second-brain",
    command: "/my-second-brain",
    label: "My Second Brain",
    description: "Check seluruh knowledge items Second Brain & riwayat percakapan sesi Copilot",
    category: "knowledge",
    categoryLabel: "Knowledge Engine",
    iconName: "Brain",
    placeholder: "<tuliskan ide, cerita arsitektur, pengalaman karir, atau pertanyaan di sini>",
    status: "active",
    badgeText: "Active Skill",
    samplePrompt: "Periksa cerita implementasi CQRS ini dan cross-check dengan wawasan Second Brain yang sudah tersimpan",
  },
  {
    id: "tailor-cv",
    command: "/tailor-cv",
    label: "AI CV Tailor",
    description: "Audit kesesuaian lowongan & tailor resume Google XYZ grounded in Second Brain",
    category: "career",
    categoryLabel: "Career Hub",
    iconName: "FileText",
    placeholder: "<masukkan job description atau link lowongan>",
    status: "planned",
    badgeText: "Fase Berikutnya",
    samplePrompt: "Tailor CV saya untuk lowongan Staff Frontend Engineer di target company",
  },
  {
    id: "audit-prospect",
    command: "/audit-prospect",
    label: "Instant Prospect Audit",
    description: "Jalankan instant technical, performance & UX audit calon klien prospect",
    category: "finder",
    categoryLabel: "Finder Project Hub",
    iconName: "Search",
    placeholder: "<nama perusahaan atau URL website prospect>",
    status: "planned",
    badgeText: "Fase Berikutnya",
    samplePrompt: "Jalankan instant technical & UX performance audit untuk prospek ini",
  },
  {
    id: "draft-blog",
    command: "/draft-blog",
    label: "Draft Technical Blog",
    description: "Draft artikel MDX teknis mendalam dengan tone of voice persona Kang Wisman",
    category: "content",
    categoryLabel: "Content Catalog",
    iconName: "PenTool",
    placeholder: "<topik teknis atau outline artikel blog>",
    status: "planned",
    badgeText: "Fase Berikutnya",
    samplePrompt: "Draft artikel teknis mendalam tentang state machine pattern di React 19",
  },
];

export function getSkillByCommand(command: string): CopilotSkillDefinition | undefined {
  return COPILOT_SKILLS.find(
    (s) => s.command.toLowerCase() === command.trim().toLowerCase()
  );
}

export function extractSkillFromPrompt(prompt: string): {
  skill?: CopilotSkillDefinition;
  cleanedPrompt: string;
} {
  const trimmed = prompt.trim();
  if (!trimmed.startsWith("/")) {
    return { cleanedPrompt: prompt };
  }

  const match = trimmed.match(/^(\/[a-zA-Z0-9_-]+)(?:\s+([\s\S]*))?$/);
  if (!match) {
    return { cleanedPrompt: prompt };
  }

  const command = match[1];
  const rest = match[2] || "";
  const skill = getSkillByCommand(command);

  return {
    skill,
    cleanedPrompt: rest,
  };
}
