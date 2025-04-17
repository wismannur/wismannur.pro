import PowerfulCTACard from "@/components/cards/powerful-cta-card";
import { Button } from "@/components/ui/button";
import { SectionHeader } from "@/components/ui/section-header";
import { getCtaDataForPage } from "@/lib/get-cta-data-for-page";
import { cn } from "@/lib/utils";
import {
	ArrowRight,
	Award,
	BriefcaseIcon,
	Calendar,
	CheckCircle,
	ChevronRight,
	GraduationCap,
	MapPin,
	Rocket,
	Sparkles,
	User,
	Zap,
} from "lucide-react";
import { Link } from "react-router-dom";

const experiences = [
	{
		title: "Frontend Engineer",
		company: "Rumah Siap Kerja",
		period: "2021 - 2024",
		location: "South Jakarta, Indonesia.",
		description: "",
	},
	{
		title: "Frontend Developer",
		company: "BIT - Barito Technologies Group",
		period: "2019 - 2021",
		location: "West Jakarta, Indonesia.",
		description: "",
	},
	{
		title: "Frontend Developer",
		company: "Arisot Riset Infomatika",
		period: "2018 - 2019",
		location: "Bandung City, West Java, Indonesia.",
		description: "",
	},
	{
		title: "Jr. Frontend Developer",
		company: "Navcore Nextology",
		period: "2018",
		location: "South Jakarta, Indonesia.",
		description: "",
	},
];

const education = [
	{
		degree: "Responsive Web Design",
		institution: "Freecodecamp.org",
		period: "2021",
		description: "",
	},
	{
		degree: "FullStack Developer Academy",
		institution: "Makers Institute Indonesia",
		period: "2017 - 2018",
		description: "Intensive FullStack Developer BootCamp for 3 Months.",
	},
	{
		degree: "Computer Network & Engineering",
		institution: "SMK Penida 2 Katapang",
		period: "2014 - 2017",
		description: "",
	},
];

const skills = [
	"TypeScript",
	"JavaScript",
	"React.js",
	"Next.js",
	"Vue.js",
	"Nuxt.js",
	"HTML5",
	"CSS3",
	"Material UI",
	"shadcn/ui",
	"React Hook Form",
	"Vuetify",
	"Vuelidate",
	"Tailwind CSS",
	"Framer Motion",
	"Zustand",
	"Pinia",
	"TanStack Query",
	"Firebase",
	"RESTful APIs",
	"Node.js",
	"Git",
	"UI/UX Design",
	"Responsive Design",
	"Performance Optimization",
];

