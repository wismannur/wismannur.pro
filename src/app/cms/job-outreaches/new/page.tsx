"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
	ArrowLeft,
	Briefcase,
	Building2,
	Check,
	FileText,
	Globe,
	Linkedin,
	Loader2,
	Mail,
	Paperclip,
	Send,
	Sparkles,
	UploadCloud,
	User,
	X,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
	jobOutreachService,
	jobTrackerService,
	type JobOutreachAttachment,
	type NewJobOutreach,
	type OutreachType,
} from "@/services";

export default function NewOutreachPage() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const queryClient = useQueryClient();
	const prefilledJobAppId = searchParams.get("jobAppId") || "none";

	const fileInputRef = useRef<HTMLInputElement>(null);
	const hasAutoFilledRef = useRef(false);

	const [companyName, setCompanyName] = useState("");
	const [companyWebsite, setCompanyWebsite] = useState("");
	const [jobTitle, setJobTitle] = useState("");
	const [contactName, setContactName] = useState("");
	const [contactRole, setContactRole] = useState("");
	const [contactEmail, setContactEmail] = useState("");
	const [contactLinkedin, setContactLinkedin] = useState("");
	const [outreachType, setOutreachType] = useState<OutreachType>("cold_pitch");
	const [selectedJobAppId, setSelectedJobAppId] = useState<string>(prefilledJobAppId);

	const [subject, setSubject] = useState("");
	const [body, setBody] = useState("");
	const [notes, setNotes] = useState("");
	const [customPrompt, setCustomPrompt] = useState("");

	const [attachments, setAttachments] = useState<JobOutreachAttachment[]>([]);
	const [isUploading, setIsUploading] = useState(false);
	const [isGeneratingAi, setIsGeneratingAi] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);

	// Fetch existing job applications for dropdown
	const { data: jobApplications = [] } = useQuery({
		queryKey: ["jobApplicationsForOutreachNew"],
		queryFn: () => jobTrackerService.getAll(),
	});

	// Pre-fill fields if linked to a job application
	useEffect(() => {
		if (
			!hasAutoFilledRef.current &&
			selectedJobAppId &&
			selectedJobAppId !== "none" &&
			jobApplications.length > 0
		) {
			const app = jobApplications.find((a) => a.id === selectedJobAppId);
			if (app) {
				hasAutoFilledRef.current = true;
				const timer = setTimeout(() => {
					setCompanyName((prev) => prev || app.companyName);
					setJobTitle((prev) => prev || app.jobTitle);
					if (app.companyWebsite) setCompanyWebsite((prev) => prev || app.companyWebsite || "");
					if (app.contactName) setContactName((prev) => prev || app.contactName || "");
					if (app.contactEmail) setContactEmail((prev) => prev || app.contactEmail || "");
				}, 0);
				return () => clearTimeout(timer);
			}
		}
	}, [selectedJobAppId, jobApplications]);



	const handleSelectJobApp = (appId: string) => {
		setSelectedJobAppId(appId);
		if (appId !== "none") {
			const app = jobApplications.find((a) => a.id === appId);
			if (app) {
				setCompanyName(app.companyName);
				setJobTitle(app.jobTitle);
				if (app.companyWebsite) setCompanyWebsite(app.companyWebsite);
				if (app.contactName) setContactName(app.contactName);
				if (app.contactEmail) setContactEmail(app.contactEmail);
			}
		}
	};

	const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const files = e.target.files;
		if (!files || files.length === 0) return;

		const file = files[0];
		setIsUploading(true);
		try {
			const formData = new FormData();
			formData.append("file", file);

			const uploaded = await jobOutreachService.uploadAttachment(formData);
			setAttachments((prev) => [...prev, uploaded]);
			toast.success(`File "${file.name}" berhasil diunggah!`);
		} catch (err) {
			console.error("Upload error:", err);
			toast.error("Gagal mengunggah file attachment.");
		} finally {
			setIsUploading(false);
			if (fileInputRef.current) fileInputRef.current.value = "";
		}
	};

	const handleRemoveAttachment = (indexToRemove: number) => {
		setAttachments((prev) => prev.filter((_, idx) => idx !== indexToRemove));
	};

	const handleGenerateAi = async () => {
		if (!companyName.trim() || !jobTitle.trim()) {
			toast.error("Mohon isi Company Name dan Job Title terlebih dahulu.");
			return;
		}

		setIsGeneratingAi(true);
		try {
			const selectedApp =
				selectedJobAppId !== "none"
					? jobApplications.find((a) => a.id === selectedJobAppId)
					: undefined;

			const result = await jobOutreachService.generateAiDraft({
				type: outreachType,
				companyName: companyName.trim(),
				jobTitle: jobTitle.trim(),
				contactName: contactName.trim() || "Hiring Team",
				contactRole: contactRole.trim() || undefined,
				companyWebsite: companyWebsite.trim() || undefined,
				jobDescriptionSnippet: selectedApp?.jobDescriptionRaw || undefined,
				customInstructions: customPrompt.trim() || undefined,
			});

			setSubject(result.subject);
			setBody(result.body);
			toast.success("Draf email berhasil dibuat oleh AI!");
		} catch (err) {
			console.error("AI Generation Error:", err);
			toast.error("Gagal membuat draf AI. Silakan coba lagi.");
		} finally {
			setIsGeneratingAi(false);
		}
	};

	const handleSubmit = async (sendImmediately: boolean) => {
		if (!companyName.trim() || !jobTitle.trim() || !contactName.trim() || !contactEmail.trim()) {
			toast.error("Nama Perusahaan, Posisi, Nama Kontak, dan Email Kontak wajib diisi.");
			return;
		}

		if (!subject.trim() || !body.trim()) {
			toast.error("Subjek dan isi email wajib diisi.");
			return;
		}

		setIsSubmitting(true);
		try {
			const payload: NewJobOutreach = {
				jobApplicationId: selectedJobAppId !== "none" ? selectedJobAppId : undefined,
				companyName: companyName.trim(),
				companyWebsite: companyWebsite.trim() || undefined,
				jobTitle: jobTitle.trim(),
				contactName: contactName.trim(),
				contactRole: contactRole.trim() || undefined,
				contactEmail: contactEmail.trim().toLowerCase(),
				contactLinkedin: contactLinkedin.trim() || undefined,
				outreachType,
				status: sendImmediately ? "sent" : "draft",
				subject: subject.trim(),
				body: body.trim(),
				notes: notes.trim() || undefined,
				attachments: attachments.length > 0 ? attachments : undefined,
			};

			const created = await jobOutreachService.create(payload, sendImmediately);

			toast.success(
				sendImmediately
					? `Email berhasil dikirim ke ${contactEmail} via hi@wismannur.pro!`
					: "Draf outreach berhasil disimpan.",
			);

			queryClient.invalidateQueries({ queryKey: ["jobOutreaches"] });
			queryClient.invalidateQueries({ queryKey: ["jobOutreachesAnalytics"] });

			router.push(`/cms/job-outreaches/${created.id}`);

		} catch (err) {
			console.error("Submit outreach error:", err);
			toast.error("Gagal menyimpan / mengirim outreach.");
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<div className="space-y-6 pb-16 max-w-7xl mx-auto">
			{/* Top Navigation */}
			<div className="flex items-center justify-between">
				<Button
					asChild
					variant="ghost"
					size="sm"
					className="gap-2 -ml-2 text-muted-foreground hover:text-foreground text-xs font-medium"
				>
					<Link href="/cms/job-outreaches">
						<ArrowLeft className="h-4 w-4" /> Kembali ke Job Outreaches
					</Link>
				</Button>
			</div>

			{/* Top Header */}
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/50 pb-5">
				<div>
					<h1 className="text-xl sm:text-2xl font-bold tracking-tight flex items-center gap-2">
						<Send className="h-6 w-6 text-primary" />
						New Job Outreach & Cold Pitch
					</h1>
					<p className="text-xs sm:text-sm text-muted-foreground mt-1">
						Kirim pesan langsung ke recruiter / engineering lead via <strong className="text-foreground">hi@wismannur.pro</strong>.
					</p>
				</div>

				<div className="flex items-center gap-2.5">
					<Button
						type="button"
						variant="outline"
						onClick={() => handleSubmit(false)}
						disabled={isSubmitting || isGeneratingAi}
						className="h-9 font-medium"
					>
						Save as Draft
					</Button>
					<Button
						type="button"
						onClick={() => handleSubmit(true)}
						disabled={isSubmitting || isGeneratingAi}
						className="h-9 gap-2 font-medium"
					>
						{isSubmitting ? (
							<>
								<Loader2 className="h-4 w-4 animate-spin" /> Mengirim...
							</>
						) : (
							<>
								<Send className="h-4 w-4" /> Send Email via Resend
							</>
						)}
					</Button>
				</div>
			</div>


			{/* Main Two-Column Layout */}
			<div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
				{/* Left Column: Target & Details (5 cols) */}
				<div className="lg:col-span-5 space-y-6">
					{/* Link to Job Tracker Card */}
					<Card className="border-border/60 shadow-sm">
						<CardHeader className="p-4 pb-3">
							<CardTitle className="text-sm font-bold flex items-center gap-2 text-foreground">
								<Briefcase className="h-4 w-4 text-primary" />
								Hubungkan ke Job Tracker
							</CardTitle>
							<CardDescription className="text-xs">
								Pilih lowongan yang sudah Anda catat di Job Tracker untuk auto-fill informasi.
							</CardDescription>
						</CardHeader>
						<CardContent className="p-4 pt-0">
							<Select value={selectedJobAppId} onValueChange={handleSelectJobApp}>
								<SelectTrigger className="w-full bg-background text-xs h-9">
									<SelectValue placeholder="Pilih aplikasi..." />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="none">-- Standalone Outreach --</SelectItem>
									{jobApplications.map((app) => (
										<SelectItem key={app.id} value={app.id}>
											{app.companyName} - {app.jobTitle}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</CardContent>
					</Card>

					{/* Company & Role Details Card */}
					<Card className="border-border/60 shadow-sm">
						<CardHeader className="p-4 pb-3">
							<CardTitle className="text-sm font-bold flex items-center gap-2 text-foreground">
								<Building2 className="h-4 w-4 text-primary" />
								Perusahaan & Posisi Target
							</CardTitle>
						</CardHeader>
						<CardContent className="p-4 pt-0 space-y-3.5">
							<div className="space-y-1.5">
								<Label htmlFor="companyName" className="text-xs font-semibold">
									Company Name *
								</Label>
								<div className="relative">
									<Building2 className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
									<Input
										id="companyName"
										placeholder="e.g. Tokopedia / Google / Stripe"
										className="pl-9 text-xs h-9"
										value={companyName}
										onChange={(e) => setCompanyName(e.target.value)}
									/>
								</div>
							</div>

							<div className="space-y-1.5">
								<Label htmlFor="jobTitle" className="text-xs font-semibold">
									Job Title / Target Role *
								</Label>
								<div className="relative">
									<Briefcase className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
									<Input
										id="jobTitle"
										placeholder="e.g. Senior Frontend Engineer"
										className="pl-9 text-xs h-9"
										value={jobTitle}
										onChange={(e) => setJobTitle(e.target.value)}
									/>
								</div>
							</div>

							<div className="space-y-1.5">
								<Label htmlFor="companyWebsite" className="text-xs">
									Company Website (Optional)
								</Label>
								<div className="relative">
									<Globe className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
									<Input
										id="companyWebsite"
										placeholder="https://company.com"
										className="pl-9 text-xs h-9"
										value={companyWebsite}
										onChange={(e) => setCompanyWebsite(e.target.value)}
									/>
								</div>
							</div>

							<div className="space-y-1.5">
								<Label className="text-xs font-semibold">Outreach Type</Label>
								<Select
									value={outreachType}
									onValueChange={(val) => setOutreachType(val as OutreachType)}
								>
									<SelectTrigger className="bg-background text-xs h-9">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="cold_pitch">
											🚀 Cold Pitch to Hiring Manager / Lead
										</SelectItem>
										<SelectItem value="direct_apply">
											📄 Direct Application via Email
										</SelectItem>
										<SelectItem value="follow_up">
											🔄 Follow-up Cadence (Re-engagement)
										</SelectItem>
									</SelectContent>
								</Select>
							</div>
						</CardContent>
					</Card>

					{/* Recruiter Contact Card */}
					<Card className="border-border/60 shadow-sm">
						<CardHeader className="p-4 pb-3">
							<CardTitle className="text-sm font-bold flex items-center gap-2 text-foreground">
								<User className="h-4 w-4 text-primary" />
								Target Recruiter / Contact Person
							</CardTitle>
						</CardHeader>
						<CardContent className="p-4 pt-0 space-y-3.5">
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
								<div className="space-y-1.5">
									<Label htmlFor="contactName" className="text-xs font-semibold">
										Contact Name *
									</Label>
									<Input
										id="contactName"
										placeholder="e.g. Sarah Jenkins"
										className="text-xs h-9"
										value={contactName}
										onChange={(e) => setContactName(e.target.value)}
									/>
								</div>

								<div className="space-y-1.5">
									<Label htmlFor="contactRole" className="text-xs">
										Role / Position (Optional)
									</Label>
									<Input
										id="contactRole"
										placeholder="e.g. Head of Engineering"
										className="text-xs h-9"
										value={contactRole}
										onChange={(e) => setContactRole(e.target.value)}
									/>
								</div>
							</div>

							<div className="space-y-1.5">
								<Label htmlFor="contactEmail" className="text-xs font-semibold">
									Recipient Email *
								</Label>
								<div className="relative">
									<Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
									<Input
										id="contactEmail"
										type="email"
										placeholder="recruiter@company.com"
										className="pl-9 text-xs h-9"
										value={contactEmail}
										onChange={(e) => setContactEmail(e.target.value)}
									/>
								</div>
							</div>

							<div className="space-y-1.5">
								<Label htmlFor="contactLinkedin" className="text-xs">
									LinkedIn Profile URL (Optional)
								</Label>
								<div className="relative">
									<Linkedin className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
									<Input
										id="contactLinkedin"
										placeholder="https://linkedin.com/in/..."
										className="pl-9 text-xs h-9"
										value={contactLinkedin}
										onChange={(e) => setContactLinkedin(e.target.value)}
									/>
								</div>
							</div>
						</CardContent>
					</Card>

					{/* File Attachments Card */}
					<Card className="border-border/60 shadow-sm">
						<CardHeader className="p-4 pb-3">
							<div className="flex items-center justify-between">
								<CardTitle className="text-sm font-bold flex items-center gap-2 text-foreground">
									<Paperclip className="h-4 w-4 text-primary" />
									Lampiran File (CV / Portfolio)
								</CardTitle>
								<span className="text-[11px] text-muted-foreground">
									{attachments.length} Terlampir
								</span>
							</div>
							<CardDescription className="text-xs">
								Unggah file PDF CV, Portfolio, atau dokumen pendukung yang akan otomatis dikirimkan sebagai attachment di Resend.
							</CardDescription>
						</CardHeader>
						<CardContent className="p-4 pt-0 space-y-3">
							{/* Hidden input */}
							<input
								type="file"
								ref={fileInputRef}
								onChange={handleFileUpload}
								accept=".pdf,.docx,.doc,.zip,.png,.jpg"
								className="hidden"
							/>

							{/* Upload Button Box */}
							<div
								onClick={() => fileInputRef.current?.click()}
								className={cn(
									"border-2 border-dashed border-border/80 hover:border-primary/60 rounded-xl p-4 text-center cursor-pointer transition-all bg-muted/20 hover:bg-muted/40 flex flex-col items-center justify-center gap-2",
									isUploading && "pointer-events-none opacity-60",
								)}
							>
								{isUploading ? (
									<>
										<Loader2 className="h-6 w-6 text-primary animate-spin" />
										<span className="text-xs font-medium">Mengunggah file ke Vercel Blob...</span>
									</>
								) : (
									<>
										<UploadCloud className="h-6 w-6 text-muted-foreground" />
										<div className="space-y-0.5">
											<div className="text-xs font-semibold text-foreground">
												Klik untuk Upload File (PDF, DOCX, ZIP)
											</div>
											<div className="text-[11px] text-muted-foreground">
												Maksimal 10MB per file
											</div>
										</div>
									</>
								)}
							</div>

							{/* Attached Files List */}
							{attachments.length > 0 && (
								<div className="space-y-2 pt-1">
									{attachments.map((att, idx) => (
										<div
											key={idx}
											className="flex items-center justify-between p-2.5 rounded-lg border border-border/60 bg-muted/30 text-xs"
										>
											<div className="flex items-center gap-2 truncate">
												<FileText className="h-4 w-4 text-primary shrink-0" />
												<a
													href={att.url}
													target="_blank"
													rel="noreferrer"
													className="font-medium text-foreground hover:underline truncate"
												>
													{att.name}
												</a>
											</div>
											<Button
												variant="ghost"
												size="icon"
												className="h-6 w-6 text-muted-foreground hover:text-destructive"
												onClick={() => handleRemoveAttachment(idx)}
											>
												<X className="h-3.5 w-3.5" />
											</Button>
										</div>
									))}
								</div>
							)}
						</CardContent>
					</Card>
				</div>

				{/* Right Column: AI Assistant & Email Composer (7 cols) */}
				<div className="lg:col-span-7 space-y-6">
					{/* AI Assistant Banner */}
					<Card className="border-primary/30 bg-gradient-to-r from-primary/10 via-indigo-500/10 to-purple-500/10 shadow-sm">
						<CardContent className="p-4 space-y-3">
							<div className="flex items-center justify-between">
								<div className="flex items-center gap-2">
									<Sparkles className="h-5 w-5 text-primary animate-pulse" />
									<span className="font-bold text-sm text-foreground">
										AI Cold Email Assistant (Gemini)
									</span>
								</div>
								<Button
									type="button"
									size="sm"
									onClick={handleGenerateAi}
									disabled={isGeneratingAi}
									className="gap-2 font-semibold h-8 bg-primary text-primary-foreground hover:bg-primary/90"
								>
									{isGeneratingAi ? (
										<>
											<Loader2 className="h-3.5 w-3.5 animate-spin" /> Drafting...
										</>
									) : (
										<>
											<Sparkles className="h-3.5 w-3.5" /> Auto-Draft with AI
										</>
									)}
								</Button>
							</div>

							<Input
								placeholder="Optional: Tambahkan instruksi spesifik (misal: 'Sebutkan bahwa saya terbiasa membangun AI Agent Next.js')..."
								className="bg-background/90 text-xs h-9"
								value={customPrompt}
								onChange={(e) => setCustomPrompt(e.target.value)}
							/>
						</CardContent>
					</Card>

					{/* Composer Card */}
					<Card className="border-border/60 shadow-sm">
						<CardHeader className="p-4 pb-3 border-b border-border/50 bg-muted/20">
							<div className="flex items-center justify-between">
								<CardTitle className="text-sm font-bold flex items-center gap-2 text-foreground">
									<Mail className="h-4 w-4 text-primary" />
									Email Composer
								</CardTitle>
								<span className="text-[11px] text-muted-foreground font-mono">
									From: <span className="text-primary font-semibold">Wisman Nur &lt;hi@wismannur.pro&gt;</span>
								</span>
							</div>
						</CardHeader>
						<CardContent className="p-4 sm:p-5 space-y-4">
							<div className="space-y-1.5">
								<Label htmlFor="subject" className="text-xs font-semibold">
									Subject Line *
								</Label>
								<Input
									id="subject"
									placeholder="e.g. Application: Senior Frontend Engineer - Wisman Nur"
									className="font-medium text-sm"
									value={subject}
									onChange={(e) => setSubject(e.target.value)}
								/>
							</div>

							<div className="space-y-1.5">
								<Label htmlFor="body" className="text-xs font-semibold">
									Email Body *
								</Label>
								<Textarea
									id="body"
									rows={14}
									placeholder="Tulis pesan Anda di sini atau gunakan AI Auto-Draft di atas..."
									className="font-sans text-sm leading-relaxed"
									value={body}
									onChange={(e) => setBody(e.target.value)}
								/>
							</div>

							<div className="space-y-1.5">
								<Label htmlFor="notes" className="text-xs text-muted-foreground">
									Private Internal Notes (Hanya terlihat di dashboard Anda)
								</Label>
								<Input
									id="notes"
									placeholder="e.g. Di-refer oleh John Doe / Dilamar setelah melihat tweet founder..."
									className="text-xs h-8"
									value={notes}
									onChange={(e) => setNotes(e.target.value)}
								/>
							</div>

							<Separator />

							<div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
								<div className="text-xs text-muted-foreground flex items-center gap-1.5">
									<Check className="h-3.5 w-3.5 text-emerald-500" />
									<span>Balasan dari recruiter otomatis masuk ke timeline CMS ini.</span>
								</div>

								<div className="flex items-center gap-2 w-full sm:w-auto">
									<Button
										type="button"
										variant="outline"
										onClick={() => handleSubmit(false)}
										disabled={isSubmitting || isGeneratingAi}
										className="w-full sm:w-auto"
									>
										Save as Draft
									</Button>
									<Button
										type="button"
										onClick={() => handleSubmit(true)}
										disabled={isSubmitting || isGeneratingAi}
										className="w-full sm:w-auto gap-2"
									>
										{isSubmitting ? (
											<>
												<Loader2 className="h-4 w-4 animate-spin" /> Mengirim...
											</>
										) : (
											<>
												<Send className="h-4 w-4" /> Send Email Now
											</>
										)}
									</Button>
								</div>
							</div>
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	);
}
