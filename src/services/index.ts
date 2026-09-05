// Real (Drizzle/Neon-backed) services — plain objects delegating to per-domain
// server actions, keeping the legacy call surface.
export { availabilityService } from "./availability";
export { blogService } from "./blog";
export { contactService } from "./contacts";
export { dashboardService } from "./dashboard";
export { faqsService } from "./faqs";
export { pageCopyService } from "./page-copy";
export { processStepsService } from "./process-steps";
export { projectService } from "./project";
export { resumeService } from "./resume";
export { serviceCatalogService } from "./service-catalog";
export { serviceRequestService } from "./service-requests";
export { hireRequestService } from "./hire-requests";
export { sitePagesService } from "./site-pages";
export { siteSettingsService } from "./site-settings";
export { skillsService } from "./skills";
export { testimonialsService } from "./testimonials";
export { userService } from "./user";
export { jobTrackerService } from "./job-tracker";
export { jobOutreachService } from "./job-outreaches";
export { inquiryMessagesService } from "./inquiry-messages";
export { aiKnowledgeService } from "./ai-knowledge";
export { jobDiscoveryService } from "./job-discovery";

// Export all domain types
export * from "./availability/types";
export * from "./blog/types";
export * from "./contacts/types";
export * from "./dashboard/types";
export * from "./faqs/types";
export * from "./page-copy/types";
export * from "./process-steps/types";
export * from "./project/types";
export * from "./resume/types";
export * from "./service-catalog/types";
export * from "./service-requests/types";
export * from "./hire-requests/types";
export * from "./site-pages/types";
export * from "./site-settings/types";
export * from "./skills/types";
export * from "./testimonials/types";
export * from "./user/types";
export * from "./job-tracker/types";
export * from "./job-outreaches/types";
export * from "./inquiry-messages/types";
export * from "./ai-knowledge/types";
export * from "./job-discovery/types";
