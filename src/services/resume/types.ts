export type {
  ResumeEntry,
  ResumeKind,
  NewResumeEntry,
  UpdateResumeEntry,
} from "@wismannur.pro/cms-contracts";

export interface ResumeSections {
  experiences: import("@wismannur.pro/cms-contracts").ResumeEntry[];
  education: import("@wismannur.pro/cms-contracts").ResumeEntry[];
}
