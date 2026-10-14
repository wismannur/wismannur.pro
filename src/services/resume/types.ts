export type {
  ResumeEntry,
  ResumeKind,
  NewResumeEntry,
  UpdateResumeEntry,
} from "@wismannur/cms-contracts";

export interface ResumeSections {
  experiences: import("@wismannur/cms-contracts").ResumeEntry[];
  education: import("@wismannur/cms-contracts").ResumeEntry[];
}
