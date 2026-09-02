"use client";

import { Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type {
	JobApplication,
	JobEmploymentType,
	JobPlatform,
	WorkplaceType,
} from "@/services/job-tracker/types";

interface TabJobOverviewProps {
	application: JobApplication;
	formData: Partial<JobApplication>;
	isSaving: boolean;
	onFormChange: (data: Partial<JobApplication>) => void;
	onSave: () => Promise<void>;
}

export function TabJobOverview({
	application,
	formData,
	isSaving,
	onFormChange,
	onSave,
}: TabJobOverviewProps) {
	return (
		<Card className="border-border/80 shadow-sm">
			<CardHeader>
				<CardTitle className="text-base">Job Vacancy Information</CardTitle>
				<CardDescription className="text-xs">
					Edit core job specifications and recruiter contact information
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div className="space-y-1.5">
						<Label htmlFor="jobTitle" className="text-xs">Job Title</Label>
						<Input
							id="jobTitle"
							value={formData.jobTitle ?? application.jobTitle}
							onChange={(e) => onFormChange({ ...formData, jobTitle: e.target.value })}
							className="text-xs"
						/>
					</div>
					<div className="space-y-1.5">
						<Label htmlFor="companyName" className="text-xs">Company Name</Label>
						<Input
							id="companyName"
							value={formData.companyName ?? application.companyName}
							onChange={(e) => onFormChange({ ...formData, companyName: e.target.value })}
							className="text-xs"
						/>
					</div>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
					<div className="space-y-1.5">
						<Label htmlFor="platform" className="text-xs">Platform</Label>
						<Select
							value={formData.platform ?? application.platform}
							onValueChange={(v) => onFormChange({ ...formData, platform: v as JobPlatform })}
						>
							<SelectTrigger className="text-xs h-9">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="linkedin">LinkedIn</SelectItem>
								<SelectItem value="jobstreet">Jobstreet</SelectItem>
								<SelectItem value="glints">Glints</SelectItem>
								<SelectItem value="techinasia">Tech in Asia</SelectItem>
								<SelectItem value="indeed">Indeed</SelectItem>
								<SelectItem value="company_website">Company Website</SelectItem>
								<SelectItem value="referral">Referral</SelectItem>
								<SelectItem value="other">Other</SelectItem>
							</SelectContent>
						</Select>
					</div>

					<div className="space-y-1.5">
						<Label htmlFor="workplaceType" className="text-xs">Workplace Setting</Label>
						<Select
							value={formData.workplaceType ?? application.workplaceType}
							onValueChange={(v) => onFormChange({ ...formData, workplaceType: v as WorkplaceType })}
						>
							<SelectTrigger className="text-xs h-9">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="remote">Remote 🌐</SelectItem>
								<SelectItem value="hybrid">Hybrid 🏢</SelectItem>
								<SelectItem value="onsite">On-site 📍</SelectItem>
							</SelectContent>
						</Select>
					</div>

					<div className="space-y-1.5">
						<Label htmlFor="jobType" className="text-xs">Employment Type</Label>
						<Select
							value={formData.jobType ?? application.jobType}
							onValueChange={(v) => onFormChange({ ...formData, jobType: v as JobEmploymentType })}
						>
							<SelectTrigger className="text-xs h-9">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="full_time">Full-time</SelectItem>
								<SelectItem value="contract">Contract</SelectItem>
								<SelectItem value="part_time">Part-time</SelectItem>
								<SelectItem value="freelance">Freelance</SelectItem>
							</SelectContent>
						</Select>
					</div>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
					<div className="space-y-1.5">
						<Label htmlFor="salaryMin" className="text-xs">Min Salary</Label>
						<Input
							id="salaryMin"
							type="number"
							value={formData.salaryMin ?? application.salaryMin ?? ""}
							onChange={(e) =>
								onFormChange({
									...formData,
									salaryMin: e.target.value ? parseInt(e.target.value) : undefined,
								})
							}
							className="text-xs"
						/>
					</div>
					<div className="space-y-1.5">
						<Label htmlFor="salaryMax" className="text-xs">Max Salary</Label>
						<Input
							id="salaryMax"
							type="number"
							value={formData.salaryMax ?? application.salaryMax ?? ""}
							onChange={(e) =>
								onFormChange({
									...formData,
									salaryMax: e.target.value ? parseInt(e.target.value) : undefined,
								})
							}
							className="text-xs"
						/>
					</div>
					<div className="space-y-1.5">
						<Label htmlFor="salaryCurrency" className="text-xs">Currency</Label>
						<Input
							id="salaryCurrency"
							value={formData.salaryCurrency ?? application.salaryCurrency}
							onChange={(e) => onFormChange({ ...formData, salaryCurrency: e.target.value })}
							className="text-xs"
						/>
					</div>
				</div>

				<div className="space-y-1.5">
					<Label htmlFor="jobDescriptionRaw" className="text-xs">Raw Job Description</Label>
					<Textarea
						id="jobDescriptionRaw"
						rows={8}
						value={formData.jobDescriptionRaw ?? application.jobDescriptionRaw ?? ""}
						onChange={(e) => onFormChange({ ...formData, jobDescriptionRaw: e.target.value })}
						className="text-xs font-mono"
					/>
				</div>

				<div className="space-y-1.5">
					<Label htmlFor="notes" className="text-xs">Personal Application Notes</Label>
					<Textarea
						id="notes"
						rows={3}
						placeholder="Any personal thoughts, notes from recruiter chats, or reminders..."
						value={formData.notes ?? application.notes ?? ""}
						onChange={(e) => onFormChange({ ...formData, notes: e.target.value })}
						className="text-xs"
					/>
				</div>

				<div className="flex justify-end pt-4 border-t">
					<Button onClick={onSave} disabled={isSaving} className="gap-1.5">
						{isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
						Save Changes
					</Button>
				</div>
			</CardContent>
		</Card>
	);
}
