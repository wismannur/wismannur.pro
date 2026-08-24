"use client";

import { SectionHeader } from "@/components/ui/section-header";
import { formatResumePeriod } from "@/lib/resume";
import { trackEvent } from "@/lib/umami";
import type { ResumeEntry } from "@/services/resume/types";
import { BriefcaseIcon, Calendar, GraduationCap, MapPin } from "lucide-react";
import { useState } from "react";

type ResumeSectionProps = {
	experiences: ResumeEntry[];
	education: ResumeEntry[];
};

// Work experience + education timelines on /about. Both lists come from
// `resume_entries` and are managed at /cms/resume; the tab state is the only
// reason this stays a client component.
export function ResumeSection({ experiences, education }: ResumeSectionProps) {
	const [activeTab, setActiveTab] = useState("experience");

	const handleTabChange = (tab: "experience" | "education") => {
		setActiveTab(tab);
		trackEvent("about-resume-tab-change", { tab });
	};

	return (
		<section className="py-24 relative">
			<div className="container max-w-7xl px-4">
				<SectionHeader
					title={activeTab === "experience" ? "Work Experience" : "Education & Certification"}
					subtitle={activeTab === "experience" ? "My Journey" : "My Academic Background"}
					description="Explore my professional experience and educational background"
					className="mb-16 text-center"
				/>

				{/* Interactive Tabs */}
				<div className="flex justify-center mb-12">
					<div className="inline-flex p-1 rounded-full bg-muted">
						<button
							onClick={() => handleTabChange("experience")}
							data-umami-event="about-resume-tab-click"
							data-umami-event-tab="experience"
							className={`flex items-center gap-2 px-6 py-3 rounded-full text-sm font-medium transition-all ${
								activeTab === "experience"
									? "bg-primary text-primary-foreground shadow-md"
									: "hover:bg-muted-foreground/10"
							}`}
						>
							<BriefcaseIcon size={16} />
							Experience
						</button>
						<button
							onClick={() => handleTabChange("education")}
							data-umami-event="about-resume-tab-click"
							data-umami-event-tab="education"
							className={`flex items-center gap-2 px-6 py-3 rounded-full text-sm font-medium transition-all ${
								activeTab === "education"
									? "bg-primary text-primary-foreground shadow-md"
									: "hover:bg-muted-foreground/10"
							}`}
						>
							<GraduationCap size={16} />
							Education
						</button>
					</div>
				</div>

				{/* Experience Content */}
				<div className={`${activeTab === "experience" ? "block" : "hidden"}`}>
					{experiences.length === 0 ? (
						<p className="text-center text-muted-foreground">
							No work experience has been published yet.
						</p>
					) : (
						<div className="relative">
							{/* Timeline line */}
							<div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary/80 via-primary/50 to-primary/20 hidden md:block"></div>

							<div className="space-y-20">
								{experiences.map((exp, index) => (
									<div key={exp.id} className="relative">
										<div
											className={`md:flex items-stretch ${index % 2 === 0 ? "" : "md:flex-row-reverse"}`}
										>
											{/* Timeline dot */}
											<div className="absolute left-1/2 top-0 -translate-x-1/2 hidden md:flex items-center justify-center">
												<div className="w-14 h-14 rounded-full bg-primary border-4 border-background flex items-center justify-center z-10 shadow-lg">
													<BriefcaseIcon size={22} className="text-primary-foreground" />
												</div>
											</div>

											{/* Date pill - mobile only */}
											<div className="md:hidden mb-4 flex justify-center">
												<div className="px-4 py-1.5 bg-primary/10 text-primary text-sm rounded-full font-medium inline-flex items-center">
													<Calendar size={14} className="mr-1.5" />
													{formatResumePeriod(exp)}
												</div>
											</div>

											{/* Content */}
											<div className="md:w-1/2 md:px-8">
												<div
													className={`relative overflow-hidden bg-background border border-border/50 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-500 group ${
														index % 2 === 0 ? "md:rounded-tr-none" : "md:rounded-tl-none"
													}`}
												>
													{/* Top accent gradient */}
													<div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-primary/80 via-primary/50 to-primary/30"></div>

													{/* Background pattern */}
													<div className="absolute inset-0 bg-grid-pattern opacity-[0.02] pointer-events-none"></div>

													{/* Content wrapper */}
													<div className="p-7 relative">
														{/* Title and company */}
														<div className="pr-16">
															<h3 className="text-2xl font-bold mb-1 group-hover:text-primary transition-colors duration-300">
																{exp.title}
															</h3>
															<div className="text-lg font-medium text-muted-foreground group-hover:text-foreground transition-colors duration-300">
																{exp.organization}
															</div>
														</div>

														{/* Info badges */}
														<div className="flex flex-wrap gap-3 mt-5">
															<div className="hidden md:flex items-center gap-1.5 px-4 py-2 bg-primary/5 dark:bg-muted rounded-full text-sm font-medium">
																<Calendar size={15} className="text-primary" />
																<span>{formatResumePeriod(exp)}</span>
															</div>

															{exp.location && (
																<div className="flex items-center gap-1.5 px-4 py-2 bg-primary/5 dark:bg-muted rounded-full text-sm font-medium">
																	<MapPin size={15} className="text-primary" />
																	<span>{exp.location}</span>
																</div>
															)}
														</div>

														{/* Description with PRAQ format */}
														{exp.description && (
															<div className="mt-5 text-muted-foreground leading-relaxed">
																{exp.description.split(". ").map((sentence, i) => {
																	if (
																		sentence.startsWith("Problem:") ||
																		sentence.startsWith("Role:") ||
																		sentence.startsWith("Action:") ||
																		sentence.startsWith("Quantifiable results:")
																	) {
																		const [prefix, content] = sentence.split(": ");
																		return (
																			<p key={i} className="mb-2">
																				<span className="font-semibold text-primary">
																					{prefix}:{" "}
																				</span>
																				{content}
																			</p>
																		);
																	}
																	return (
																		<p key={i} className="mb-2">
																			{sentence}
																		</p>
																	);
																})}
															</div>
														)}

														{/* Hover indicator */}
														<div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/0 via-primary/50 to-primary/0 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out"></div>
													</div>
												</div>
											</div>

											{/* Empty space for timeline layout */}
											<div className="hidden md:block md:w-1/2"></div>
										</div>
									</div>
								))}
							</div>
						</div>
					)}
				</div>

				{/* Education Content */}
				<div className={`${activeTab === "education" ? "block" : "hidden"}`}>
					{education.length === 0 ? (
						<p className="text-center text-muted-foreground">
							No education has been published yet.
						</p>
					) : (
						<div className="grid gap-8 md:grid-cols-3">
							{education.map((edu) => (
								<div
									key={edu.id}
									className="group bg-background border border-border/50 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
								>
									<div className="h-3 bg-gradient-to-r from-primary/80 to-primary/40"></div>
									<div className="p-6">
										<div className="flex justify-between items-start mb-4">
											<div className="p-3 bg-primary/10 rounded-xl text-primary">
												<GraduationCap size={24} />
											</div>
											<div className="px-4 py-1.5 bg-primary/10 text-primary text-sm rounded-full font-medium inline-flex items-center">
												<Calendar size={14} className="mr-1.5" />
												{formatResumePeriod(edu)}
											</div>
										</div>

										<h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">
											{edu.title}
										</h3>

										<div className="text-lg font-medium mb-3">{edu.organization}</div>

										{edu.description && <p className="text-muted-foreground">{edu.description}</p>}
									</div>
								</div>
							))}
						</div>
					)}
				</div>
			</div>
		</section>
	);
}
