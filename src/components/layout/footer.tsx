import { ArrowUpRight, Clock, Github, Heart, Linkedin, Mail, MapPin, Twitter } from "lucide-react";
import { Link } from "react-router-dom";

const socialLinks = [
	{ href: "https://github.com/wismannur", icon: Github, label: "GitHub" },
	{ href: "https://x.com/wismannur", icon: Twitter, label: "Twitter" },
	{
		href: "https://linkedin.com/in/wismannur",
		icon: Linkedin,
		label: "LinkedIn",
	},
];

const navLinks = [
	{ to: "/", label: "Home" },
	{ to: "/blog", label: "Blog" },
	{ to: "/projects", label: "Projects" },
	{ to: "/services", label: "Services" },
	{ to: "/about", label: "About" },
	{ to: "/contact", label: "Contact" },
];

const projectLinks = [
	{ href: "https://sundflow.cloud", label: "SundFlow" },
	// Add more project links as needed
];

export const Footer = () => {
	const currentYear = new Date().getFullYear();

	return (
		<footer className="border-t border-border/40 bg-gradient-to-b from-background to-muted/20">
			<div className="container px-4 md:px-0 py-16 mx-auto">
				<div className="grid grid-cols-1 md:grid-cols-12 gap-10">
					{/* Brand and Description */}
					<div className="md:col-span-12 lg:col-span-5 space-y-6">
						<Link to="/" className="text-2xl font-bold tracking-tighter inline-flex items-center">
							<span className="text-primary mr-1">&lt;</span>
							<span>w.pro</span>
							<span className="text-primary ml-1">/&gt;</span>
						</Link>

						<p className="text-muted-foreground max-w-md leading-relaxed">
							I'm Wisman Nur, a frontend software engineer passionate about crafting
							high-performance web applications, seamless API integrations, and intuitive user
							experiences.
						</p>

						<div className="flex space-x-3 pt-2">
							{socialLinks.map(({ href, icon: Icon, label }) => (
								<a
									key={label}
									href={href}
									target="_blank"
									rel="noopener noreferrer"
									className="p-2.5 bg-background border border-border/50 rounded-xl text-muted-foreground hover:text-primary hover:border-primary/50 hover:shadow-md transition-all duration-300"
									aria-label={label}
								>
									<Icon size={18} />
									<span className="sr-only">{label}</span>
								</a>
							))}
						</div>
					</div>

					{/* Quick Links */}
					<div className="md:col-span-3 lg:col-span-2">
						<h3 className="font-medium text-sm mb-5 text-primary tracking-wider">NAVIGATION</h3>
						<ul className="space-y-3">
							{navLinks.map(({ to, label }) => (
								<li key={to}>
									<Link
										to={to}
										className="group inline-flex items-center hover:text-primary transition-colors"
									>
										{label}
										<ArrowUpRight
											size={14}
											className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity"
										/>
									</Link>
								</li>
							))}
						</ul>
					</div>

					{/* Projects */}
					<div className="md:col-span-3 lg:col-span-2">
						<h3 className="font-medium text-sm mb-5 text-primary tracking-wider">PROJECTS</h3>
						<ul className="space-y-3">
							{projectLinks.map(({ href, label }) => (
								<li key={href}>
									<a
										href={href}
										target="_blank"
										rel="noopener noreferrer"
										className="group inline-flex items-center hover:text-primary transition-colors"
									>
										{label}
										<ArrowUpRight
											size={14}
											className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity"
										/>
									</a>
								</li>
							))}
						</ul>
					</div>

					{/* Contact Info */}
					<div className="md:col-span-6 lg:col-span-3">
						<h3 className="font-medium text-sm mb-5 text-primary tracking-wider">CONTACT</h3>
						<ul className="space-y-4">
							<li className="flex items-start group">
								<Mail
									size={20}
									className="mr-3 mt-0.5 flex-shrink-0 text-muted-foreground group-hover:text-primary transition-colors"
								/>
								<a
									href="mailto:hi@wismannur.pro"
									className="hover:text-primary transition-colors"
									rel="noopener noreferrer"
									target="_blank"
								>
									hi@wismannur.pro
								</a>
							</li>
							<li className="flex items-start group">
								<MapPin
									size={20}
									className="mr-3 mt-0.5 md:mt-1 flex-shrink-0 text-muted-foreground"
								/>
								<span className="text-muted-foreground">Bandung, West Java, Indonesia</span>
							</li>
							<li className="flex items-start group">
								<Clock
									size={20}
									className="mr-3 mt-0.5 md:mt-1 flex-shrink-0 text-muted-foreground"
								/>
								<span className="text-muted-foreground">Western Indonesian Time, UTC+07:00</span>
							</li>
						</ul>
					</div>
				</div>

				<div className="border-t border-border/30 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-muted-foreground gap-4">
					<p>&copy; {currentYear} Wisman Nur. All rights reserved.</p>
					<p className="flex items-center">
						Made with <Heart size={14} className="mx-1 text-red-500" /> using React & Tailwind
					</p>
					<a
						className="hover:underline flex"
						href="https://github.com/wismannur/wismannur.pro"
						target="_blank"
						rel="noopener noreferrer"
					>
						See the recent update on Github
					</a>
				</div>
			</div>
		</footer>
	);
};
