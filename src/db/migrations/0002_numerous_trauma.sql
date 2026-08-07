CREATE TYPE "public"."availability_status" AS ENUM('available', 'limited', 'booked');--> statement-breakpoint
CREATE TYPE "public"."page_key" AS ENUM('home', 'about', 'services', 'hire-me', 'offers', 'blog', 'projects', 'contact', 'not-found', 'default');--> statement-breakpoint
CREATE TYPE "public"."process_scope" AS ENUM('services', 'hire-me');--> statement-breakpoint
CREATE TABLE "availability_slots" (
	"id" text PRIMARY KEY NOT NULL,
	"month" integer NOT NULL,
	"year" integer NOT NULL,
	"status" "availability_status" DEFAULT 'available' NOT NULL,
	"label" text DEFAULT 'Available' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_published" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "faqs" (
	"id" text PRIMARY KEY NOT NULL,
	"question" text NOT NULL,
	"answer" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_published" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "offers" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"icon" text NOT NULL,
	"price" integer NOT NULL,
	"for_who" text DEFAULT '' NOT NULL,
	"extras" text[] DEFAULT '{}'::text[] NOT NULL,
	"is_popular" boolean DEFAULT false NOT NULL,
	"color" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_published" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "offers_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "page_copy" (
	"page" "page_key" PRIMARY KEY NOT NULL,
	"content" jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pricing_tiers" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"price_label" text NOT NULL,
	"description" text NOT NULL,
	"features" text[] DEFAULT '{}'::text[] NOT NULL,
	"is_popular" boolean DEFAULT false NOT NULL,
	"cta_label" text DEFAULT 'Get Started' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_published" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "pricing_tiers_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "process_steps" (
	"id" text PRIMARY KEY NOT NULL,
	"scope" "process_scope" NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"icon" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_published" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "services" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"long_description" text,
	"icon" text NOT NULL,
	"price_label" text DEFAULT '' NOT NULL,
	"features" text[] DEFAULT '{}'::text[] NOT NULL,
	"show_on_home" boolean DEFAULT true NOT NULL,
	"show_on_hire_me" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_published" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "services_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "site_pages" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"is_published" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "site_pages_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "site_settings" (
	"id" text PRIMARY KEY DEFAULT 'site' NOT NULL,
	"site_name" text NOT NULL,
	"title_default" text NOT NULL,
	"title_template" text NOT NULL,
	"meta_description" text NOT NULL,
	"keywords" text[] DEFAULT '{}'::text[] NOT NULL,
	"twitter_handle" text DEFAULT '' NOT NULL,
	"theme_color" text DEFAULT '#4F46E5' NOT NULL,
	"og_title" text DEFAULT '' NOT NULL,
	"og_tagline" text DEFAULT '' NOT NULL,
	"public_email" text DEFAULT '' NOT NULL,
	"location" text DEFAULT '' NOT NULL,
	"timezone_label" text DEFAULT '' NOT NULL,
	"social" jsonb NOT NULL,
	"footer_bio" text DEFAULT '' NOT NULL,
	"footer_tagline" text DEFAULT '' NOT NULL,
	"copyright_name" text DEFAULT '' NOT NULL,
	"repo_url" text DEFAULT '' NOT NULL,
	"repo_link_label" text DEFAULT '' NOT NULL,
	"footer_project_links" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"request_timeframes" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"request_budget_ranges" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "skills" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_published" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "testimonials" (
	"id" text PRIMARY KEY NOT NULL,
	"author_name" text NOT NULL,
	"author_role" text NOT NULL,
	"quote" text NOT NULL,
	"avatar_url" text,
	"rating" integer DEFAULT 5 NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_published" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
-- Data seed (same strategy as 0001): placeholder content for every
-- CMS-managed table so a fresh database renders a complete, working site out
-- of the box. All values below are fictional sample content ("John Doe") —
-- replace them with your own via the CMS after logging in. Testimonials are
-- deliberately left unseeded.
INSERT INTO "site_settings" (
	"id", "site_name", "title_default", "title_template", "meta_description",
	"keywords", "twitter_handle", "theme_color", "og_title", "og_tagline",
	"public_email", "location", "timezone_label", "social",
	"footer_bio", "footer_tagline", "copyright_name",
	"repo_url", "repo_link_label",
	"footer_project_links", "request_timeframes", "request_budget_ranges"
) VALUES (
	'site',
	'John Doe',
	'John Doe - Frontend Software Engineer',
	'%s | John Doe',
	'I''m John Doe, a frontend software engineer passionate about crafting high-performance web applications, seamless API integrations, and intuitive user experiences.',
	ARRAY['John Doe','Frontend Software Engineer','React','Next.js','TypeScript','Web Developer','UI/UX'],
	'@johndoe',
	'#4F46E5',
	'Frontend Software Engineer',
	'High-performance web applications, seamless API integrations, and intuitive user experiences.',
	'hello@example.com',
	'Jakarta, Indonesia',
	'Western Indonesian Time, UTC+07:00',
	'{"github":"https://github.com/johndoe","twitter":"https://x.com/johndoe","linkedin":"https://linkedin.com/in/johndoe"}'::jsonb,
	'I''m John Doe, a frontend software engineer passionate about crafting high-performance web applications, seamless API integrations, and intuitive user experiences.',
	'',
	'John Doe',
	'https://github.com/johndoe/portfolio',
	'See the recent update on Github',
	'[]'::jsonb,
	'[{"id":"asap","label":"As soon as possible"},{"id":"1-2-weeks","label":"Within 1-2 weeks"},{"id":"1-month","label":"Within a month"},{"id":"flexible","label":"Flexible / Not urgent"}]'::jsonb,
	'[{"id":"under-1000","label":"Under $1,000"},{"id":"1000-5000","label":"$ 1,000 - $ 5,000"},{"id":"5000-10000","label":"$ 5,000 - $ 10,000"},{"id":"10000-plus","label":"$ 10,000+"},{"id":"hourly","label":"Hourly rate"}]'::jsonb
);--> statement-breakpoint
INSERT INTO "page_copy" ("page", "content") VALUES
('home', $json$
{
  "meta": {"title": "Home", "description": "I'm John Doe, a frontend software engineer passionate about crafting high-performance web applications"},
  "hero": {
    "eyebrow": "FRONTEND SOFTWARE ENGINEER",
    "title": "I'm **John** Doe,",
    "bio": "a __frontend software engineer__ passionate about crafting high-performance web applications, seamless API integrations, and intuitive user experiences. Let's bring your ideas to life with speed, creativity, and precision.",
    "videoUrl": "https://player.vimeo.com/external/470408840.hd.mp4?s=aba7a4397a64f3ba9cb3e188ef6e6e54f0be1f28&profile_id=175&oauth2_token_id=57447761"
  },
  "sections": {
    "services": {"title": "What I Do", "subtitle": "Services", "description": "Delivering high-quality web solutions with modern technologies and best practices"},
    "blog": {"title": "Latest Articles", "subtitle": "My Blog"},
    "projects": {"title": "Featured Projects", "subtitle": "My Work"}
  },
  "cta": {
    "title": "Turn your ideas into reality with just one click",
    "description": "From concept to launch, I'm here to build solutions that make a difference. Ready to start something great?",
    "primaryButtonText": "Let's Get Started",
    "primaryButtonLink": "/hire-me",
    "secondaryButtonText": "See My Work",
    "secondaryButtonLink": "/projects",
    "badge": "🚀 Let's kickstart your next big thing"
  }
}
$json$::jsonb),
('about', $json$
{
  "meta": {"title": "About", "description": "Learn more about John Doe, a frontend software engineer specializing in React, Vue, and modern web technologies. Discover my journey, skills, and approach to development"},
  "hero": {
    "badge": "ABOUT ME",
    "photoUrl": "/placeholder.svg",
    "photoBadge": "Frontend Software Engineer",
    "statPills": [
      {"icon": "calendar", "label": "7+ Years Experience", "variant": "primary"},
      {"icon": "check-circle", "label": "Available for Hire", "variant": "success"}
    ],
    "title": "Frontend Software Engineer **&** UX Enthusiast",
    "paragraphs": [
      "__I'm **John** Doe__, a passionate Frontend & UX Enthusiast with 7+ years of experience crafting beautiful, functional, and user-friendly web applications. I specialize in React, Vue, TypeScript, and modern web technologies.",
      "My approach combines clean code with stunning visuals and thoughtful interactions. I believe in creating digital products that not only look great but also provide exceptional user experiences.",
      "When I'm not coding, you'll find me exploring new technologies, experimenting with new frameworks, or enjoying the outdoors."
    ]
  },
  "skillsSection": {"title": "My Skills", "subtitle": "Expertise"},
  "whySection": {"title": "Why Work With Me?", "subtitle": "My Approach", "description": "I bring a unique blend of technical expertise and user-focused design thinking to every project."},
  "whyCards": [
    {"icon": "rocket", "title": "Fast Delivery", "description": "I work efficiently to deliver high-quality results within agreed timeframes, ensuring your project launches on schedule."},
    {"icon": "zap", "title": "Performance Focused", "description": "I build applications with performance in mind, optimizing every aspect to ensure fast loading times and smooth interactions."},
    {"icon": "award", "title": "Quality Guaranteed", "description": "I'm committed to excellence in every project, with attention to detail that ensures a polished, professional final product."}
  ],
  "cta": {
    "title": "From developer to problem-solver: my journey",
    "description": "I've helped startups and businesses grow through thoughtful digital products. Want to work with someone experienced and easy to talk to?",
    "primaryButtonText": "Work With Me",
    "primaryButtonLink": "/hire-me",
    "secondaryButtonText": "See My Work",
    "secondaryButtonLink": "/projects",
    "badge": "👋 Let's get to know each other"
  }
}
$json$::jsonb),
('services', $json$
{
  "meta": {"title": "Services", "description": "Professional web development services including frontend development, UI/UX implementation, and performance optimization. Expert solutions for your digital needs"},
  "header": {"title": "Professional Services", "subtitle": "What I Offer", "description": "I provide specialized frontend development services tailored to your project needs. Browse my service offerings below and request a custom quote."},
  "processSection": {"title": "How It Works", "subtitle": "My Process", "description": "A simple, effective process to ensure your project is completed successfully."},
  "requestSection": {"title": "Request a Service", "subtitle": "Work With Me", "description": "Fill out the form below to request a service. I'll review your project details and get back to you with a custom quote."},
  "faqSection": {"title": "Frequently Asked Questions", "subtitle": "FAQs"},
  "cta": {
    "title": "Custom web solutions tailored to your needs",
    "description": "Whether it's a sleek website, a powerful dashboard, or API integration—I'll craft it with care and precision.",
    "primaryButtonText": "Request a Service",
    "primaryButtonLink": "/hire-me",
    "primaryButtonScrollTo": "request-service-form",
    "secondaryButtonText": "Contact Me",
    "secondaryButtonLink": "/contact",
    "badge": "🛠️ Offering solutions that work",
    "responseTime": "Within 1 business day"
  }
}
$json$::jsonb),
('hire-me', $json$
{
  "meta": {"title": "Hire Me", "description": "Looking for a skilled frontend developer? Let's collaborate on your next project. Offering expertise in React, modern UI development, and performance optimization"},
  "hero": {
    "eyebrow": "CURRENTLY ACCEPTING NEW PROJECTS",
    "title": "Let's Build Something **Amazing** Together",
    "description": "I'm a frontend developer specializing in creating high-performance, user-friendly web applications. Whether you need a new website, a complex web application, or help with an existing project, I'm here to bring your vision to life."
  },
  "availabilitySection": {
    "title": "Current Availability",
    "description": "Here's my availability for upcoming projects. Get in touch to secure your spot.",
    "timezoneNote": "Timezone: UTC+07:00 (WIB)",
    "contactNote": "Reach out to discuss your project — I usually reply within a day"
  },
  "servicesSection": {"title": "Services & Pricing", "subtitle": "How I Can Help", "description": "Choose the service package that best fits your project needs and budget."},
  "processSection": {"title": "My Process", "subtitle": "How We'll Work Together", "description": "A simple, effective process to ensure your project is completed successfully."},
  "testimonialsSection": {"title": "Client Testimonials", "subtitle": "What People Say", "description": "Don't just take my word for it. Here's what clients have to say about working with me."},
  "faqSection": {"title": "Frequently Asked Questions", "subtitle": "FAQs", "description": "Find answers to common questions about my services and process."},
  "contactSection": {"title": "Let's Get Started", "subtitle": "Contact Me", "description": "Fill out the form below to discuss your project. I'll get back to you within 24 hours."},
  "cta": {
    "title": "Ready to make your project a success?",
    "description": "I bring ideas to life with clean code, modern design, and a focus on performance. Let's talk about how I can help you.",
    "primaryButtonText": "Send a Proposal",
    "primaryButtonLink": "/contact",
    "primaryButtonScrollTo": "contact-form",
    "secondaryButtonText": "Let's Discuss First",
    "secondaryButtonLink": "/contact",
    "badge": "🤝 Let's collaborate",
    "responseTime": "Often within hours"
  }
}
$json$::jsonb),
('offers', $json$
{
  "meta": {"title": "Service Offers", "description": "Professional web development services with clear pricing and deliverables. From landing pages to complex web applications."},
  "header": {"title": "My Services", "subtitle": "What I Offer", "description": "Here are the services I provide with transparent pricing and clear deliverables. Each package is designed to meet specific needs and can be customized to fit your project requirements."}
}
$json$::jsonb),
('blog', $json$
{
  "meta": {"title": "Blog", "description": "Read my latest articles about web development, frontend engineering, and software development best practices"},
  "header": {"eyebrow": "THOUGHTS & IDEAS", "title": "My Blog", "description": "Explore my articles on web development, design trends, and technology insights."},
  "cta": {
    "title": "Inspired by what you read?",
    "description": "If my writing resonates with you, imagine what we could build together. Let's start a conversation.",
    "primaryButtonText": "Get In Touch",
    "primaryButtonLink": "/hire-me",
    "secondaryButtonText": "Read More Posts",
    "secondaryButtonLink": "/blog",
    "badge": "📚 Curious minds connect",
    "responseTime": "Usually same day"
  }
}
$json$::jsonb),
('projects', $json$
{
  "meta": {"title": "Projects", "description": "Explore my portfolio of web development projects, featuring modern frontend applications, responsive designs, and technical solutions"},
  "header": {"eyebrow": "RECENT WORK", "title": "My Projects", "description": "Explore my portfolio of web applications, UI designs, and development projects."},
  "cta": {
    "title": "Want results like these for your business?",
    "description": "You've seen what I can build. Now let's create something even better together.",
    "primaryButtonText": "Start Your Project",
    "primaryButtonLink": "/hire-me",
    "secondaryButtonText": "Explore Services",
    "secondaryButtonLink": "/services",
    "badge": "💼 Let's build your next success",
    "responseTime": "Within 24 hours"
  }
}
$json$::jsonb),
('contact', $json$
{
  "meta": {"title": "Contact", "description": "Get in touch with John Doe, a frontend software engineer specializing in React, Vue, and modern web technologies. Contact me for inquiries, projects, or just to say hello."},
  "header": {"title": "Get In Touch", "subtitle": "Contact Me", "description": "Have a question or want to work together? Feel free to reach out. I'm always here to help."}
}
$json$::jsonb),
('not-found', $json$
{
  "badge": "404 Error",
  "title": "Oops! Page not found",
  "message": "The page you're looking for doesn't exist or has been moved. Let's get you back on track.",
  "primaryLabel": "Back to Home",
  "secondaryLabel": "Contact Support",
  "popularTitle": "Popular Pages"
}
$json$::jsonb),
('default', $json$
{
  "cta": {
    "title": "Let's build something extraordinary together",
    "description": "Need help with your next project or want to consult first? I'm ready when you are.",
    "primaryButtonText": "Contact Me",
    "primaryButtonLink": "/contact",
    "secondaryButtonText": "See My Work",
    "secondaryButtonLink": "/projects",
    "badge": "✨ Let's make it happen",
    "responseTime": "Quick to respond"
  }
}
$json$::jsonb);--> statement-breakpoint
INSERT INTO "skills" ("id", "name", "sort_order") VALUES
	('skill-1', 'TypeScript', 1),
	('skill-2', 'JavaScript', 2),
	('skill-3', 'React.js', 3),
	('skill-4', 'Next.js', 4),
	('skill-5', 'Vue.js', 5),
	('skill-6', 'Nuxt.js', 6),
	('skill-7', 'HTML5', 7),
	('skill-8', 'CSS3', 8),
	('skill-9', 'Material UI', 9),
	('skill-10', 'shadcn/ui', 10),
	('skill-11', 'React Hook Form', 11),
	('skill-12', 'Vuetify', 12),
	('skill-13', 'Vuelidate', 13),
	('skill-14', 'Tailwind CSS', 14),
	('skill-15', 'Framer Motion', 15),
	('skill-16', 'Zustand', 16),
	('skill-17', 'Pinia', 17),
	('skill-18', 'TanStack Query', 18),
	('skill-19', 'Firebase', 19),
	('skill-20', 'RESTful APIs', 20),
	('skill-21', 'Node.js', 21),
	('skill-22', 'Git', 22),
	('skill-23', 'UI/UX Design', 23),
	('skill-24', 'Responsive Design', 24),
	('skill-25', 'Performance Optimization', 25);--> statement-breakpoint
INSERT INTO "services" ("id", "slug", "title", "description", "long_description", "icon", "price_label", "features", "sort_order") VALUES
	('service-frontend', 'frontend', 'Frontend Development',
		'Modern, high-performance web applications using React, Vue, and Angular with clean, maintainable code and best practices.',
		'I specialize in building modern, high-performance web applications using React, Vue, and Angular. With a focus on clean, maintainable code and best practices, I ensure seamless user experiences across different devices and screen sizes.',
		'code', '$25/hour',
		ARRAY['Responsive design for all devices','Cross-browser compatibility','Performance optimization','Accessibility compliance','Modern UI frameworks'], 1),
	('service-ui-ux', 'ui-ux', 'UI/UX Implementation',
		'Pixel-perfect user interfaces from Figma and design mockups with attention to detail, consistency, and usability.',
		'I translate Figma and design mockups into responsive, pixel-perfect user interfaces. With attention to detail, I ensure consistency, accessibility, and usability, creating interfaces that not only look great but also provide an intuitive user experience.',
		'lightbulb', '$20/hour',
		ARRAY['Figma to code conversion','Design system implementation','Interactive prototypes','User-centered design','Usability testing'], 2),
	('service-performance', 'performance', 'Performance Optimization',
		'Optimize websites to load faster using code splitting, lazy loading, caching strategies, and minimizing render-blocking resources.',
		'I optimize websites to load faster and run efficiently by implementing techniques like code splitting, lazy loading, caching strategies, and minimizing render-blocking resources. A fast website not only improves user experience but also boosts SEO rankings.',
		'gauge', '$20/hour',
		ARRAY['Core Web Vitals improvement','Lighthouse score optimization','Bundle size reduction','Image optimization','Server-side rendering'], 3),
	('service-api', 'api', 'API Integration',
		'Seamless integration of frontend applications with backend systems using RESTful APIs and Firebase.',
		'I seamlessly integrate frontend applications with backend systems using RESTful and Firebase. Whether it''s fetching real-time data, handling authentication, or synchronizing state, I ensure smooth and secure communication between the client and server.',
		'database', '$20/hour',
		ARRAY['RESTful API integration','GraphQL implementation','Real-time data synchronization','Authentication & authorization','Error handling & retry logic'], 4),
	('service-animation', 'animation', 'Web Animation',
		'Engaging animations using Framer Motion and CSS, from micro-interactions to complex page transitions.',
		'I bring websites to life with smooth and engaging animations using Framer Motion, and CSS. From micro-interactions to complex page transitions, I create visually appealing effects that enhance user engagement and storytelling.',
		'zap', '$20/hour',
		ARRAY['Smooth page transitions','Micro-interactions','SVG animations','3D effects','Performance-optimized animations'], 5),
	('service-leadership', 'leadership', 'Technical Leadership',
		'Leading development teams, conducting code reviews, and ensuring efficient collaboration with coding standards.',
		'I have experience leading small development teams, conducting code reviews, and ensuring efficient collaboration. By setting coding standards, improving workflows, and mentoring team members, I help drive projects forward effectively.',
		'users', '$40/hour',
		ARRAY['Code review & mentoring','Architecture planning','Best practices implementation','Team workflow optimization','Technical documentation'], 6);--> statement-breakpoint
INSERT INTO "pricing_tiers" ("id", "slug", "name", "price_label", "description", "features", "is_popular", "cta_label", "sort_order") VALUES
	('tier-basic', 'basic', 'Basic', '$25/hour',
		'Perfect for small projects and quick tasks',
		ARRAY['Responsive design implementation','Bug fixes and improvements','Basic UI component development','Code review and optimization','Up to 20 hours per week'],
		false, 'Get Started', 1),
	('tier-professional', 'professional', 'Professional', '$999/week',
		'Ideal for medium-sized projects and ongoing development',
		ARRAY['Everything in Basic tier','Full-stack implementation','API integration','Performance optimization','Regular progress updates','Up to 40 hours per week'],
		true, 'Most Popular', 2),
	('tier-enterprise', 'enterprise', 'Enterprise', 'Custom',
		'For large-scale projects and dedicated development',
		ARRAY['Everything in Professional tier','Dedicated development team','Technical leadership','Architecture planning','Code documentation','24/7 priority support'],
		false, 'Contact for Quote', 3);--> statement-breakpoint
INSERT INTO "faqs" ("id", "question", "answer", "sort_order") VALUES
	('faq-1', 'What is your typical turnaround time?',
		'Turnaround time varies depending on project complexity. Small projects typically take 1-2 weeks, while larger projects may take 4-8 weeks or more. I''ll provide a specific timeline during our consultation.', 1),
	('faq-2', 'Do you offer ongoing maintenance?',
		'Yes, I offer maintenance packages to keep your project up-to-date and running smoothly. We can discuss maintenance options based on your specific needs.', 2),
	('faq-3', 'How do payments work?',
		'For most projects, I require a 50% deposit to begin work, with the remaining 50% due upon completion. For larger projects, we can establish a milestone-based payment schedule.', 3),
	('faq-4', 'Can you work with my existing team?',
		'I''m experienced in collaborating with existing teams and can adapt to your workflow and communication preferences.', 4),
	('faq-5', 'Do you sign NDAs?',
		'Yes, I''m happy to sign a Non-Disclosure Agreement before discussing your project details to protect your confidential information.', 5),
	('faq-6', 'What if I''m not satisfied with the work?',
		'Your satisfaction is my priority. I offer revision rounds as part of the project scope. If you''re not satisfied, we''ll work together to address your concerns until you''re happy with the results.', 6);--> statement-breakpoint
INSERT INTO "process_steps" ("id", "scope", "title", "description", "icon", "sort_order") VALUES
	('ps-svc-1', 'services', 'Request', 'Submit your project details through the form above.', NULL, 1),
	('ps-svc-2', 'services', 'Consultation', 'We''ll discuss your needs and I''ll provide a custom quote.', NULL, 2),
	('ps-svc-3', 'services', 'Development', 'I''ll work on your project with regular updates and feedback.', NULL, 3),
	('ps-svc-4', 'services', 'Delivery', 'You''ll receive the completed project with documentation and support.', NULL, 4),
	('ps-hire-1', 'hire-me', 'Discovery Call', 'We''ll discuss your project requirements, timeline, and budget to ensure we''re a good fit for each other.', 'message-square', 1),
	('ps-hire-2', 'hire-me', 'Proposal & Agreement', 'I''ll provide a detailed proposal outlining scope, deliverables, timeline, and pricing for your project.', 'check-circle', 2),
	('ps-hire-3', 'hire-me', 'Development', 'I''ll work on your project with regular updates and check-ins to ensure we''re on the right track.', 'code', 3),
	('ps-hire-4', 'hire-me', 'Delivery & Support', 'Once complete, I''ll deliver the final product and provide support to ensure everything works perfectly.', 'zap', 4);--> statement-breakpoint
INSERT INTO "availability_slots" ("id", "month", "year", "status", "label", "sort_order") VALUES
	('avail-2026-09', 9, 2026, 'available', 'Available', 1),
	('avail-2026-10', 10, 2026, 'available', 'Available', 2),
	('avail-2026-11', 11, 2026, 'available', 'Available', 3),
	('avail-2026-12', 12, 2026, 'available', 'Available', 4);--> statement-breakpoint
INSERT INTO "offers" ("id", "slug", "title", "description", "icon", "price", "for_who", "extras", "is_popular", "color", "sort_order") VALUES
	('offer-landing-page', 'landing-page', 'Landing Page Express',
		'Convert visitors into customers with a high-converting landing page', 'layout-grid', 2500000,
		'Small businesses, startups, or individuals looking to promote a specific product or service',
		ARRAY['Responsive design for all devices','SEO optimization','Contact form integration','2 rounds of revisions','Delivery in 7-10 days'],
		true, 'blue', 1),
	('offer-website', 'website', 'Professional Website',
		'Full website development with multiple pages and custom features', 'globe', 7500000,
		'Established businesses that need a complete web presence with multiple sections',
		ARRAY['Up to 5 pages (Home, About, Services, Portfolio, Contact)','Responsive design for all devices','SEO optimization','Contact form & Google Maps integration','Basic CMS implementation','3 rounds of revisions','Delivery in 3-4 weeks'],
		false, 'indigo', 2),
	('offer-ecommerce', 'ecommerce', 'E-Commerce Solution',
		'Sell your products online with a custom e-commerce website', 'shopping-cart', 12500000,
		'Retailers and product-based businesses looking to sell online',
		ARRAY['Product catalog with categories','Shopping cart & checkout functionality','Payment gateway integration','Inventory management','Order tracking system','Mobile responsive design','Delivery in 5-6 weeks'],
		false, 'violet', 3),
	('offer-code-review', 'code-review', 'Frontend Code Review',
		'Expert evaluation of your frontend codebase with actionable improvements', 'code-2', 1000000,
		'Development teams seeking to improve code quality and best practices',
		ARRAY['Comprehensive code quality assessment','Performance optimization suggestions','Security vulnerability checks','Best practices implementation guidance','Documentation recommendations','Delivery in 3-5 days'],
		false, 'emerald', 4),
	('offer-redesign', 'redesign', 'Website Redesign',
		'Breathe new life into your outdated website with a modern refresh', 'refresh-cw', 4000000,
		'Businesses with existing websites that need a visual and functional upgrade',
		ARRAY['Modern UI/UX redesign','Performance optimization','Mobile responsiveness improvements','SEO enhancements','Content restructuring','Delivery in 2-3 weeks'],
		false, 'purple', 5),
	('offer-seo', 'seo', 'SEO Website Audit',
		'Comprehensive analysis of your website''s SEO with actionable improvements', 'search', 1500000,
		'Website owners looking to improve search engine rankings and visibility',
		ARRAY['Keyword analysis & recommendations','On-page SEO assessment','Technical SEO audit','Competitor analysis','Content optimization suggestions','Detailed report with action items','Delivery in 1-2 weeks'],
		false, 'yellow', 6),
	('offer-webapp', 'webapp', 'Custom Web Application',
		'Tailored web application development to solve your specific business needs', 'server-cog', 15000000,
		'Businesses requiring specialized functionality beyond a standard website',
		ARRAY['Custom functionality development','User authentication system','Database integration','API development','Admin dashboard','Documentation and training','Delivery in 8-12 weeks'],
		false, 'sky', 7),
	('offer-mobile-responsive', 'mobile-responsive', 'Mobile Responsiveness',
		'Make your existing website work flawlessly on all mobile devices', 'smartphone', 2000000,
		'Website owners whose sites don''t perform well on mobile and tablet devices',
		ARRAY['Full mobile responsiveness implementation','Touch-friendly navigation','Performance optimization for mobile','Testing across multiple devices','Delivery in 1-2 weeks'],
		false, 'teal', 8),
	('offer-express-dev', 'express-dev', 'Express Development',
		'Rapid development for time-sensitive projects with quick turnaround', 'zap', 9000000,
		'Clients with urgent website or application needs and tight deadlines',
		ARRAY['Expedited development process','Daily progress updates','Priority support','Focused feature implementation','Delivery in 1-2 weeks (project dependent)'],
		true, 'rose', 9);--> statement-breakpoint
INSERT INTO "site_pages" ("id", "slug", "title", "content", "updated_at") VALUES
('site-page-privacy', 'privacy-policy', 'Privacy Policy', $mdx$## 1. Introduction

At John Doe ("we," "us," or "our"), we respect your privacy and are committed to protecting your personal data. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website or use our services.

Please read this Privacy Policy carefully. If you do not agree with the terms of this Privacy Policy, please do not access our website or use our services.

## 2. Information We Collect

We may collect the following types of information:

### 2.1. Personal Information

When you contact us through our website, request our services, or communicate with us, we may collect personal information such as:

- Name
- Email address
- Phone number
- Company name (if applicable)
- Project details and requirements
- Any other information you choose to provide

### 2.2. Usage Information

We may automatically collect certain information about your device and how you interact with our website, including:

- IP address
- Browser type and version
- Operating system
- Referring website
- Pages visited and time spent on those pages
- Time and date of your visit
- Other statistics

### 2.3. Cookies and Similar Technologies

We may use cookies, web beacons, and similar technologies to enhance your experience on our website. You can control cookies through your browser settings and other tools.

## 3. How We Use Your Information

We may use the information we collect for various purposes, including to:

- Provide, maintain, and improve our services
- Process and fulfill your service requests
- Communicate with you about your service requests, inquiries, or projects
- Send you technical notices, updates, security alerts, and administrative messages
- Respond to your comments, questions, and customer service requests
- Monitor and analyze trends, usage, and activities in connection with our website
- Detect, prevent, and address technical issues
- Protect against harmful, unauthorized, or illegal activity

## 4. How We Share Your Information

We may share your information in the following circumstances:

- **Service Providers**: We may share your information with third-party vendors, service providers, contractors, or agents who perform services for us or on our behalf.
- **Legal Requirements**: We may disclose your information if required to do so by law or in response to valid requests by public authorities.
- **Business Transfers**: We may share or transfer your information in connection with, or during negotiations of, any merger, sale of company assets, financing, or acquisition of all or a portion of our business.
- **With Your Consent**: We may share your information with your consent or at your direction.

## 5. Data Security

We implement appropriate technical and organizational measures to protect your personal information from unauthorized access, disclosure, alteration, and destruction. However, no method of transmission over the Internet or electronic storage is 100% secure, and we cannot guarantee absolute security.

## 6. Data Retention

We will retain your personal information only for as long as necessary to fulfill the purposes for which it was collected, including for the purposes of satisfying any legal, accounting, or reporting requirements.

## 7. Your Rights

Depending on your location, you may have certain rights regarding your personal information, including:

- The right to access your personal information
- The right to rectify inaccurate or incomplete information
- The right to erasure (or "right to be forgotten")
- The right to restrict processing
- The right to data portability
- The right to object to processing
- The right to withdraw consent

To exercise these rights, please contact us using the information provided in the "Contact Information" section below.

## 8. Children's Privacy

Our website and services are not intended for children under the age of 16. We do not knowingly collect personal information from children under 16. If you are a parent or guardian and believe that your child has provided us with personal information, please contact us, and we will delete such information from our records.

## 9. Third-Party Links

Our website may contain links to third-party websites or services. We are not responsible for the privacy practices or content of these third-party sites. We encourage you to read the privacy policies of any third-party sites you visit.

## 10. Changes to This Privacy Policy

We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date. You are advised to review this Privacy Policy periodically for any changes.

## 11. Contact Information

If you have any questions about this Privacy Policy, please contact us at: [hello@example.com](mailto:hello@example.com)$mdx$, '2024-04-08T00:00:00+07:00'),
('site-page-terms', 'terms-of-service', 'Terms of Service', $mdx$## 1. Introduction

Welcome to John Doe's professional services. These Terms of Service ("Terms") govern your use of our website, services, and any other related services (collectively, the "Services") provided by John Doe ("we," "us," or "our").

By accessing or using our Services, you agree to be bound by these Terms. If you do not agree to these Terms, please do not use our Services.

## 2. Services Description

We provide professional web development services including but not limited to frontend development, UI/UX implementation, performance optimization, API integration, web animation, and technical leadership. The specific details of the services to be provided will be outlined in a separate agreement or statement of work between you and us.

## 3. Service Request and Delivery

3.1. **Service Requests**: You may request our services through our website contact form, email, or other designated channels. All requests are subject to our review and acceptance.

3.2. **Project Scope**: The scope of work, deliverables, timeline, and payment terms will be agreed upon in writing before the commencement of any project.

3.3. **Revisions**: Unless otherwise specified in the project agreement, reasonable revisions are included in the project scope. Additional revisions may incur extra charges.

3.4. **Delivery**: We will make reasonable efforts to deliver the services within the agreed timeframe. However, we are not responsible for delays caused by factors beyond our control or by your failure to provide necessary information or materials.

## 4. Client Responsibilities

4.1. **Cooperation**: You agree to provide timely and accurate information, materials, and feedback necessary for us to perform the services.

4.2. **Content**: You are responsible for the accuracy, legality, and ownership of all content and materials you provide to us.

4.3. **Approvals**: You are responsible for reviewing and approving deliverables in a timely manner.

## 5. Fees and Payment

5.1. **Fees**: Our fees will be as specified in the project agreement. We reserve the right to change our fees for future services.

5.2. **Payment Terms**: Unless otherwise specified, we require a 50% deposit before commencing work, with the remaining balance due upon completion. For larger projects, we may establish a milestone-based payment schedule.

5.3. **Late Payments**: Late payments may incur interest charges and may result in suspension of services.

## 6. Intellectual Property

6.1. **Your Content**: You retain ownership of all content and materials you provide to us.

6.2. **Our Work**: Upon full payment, you will receive a non-exclusive license to use the deliverables for the intended purpose. We retain ownership of all pre-existing materials, tools, and methodologies used in creating the deliverables.

6.3. **Portfolio Rights**: Unless explicitly prohibited in writing, we reserve the right to display and link to your completed project as part of our portfolio and to write about the project for promotional purposes.

## 7. Confidentiality

We will maintain the confidentiality of any proprietary information shared with us during the course of providing services. This obligation does not apply to information that is publicly available or that we obtained from other sources.

## 8. Limitation of Liability

8.1. **No Warranties**: Our services are provided "as is" without any warranties, express or implied.

8.2. **Limitation of Liability**: To the maximum extent permitted by law, we shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly.

8.3. **Maximum Liability**: Our total liability for any claim arising out of or relating to these Terms or our services shall not exceed the amount you paid us for the services giving rise to the claim.

## 9. Termination

9.1. **By You**: You may terminate a project at any time by providing written notice. You will be responsible for payment for all services performed up to the date of termination.

9.2. **By Us**: We may terminate a project if you breach these Terms or the project agreement, or if we are unable to perform the services due to circumstances beyond our control.

## 10. Governing Law

These Terms shall be governed by and construed in accordance with the laws of Indonesia, without regard to its conflict of law principles.

## 11. Dispute Resolution

Any dispute arising out of or relating to these Terms or our services shall be resolved through good faith negotiations. If negotiations fail, the dispute shall be submitted to binding arbitration in accordance with the rules of the Indonesian National Board of Arbitration.

## 12. Changes to Terms

We reserve the right to modify these Terms at any time. We will provide notice of significant changes by posting the updated Terms on our website. Your continued use of our Services after such changes constitutes your acceptance of the new Terms.

## 13. Contact Information

If you have any questions about these Terms, please contact us at [hello@example.com](mailto:hello@example.com).$mdx$, '2024-04-08T00:00:00+07:00');
