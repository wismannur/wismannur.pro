import type { AiKnowledgeItem } from "../ai-knowledge/types";
import type { Project } from "../project/types";
import type { ResumeEntry } from "../resume/types";
import type { SiteSettings } from "../site-settings/types";
import type { Skill } from "../skills/types";
import type { UserProfile } from "../user/types";

export interface MasterCvStudioSnapshot {
  user: UserProfile | null;
  settings: SiteSettings;
  experiences: ResumeEntry[];
  education: ResumeEntry[];
  skills: Skill[];
  projects: Project[];
  knowledgeItems: AiKnowledgeItem[];
}

export interface MasterCvAuditParams {
  focusPrompt?: string;
  categoryFilter?: string;
}

export interface ProposedExperienceUpgrade {
  entryId: string;
  title: string;
  organization: string;
  period: string;
  currentDescription: string;
  proposedDescription: string;
  changeSummary: string;
  matchedSecondBrainTopics: string[];
}

export interface ProposedProjectUpgrade {
  projectId: string;
  title: string;
  technologies: string[];
  currentSummary: string;
  proposedSummary: string;
  currentlyFeatured: boolean;
  recommendFeatured: boolean;
  changeSummary: string;
  matchedSecondBrainTopics: string[];
}

export interface ProposedMissingSkill {
  name: string;
  source: string;
  recommendedSortOrder: number;
}

export interface MasterCvSyncProposal {
  alignmentScore: number;
  executiveAuditSummary: string;
  executiveProfile: {
    currentHeadline: string;
    proposedHeadline: string;
    currentBio: string;
    proposedBio: string;
    reasoning: string;
  };
  experienceUpgrades: ProposedExperienceUpgrade[];
  projectUpgrades: ProposedProjectUpgrade[];
  missingSkills: ProposedMissingSkill[];
}

export interface ApplyMasterCvSyncInput {
  updateExecutiveProfile?: {
    headline?: string;
    bio?: string;
  };
  experienceUpdates?: Array<{
    entryId: string;
    description: string;
  }>;
  projectUpdates?: Array<{
    projectId: string;
    summary?: string;
    isFeatured?: boolean;
  }>;
  skillsToAdd?: Array<{
    name: string;
    sortOrder?: number;
  }>;
}

export interface ApplyMasterCvSyncResult {
  updatedProfile: boolean;
  updatedExperiencesCount: number;
  updatedProjectsCount: number;
  addedSkillsCount: number;
}

export interface UpdateCvHeaderInput {
  displayName: string;
  headline: string;
  bio: string;
  publicEmail?: string;
  location?: string;
}
