import { BlogCard } from "@/components/cards/blog-card";
import PowerfulCTACard from "@/components/cards/powerful-cta-card";
import { ProjectCard } from "@/components/cards/project-card";
import { SEO } from "@/components/common/seo";
import { Button } from "@/components/ui/button";
import { SectionHeader } from "@/components/ui/section-header";
import { VideoPlayer } from "@/components/ui/video-player";
import { getCtaDataForPage } from "@/lib/get-cta-data-for-page";
import { cn } from "@/lib/utils";
import { blogService, projectService } from "@/services";
import { useQuery } from "@tanstack/react-query";
import clsx from "clsx";
import {
	ArrowRight,
	ChevronRight,
	Code,
	Database,
	Gauge,
	Lightbulb,
	Sparkles,
	Users,
	Zap,
} from "lucide-react";
import { Link } from "react-router-dom";

const services = [
	{
		title: "Frontend Development",
		description:
			"I specialize in building modern, high-performance web applications using React, Vue, and Angular. With a focus on clean, maintainable code and best practices, I ensure seamless user experiences across different devices and screen sizes.",
		icon: Code,
		delay: "0.1s",
	},
	{
		title: "UI/UX Implementation",
		description:
			"I translate Figma and design mockups into responsive, pixel-perfect user interfaces. With attention to detail, I ensure consistency, accessibility, and usability, creating interfaces that not only look great but also provide an intuitive user experience.",
		icon: Lightbulb,
		delay: "0.2s",
	},
	{
		title: "Performance Optimization",
		description:
			"I optimize websites to load faster and run efficiently by implementing techniques like code splitting, lazy loading, caching strategies, and minimizing render-blocking resources. A fast website not only improves user experience but also boosts SEO rankings.",
		icon: Gauge,
		delay: "0.3s",
	},
	{
		title: "API Integration",
		description:
			"I seamlessly integrate frontend applications with backend systems using RESTful and Firebase. Whether it's fetching real-time data, handling authentication, or synchronizing state, I ensure smooth and secure communication between the client and server.",
		icon: Database,
		delay: "0.4s",
	},
	{
		title: "Web Animation",
		description:
			"I bring websites to life with smooth and engaging animations using Framer Motion, and CSS. From micro-interactions to complex page transitions, I create visually appealing effects that enhance user engagement and storytelling.",
		icon: Zap,
		delay: "0.5s",
	},
	{
		title: "Technical Leadership",
		description:
			"I have experience leading small development teams, conducting code reviews, and ensuring efficient collaboration. By setting coding standards, improving workflows, and mentoring team members, I help drive projects forward effectively.",
		icon: Users,
		delay: "0.6s",
	},
];

