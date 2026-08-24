"use client";

import { Button } from "@/components/ui/button";
import { SectionHeader } from "@/components/ui/section-header";
import { SpotlightCard } from "@/components/ui/spotlight-card";
import { formatResumePeriod } from "@/lib/resume";
import { trackEvent } from "@/lib/umami";
import type { ResumeEntry } from "@/services/resume/types";
import { ArrowRight, BriefcaseIcon, Calendar, FileText, GraduationCap, MapPin } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

type ResumeSectionProps = {
	experiences: ResumeEntry[];
	education: ResumeEntry[];
};

export function ResumeSection({ experiences, education }: ResumeSectionProps) {
	const [activeTab, setActiveTab] = useState<"experience" | "education">("experience");

	const handleTabChange = (tab: "experience" | "education") => {
		setActiveTab(tab);
		trackEvent("about-resume-tab-change", { tab });
	};

	return (
		<section className="py-12 relative">
			<div className="container px-4 max-w-6xl mx-auto">
				<SectionHeader
					title={activeTab === "experience" ? "Work Experience" : "Education & Certification"}
					subtitle={activeTab === "experience" ? "Career Journey" : "Academic Background"}
					description="Explore my professional experience, impact, and educational credentials"
					className="mb-12 text-center"
				/>

				{/* Interactive Tabs */}
				<div className="flex justify-center mb-12">
					<div className="inline-flex p-1.5 rounded-full bg-muted/70 border border-border/50">
						<button
							type="button"
							onClick={() => handleTabChange("experience")}
							data-umami-event="about-resume-tab-click"
							data-umami-event-tab="experience"
							className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-xs md:text-sm font-semibold transition-all ${
								activeTab === "experience"
									? "bg-primary text-primary-foreground shadow-md"
									: "text-muted-foreground hover:text-foreground"
							}`}
						>
							<BriefcaseIcon size={15} />
							Experience
						</button>
						<button
							type="button"
							onClick={() => handleTabChange("education")}
							data-umami-event="about-resume-tab-click"
							data-umami-event-tab="education"
							className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-xs md:text-sm font-semibold transition-all ${
								activeTab === "education"
									? "bg-primary text-primary-foreground shadow-md"
									: "text-muted-foreground hover:text-foreground"
							}`}
						>
							<GraduationCap size={15} />
							Education
						</button>
					</div>
				</div>

				{/* Experience Content */}
				{activeTab === "experience" && (
					<div>
						{experiences.length === 0 ? (
							<p className="text-center text-muted-foreground py-8">
								No work experience has been published yet.
							</p>
						) : (
							<div className="relative">
								{/* Center Timeline line */}
								<div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary/80 via-primary/40 to-transparent hidden md:block -translate-x-1/2" />

								<div className="space-y-12 md:space-y-16">
									{experiences.map((exp, index) => (
										<div key={exp.id} className="relative">
											<div
												className={`md:flex items-center ${index % 2 === 0 ? "" : "md:flex-row-reverse"}`}
											>
												{/* Center Timeline dot */}
												<div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden md:flex items-center justify-center z-20">
													<div className="w-10 h-10 rounded-full bg-primary border-4 border-background flex items-center justify-center shadow-lg">
														<BriefcaseIcon size={16} className="text-primary-foreground" />
													</div>
												</div>

												{/* Card Container */}
												<div className="md:w-1/2 md:px-8">
													<SpotlightCard className="p-6 md:p-7 rounded-2xl bg-card/70 border border-border/50 hover:border-primary/40 hover:shadow-xl transition-all duration-300">
														<div className="flex flex-wrap items-center justify-between gap-2 mb-3">
															<div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
																<Calendar size={12} />
																<span>{formatResumePeriod(exp)}</span>
															</div>

															{exp.location && (
																<div className="inline-flex items-center gap-1 text-xs text-muted-foreground">
																	<MapPin size={12} className="text-primary/70" />
																	<span>{exp.location}</span>
																</div>
															)}
														</div>

														<h3 className="text-xl font-bold tracking-tight text-foreground group-hover:text-primary transition-colors">
															{exp.title}
														</h3>

														<div className="text-sm font-semibold text-primary/90 mt-0.5 mb-4">
															{exp.organization}
														</div>

														{exp.description && (
															<div className="text-sm text-muted-foreground leading-relaxed space-y-2 border-t border-border/40 pt-4">
																{exp.description.split(". ").map((sentence, i) => {
																	if (
																		sentence.startsWith("Problem:") ||
																		sentence.startsWith("Role:") ||
																		sentence.startsWith("Action:") ||
																		sentence.startsWith("Quantifiable results:")
																	) {
																		const [prefix, content] = sentence.split(": ");
																		return (
																			<p key={i}>
																				<span className="font-semibold text-foreground">
																					{prefix}:{" "}
																				</span>
																				{content}
																			</p>
																		);
																	}
																	return <p key={i}>{sentence}</p>;
																})}
															</div>
														)}
													</SpotlightCard>
												</div>

												<div className="hidden md:block md:w-1/2" />
											</div>
										</div>
									))}
								</div>
							</div>
						)}
					</div>
				)}

				{/* Education Content */}
				{activeTab === "education" && (
					<div>
						{education.length === 0 ? (
							<p className="text-center text-muted-foreground py-8">
								No education credentials have been published yet.
							</p>
						) : (
							<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
								{education.map((edu) => (
									<SpotlightCard
										key={edu.id}
										className="p-6 md:p-7 rounded-2xl bg-card/70 border border-border/50 hover:border-primary/40 hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
									>
										<div>
											<div className="flex justify-between items-start mb-4">
												<div className="p-3 bg-primary/10 rounded-2xl text-primary">
													<GraduationCap size={22} />
												</div>
												<span className="px-3 py-1 bg-primary/10 text-primary text-xs rounded-full font-semibold border border-primary/20 inline-flex items-center gap-1">
													<Calendar size={12} />
													{formatResumePeriod(edu)}
												</span>
											</div>

											<h3 className="text-lg font-bold mb-1 text-foreground group-hover:text-primary transition-colors">
												{edu.title}
											</h3>

											<div className="text-sm font-medium text-muted-foreground mb-3">
												{edu.organization}
											</div>

											{edu.description && (
												<p className="text-xs md:text-sm text-muted-foreground leading-relaxed border-t border-border/40 pt-3">
													{edu.description}
												</p>
											)}
										</div>
									</SpotlightCard>
								))}
							</div>
						)}
					</div>
				)}

				{/* View Full CV Link */}
				<div className="mt-14 text-center">
					<Button
						asChild
						variant="outline"
						size="lg"
						className="rounded-full px-7 h-11 text-xs md:text-sm font-semibold border-border/60 bg-card/70 backdrop-blur-sm hover:bg-primary/10 hover:border-primary/40 hover:text-primary transition-all duration-300 shadow-sm hover:shadow-md group"
					>
						<Link href="/cv" data-umami-event="about-view-full-cv-click" className="inline-flex items-center gap-2">
							<FileText size={15} className="text-primary" />
							<span>View & Download Printable CV (PDF)</span>
							<ArrowRight
								size={15}
								className="group-hover:translate-x-1 transition-transform duration-200 text-primary"
							/>
						</Link>
					</Button>
				</div>
			</div>
		</section>
	);
}