const About = () => {
	const ctaData = getCtaDataForPage("about");

	return (
		<div className="space-y-24">
			{/* Hero Section */}
			<section className="relative overflow-hidden pt-8 md:pt-16">
				{/* <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none"></div> */}
				<div className="container max-w-7xl px-4 relative">
					<div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-center">
						<div className="lg:w-2/5 animate-scale-in">
							<div className="relative group">
								<div className="absolute -inset-1 bg-gradient-to-tr from-primary/20 to-primary/40 rounded-2xl blur-lg opacity-70 group-hover:opacity-100 transition duration-500"></div>
								<div className="relative aspect-square rounded-2xl overflow-hidden bg-background shadow-xl border border-border/50">
									<img
										src="https://cdn.sundflow.cloud/f/a21e53a05f4070c63"
										alt="Profile"
										className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
									/>
									<div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
										<div className="absolute bottom-4 left-4 right-4">
											<div className="flex gap-2 justify-center">
												<span className="bg-white/20 backdrop-blur-sm text-white text-xs px-3 py-1 rounded-full">
													Frontend Software Engineer
												</span>
											</div>
										</div>
									</div>
								</div>
							</div>

							<div className="mt-6 flex flex-wrap gap-3 justify-center">
								<div className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary font-medium">
									<Calendar size={16} />
									7+ Years Experience
								</div>
								<div className="flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 text-green-500 font-medium">
									<CheckCircle size={16} />
									Available for Hire
								</div>
							</div>
						</div>

						<div className="lg:w-3/5 animate-fade-in">
							<div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary font-medium mb-6">
								<User size={16} />
								ABOUT ME
							</div>

							<h1 className="text-3xl lg:text-4xl xl:text-5xl font-bold mb-6 tracking-tight leading-tight">
								Frontend Software Engineer <span className="text-primary">&</span> UX Enthusiast
							</h1>

							<div className="space-y-4 text-lg text-muted-foreground mb-8 leading-relaxed">
								<p>
									<b>
										I'm <span className="text-primary">Wisman</span> Nur
									</b>{" "}
									, a passionate Frontend & UX Enthusiast with 7+ years of experience crafting
									beautiful, functional, and user-friendly web applications. I specialize in React,
									Vue, TypeScript, and modern web technologies.
								</p>
								<p>
									My approach combines clean code with stunning visuals and thoughtful interactions.
									I believe in creating digital products that not only look great but also provide
									exceptional user experiences.
								</p>
								<p>
									When I'm not coding, you'll find me exploring new technologies, experimenting with
									new frameworks, or enjoying outdoor adventures with my son.
								</p>
							</div>

							<div className="flex flex-wrap gap-4">
								<Button asChild size="lg" className="rounded-full px-8 group">
									<Link to="/hire-me">
										<Sparkles size={16} className="mr-2" />
										Hire Me
									</Link>
								</Button>
								<Button asChild variant="outline" size="lg" className="rounded-full px-8 group">
									<Link to="/projects" className="hover:text-white">
										View My Work
										<ChevronRight
											size={16}
											className="ml-1 group-hover:translate-x-1 transition-transform"
										/>
									</Link>
								</Button>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* Skills Section */}
			<section className="py-20 relative overflow-hidden">
				<div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5 pointer-events-none"></div>
				<div className="container max-w-7xl px-4 relative">
					<SectionHeader title="My Skills" subtitle="Expertise" className="mb-16 text-center" />

					<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 animate-fade-in">
						{skills.map((skill, index) => (
							<div
								key={skill}
								className={cn(
									"p-4 bg-background rounded-xl border border-border/50 shadow-sm",
									"hover:border-primary/30 dark:hover:border-primary/70 hover:shadow-md transition-all duration-300",
									"flex items-center justify-center text-center",
								)}
								style={{ animationDelay: `${index * 0.05}s` }}
							>
								<span className="font-medium">{skill}</span>
							</div>
						))}
					</div>
				</div>
			</section>

			{/* Experience & Education Section */}
			<section className="container max-w-7xl px-4 grid lg:grid-cols-2 gap-16">
				{/* Experience Section */}
				<div>
					<SectionHeader
						title="Work Experience"
						subtitle="My Journey"
						align="left"
						className="mb-10"
					/>

					<div className="relative border-l-2 border-primary/30 pl-8 ml-4 space-y-12">
						{experiences.map((exp, index) => (
							<div
								key={index}
								className="relative animate-fade-in"
								style={{ animationDelay: `${index * 0.1}s` }}
							>
								{/* Timeline dot */}
								<div className="absolute -left-[3.1rem] w-8 h-8 bg-primary rounded-full flex items-center justify-center shadow-md">
									<BriefcaseIcon size={16} className="text-primary-foreground" />
								</div>

								<div className="group bg-background border border-border/50 rounded-xl p-6 shadow-sm hover:shadow-md hover:border-primary/30 dark:hover:border-primary/70 transition-all duration-300">
									<div className="flex justify-between items-start flex-wrap gap-2 mb-2 md:mb-4">
										<h3 className="text-xl font-bold group-hover:text-primary transition-colors">
											{exp.title}
										</h3>
										<div className="px-4 py-1.5 bg-primary/10 text-primary text-xs rounded-full font-medium inline-flex items-center">
											<Calendar size={12} className="mr-1.5" />
											{exp.period}
										</div>
									</div>
									<div className="flex flex-col md:flex-row items-start md:items-center gap-2 text-muted-foreground mb-4">
										<span className="font-medium">{exp.company}</span>
										<span className="hidden md:block">•</span>
										<span className="flex items-center">
											<MapPin size={14} className="mr-1" />
											{exp.location}
										</span>
									</div>
									<p className="text-muted-foreground leading-relaxed">{exp.description}</p>
								</div>
							</div>
						))}
					</div>
				</div>

				{/* Education Section */}
				<div>
					<SectionHeader
						title="Education & Certification"
						subtitle="My Academic Background"
						align="left"
						className="mb-10"
					/>

					<div className="relative border-l-2 border-primary/30 pl-8 ml-4 space-y-12">
						{education.map((edu, index) => (
							<div
								key={index}
								className="relative animate-fade-in"
								style={{ animationDelay: `${index * 0.1}s` }}
							>
								{/* Timeline dot */}
								<div className="absolute -left-[3.1rem] w-8 h-8 bg-primary rounded-full flex items-center justify-center shadow-md">
									<GraduationCap size={16} className="text-primary-foreground" />
								</div>

								<div className="group bg-background border border-border/50 rounded-xl p-6 shadow-sm hover:shadow-md hover:border-primary/30 dark:hover:border-primary/70 transition-all duration-300">
									<div className="flex justify-between items-start flex-wrap gap-2 mb-4">
										<h3 className="text-xl font-bold group-hover:text-primary transition-colors">
											{edu.degree}
										</h3>
										<div className="px-4 py-1.5 bg-primary/10 text-primary text-xs rounded-full font-medium inline-flex items-center">
											<Calendar size={12} className="mr-1.5" />
											{edu.period}
										</div>
									</div>
									<div className="flex items-center gap-1 text-muted-foreground mb-4">
										<span className="font-medium">{edu.institution}</span>
									</div>
									<p className="text-muted-foreground leading-relaxed">{edu.description}</p>
								</div>
							</div>
						))}
					</div>
				</div>
			</section>

			{/* New highlights section */}
			<section className="py-16 relative overflow-hidden">
				<div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none"></div>
				<div className="container max-w-6xl px-4">
					<SectionHeader
						title="Why Work With Me?"
						subtitle="My Approach"
						description="I bring a unique blend of technical expertise and user-focused design thinking to every project."
						className="text-center mb-16"
					/>

					<div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
						<div className="bg-background border border-border/50 rounded-xl p-8 shadow-md hover:shadow-lg transition-all duration-300 hover:border-primary/30 dark:hover:border-primary/70 group">
							<div className="p-4 bg-primary/10 rounded-xl text-primary mb-6 w-fit group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
								<Rocket size={24} />
							</div>
							<h3 className="text-xl font-bold mb-4 group-hover:text-primary transition-colors">
								Fast Delivery
							</h3>
							<p className="text-muted-foreground leading-relaxed">
								I work efficiently to deliver high-quality results within agreed timeframes,
								ensuring your project launches on schedule.
							</p>
						</div>

						<div className="bg-background border border-border/50 rounded-xl p-8 shadow-md hover:shadow-lg transition-all duration-300 hover:border-primary/30 dark:hover:border-primary/70 group">
							<div className="p-4 bg-primary/10 rounded-xl text-primary mb-6 w-fit group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
								<Zap size={24} />
							</div>
							<h3 className="text-xl font-bold mb-4 group-hover:text-primary transition-colors">
								Performance Focused
							</h3>
							<p className="text-muted-foreground leading-relaxed">
								I build applications with performance in mind, optimizing every aspect to ensure
								fast loading times and smooth interactions.
							</p>
						</div>

						<div className="bg-background border border-border/50 rounded-xl p-8 shadow-md hover:shadow-lg transition-all duration-300 hover:border-primary/30 dark:hover:border-primary/70 group">
							<div className="p-4 bg-primary/10 rounded-xl text-primary mb-6 w-fit group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
								<Award size={24} />
							</div>
							<h3 className="text-xl font-bold mb-4 group-hover:text-primary transition-colors">
								Quality Guaranteed
							</h3>
							<p className="text-muted-foreground leading-relaxed">
								I'm committed to excellence in every project, with attention to detail that ensures
								a polished, professional final product.
							</p>
						</div>
					</div>

					<div className="mt-12 text-center">
						<Button asChild variant="outline" size="lg" className="rounded-full px-8 group">
							<Link to="/services" className="hover:text-white">
								Explore My Services
								<ArrowRight
									size={16}
									className="ml-2 group-hover:translate-x-1 transition-transform"
								/>
							</Link>
						</Button>
					</div>
				</div>
			</section>

			{/* Enhanced Hire Me Section with ContactCTA */}
			<section className="pb-16">
				<div className="container max-w-6xl px-4 mx-auto">
					<PowerfulCTACard {...ctaData} />
				</div>
			</section>
		</div>
	);
};

export default About;