const Home = () => {
	const ctaData = getCtaDataForPage("home");

	const { data: blogs = [], isLoading: isBlogsLoading } = useQuery({
		queryKey: ["latestBlogs"],
		queryFn: () => blogService.getLatest(3),
	});

	const { data: projects = [], isLoading: isProjectsLoading } = useQuery({
		queryKey: ["latestProjects"],
		queryFn: () => projectService.getLatest(2),
	});

	return (
		<>
			<SEO
				title="Home"
				description="I'm Wisman Nur, a frontend software engineer passionate about crafting high-performance web applications"
				type="website"
			/>

			<div className="space-y-12 md:space-y-24">
				<section className="pt-16 md:pt-24 lg:pt-28 relative overflow-hidden">
					<div className="container px-4 max-w-6xl mx-auto">
						<div className="flex flex-col-reverse lg:flex-row items-center gap-12 lg:gap-16 md:py-8">
							<div className="lg:w-1/2 animate-fade-in">
								<div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary font-medium mb-6">
									<Sparkles size={16} />
									FRONTEND SOFTWARE ENGINEER
								</div>

								<h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6 leading-tight">
									I'm <span className="text-primary">Wisman</span> Nur,
								</h1>

								<p className="text-lg text-muted-foreground mb-8 leading-relaxed">
									a <span className="font-semibold">frontend software engineer</span> passionate
									about crafting high-performance web applications, seamless API integrations, and
									intuitive user experiences. Let's bring your ideas to life with speed, creativity,
									and precision.
								</p>

								<div className="flex flex-wrap gap-4">
									<Button asChild size="lg" className="rounded-full px-8 group">
										<Link to="/hire-me">
											<Sparkles size={16} className="mr-2 animate-pulse" />
											Hire Me
										</Link>
									</Button>
									<Button asChild variant="outline" size="lg" className="rounded-full px-8 group">
										<Link to="/contact" className="hover:text-white">
											Contact me
											<ChevronRight
												size={16}
												className="ml-1 group-hover:translate-x-1 transition-transform"
											/>
										</Link>
									</Button>
								</div>
							</div>

							<div className="lg:w-1/2 animate-scale-in">
								<div className="relative group">
									<div
										className={clsx(
											"absolute rounded-2xl blur-lg opacity-70 group-hover:opacity-100 transition duration-500",
											"-inset-2 bg-gradient-to-tr from-primary/30 to-primary/60",
											"dark:from-primary/50 dark:to-primary/90"
										)}
									></div>
									<div className="relative rounded-2xl overflow-hidden shadow-xl border border-border/50">
										<VideoPlayer
											src="https://player.vimeo.com/external/470408840.hd.mp4?s=aba7a4397a64f3ba9cb3e188ef6e6e54f0be1f28&profile_id=175&oauth2_token_id=57447761"
											poster="https://cdn.sundflow.cloud/f/1e82b1642eed233f9"
											className="aspect-video bg-muted"
										/>
										{/* <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
											<div className="bg-primary/90 rounded-full p-4 shadow-lg transform scale-90 group-hover:scale-100 transition-transform duration-300">
												<Play className="w-8 h-8 text-primary-foreground" />
											</div>
										</div> */}
									</div>
								</div>
							</div>
						</div>
					</div>
				</section>

				<section className="py-24 relative overflow-hidden">
					<div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5 pointer-events-none"></div>
					<div className="container px-4 max-w-6xl mx-auto">
						<SectionHeader
							title="What I Do"
							subtitle="Services"
							description="Delivering high-quality web solutions with modern technologies and best practices"
							className="text-center mb-16"
						/>

						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
							{services.map((service, index) => {
								const Icon = service.icon;
								return (
									<div
										key={index}
										className={cn(
											"group bg-background border border-border/50 rounded-xl p-8",
											"hover:border-primary/30 dark:hover:border-primary/70 hover:shadow-lg transition-all duration-300",
											"flex flex-col h-full"
										)}
										style={{ animationDelay: service.delay }}
									>
										<div className="p-4 bg-primary/10 rounded-xl text-primary mb-6 w-fit group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
											<Icon size={24} />
										</div>
										<h3 className="text-xl font-bold mb-4 group-hover:text-primary transition-colors">
											{service.title}
										</h3>
										<p className="text-muted-foreground leading-relaxed flex-grow">
											{service.description}
										</p>
									</div>
								);
							})}
						</div>

						<div className="mt-16 text-center">
							<Button asChild variant="outline" size="lg" className="rounded-full px-8 group">
								<Link to="/services" className="hover:text-white">
									Request Services
									<ArrowRight
										size={16}
										className="ml-2 group-hover:translate-x-1 transition-transform"
									/>
								</Link>
							</Button>
						</div>
					</div>
				</section>

				<section className="py-24">
					<div className="container px-4 max-w-6xl mx-auto">
						<SectionHeader
							title="Latest Articles"
							subtitle="My Blog"
							className="text-center mb-16"
						/>

						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
							{isBlogsLoading
								? // Loading placeholders
									Array.from({ length: 3 }).map((_, i) => (
										<div key={i} className="bg-muted/30 h-[420px] rounded-xl animate-pulse" />
									))
								: blogs.map((blog, index) => (
										<BlogCard
											key={blog.id}
											blog={blog}
											className="animate-fade-in"
											style={{ animationDelay: `${index * 0.1}s` }}
										/>
									))}
						</div>

						<div className="mt-16 text-center">
							<Button asChild variant="outline" size="lg" className="rounded-full px-8 group">
								<Link to="/blog" className="hover:text-white">
									View all articles
									<ArrowRight
										size={16}
										className="ml-2 group-hover:translate-x-1 transition-transform"
									/>
								</Link>
							</Button>
						</div>
					</div>
				</section>

				<section className="py-24 relative overflow-hidden">
					<div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5 pointer-events-none"></div>
					<div className="container px-4 max-w-6xl mx-auto">
						<SectionHeader
							title="Featured Projects"
							subtitle="My Work"
							className="text-center mb-16"
						/>

						<div className="grid grid-cols-1 md:grid-cols-2 gap-8">
							{isProjectsLoading
								? // Loading placeholders
									Array.from({ length: 3 }).map((_, i) => (
										<div key={i} className="bg-muted/30 h-[420px] rounded-xl animate-pulse" />
									))
								: projects.map((project, index) => (
										<ProjectCard
											key={project.id}
											project={project}
											className="animate-fade-in"
											style={{ animationDelay: `${index * 0.1}s` }}
										/>
									))}
						</div>

						<div className="mt-16 text-center">
							<Button asChild variant="outline" size="lg" className="rounded-full px-8 group">
								<Link to="/projects" className="hover:text-white">
									View all projects
									<ArrowRight
										size={16}
										className="ml-2 group-hover:translate-x-1 transition-transform"
									/>
								</Link>
							</Button>
						</div>
					</div>
				</section>

				<section className="py-24 !mt-6">
					<div className="container px-4 max-w-6xl mx-auto">
						<PowerfulCTACard {...ctaData} />
					</div>
				</section>
			</div>
		</>
	);
};

export default Home;
