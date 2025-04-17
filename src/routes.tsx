import { ProtectedRoute } from "@/components/auth/protected-route";
import { Layout } from "@/components/layout/layout";
import { PageLoader } from "@/components/ui/page-loader";
import { AuthProvider } from "@/contexts/auth-context";
import { Suspense, lazy } from "react";
import { Outlet, Route, Routes } from "react-router-dom";

// Lazy imports
const Home = lazy(() => import("@/pages/home"));
const Blog = lazy(() => import("@/pages/blog"));
const BlogDetail = lazy(() => import("@/pages/blog-detail"));
const Projects = lazy(() => import("@/pages/projects"));
const ProjectDetail = lazy(() => import("@/pages/project-detail"));
const About = lazy(() => import("@/pages/about"));
const Contact = lazy(() => import("@/pages/contact"));
const Services = lazy(() => import("@/pages/services"));
const BookConsultation = lazy(() => import("@/pages/book-consultation"));
const NotFound = lazy(() => import("@/pages/not-found"));
const Auth = lazy(() => import("@/pages/cms/auth"));
const Dashboard = lazy(() => import("@/pages/cms/dashboard"));
const FormBlog = lazy(() => import("@/pages/cms/blog/form-blog"));
const FormProject = lazy(() => import("@/pages/cms/projects/form-project"));
const CmsBlogs = lazy(() => import("@/pages/cms/blog/list-blog"));
const CmsProjects = lazy(() => import("@/pages/cms/projects/list-project"));
const CmsContacts = lazy(() => import("@/pages/cms/contacts/list-contact"));
const CmsServices = lazy(() => import("@/pages/cms/services/list-service"));
const CmsConsultations = lazy(() => import("@/pages/cms/consultations/list-consultations"));
const CmsConsultationSettings = lazy(() => import("@/pages/cms/consultations/settings"));
const CmsProfile = lazy(() => import("@/pages/cms/profile"));
const CmsSettings = lazy(() => import("@/pages/cms/settings"));
const TermsOfService = lazy(() => import("@/pages/terms-of-service"));
const PrivacyPolicy = lazy(() => import("@/pages/privacy-policy"));
const HireMePage = lazy(() => import("@/pages/hire-me"));

// Archive routes
const Offers = lazy(() => import("@/pages/offers"));

const LayoutWrapper = () => (
	<Layout>
		<Outlet />
	</Layout>
);

const AppRoutes = () => (
	<AuthProvider>
		<Suspense fallback={<PageLoader />}>
			<Routes>
				<Route element={<LayoutWrapper />}>
					<Route path="/" element={<Home />} />
					<Route path="/blog" element={<Blog />} />
					<Route path="/blog/:slug" element={<BlogDetail />} />
					<Route path="/projects" element={<Projects />} />
					<Route path="/projects/:slug" element={<ProjectDetail />} />
					<Route path="/about" element={<About />} />
					<Route path="/contact" element={<Contact />} />
					<Route path="/services" element={<Services />} />
					<Route path="/book-consultation" element={<BookConsultation />} />
					<Route path="/terms-of-service" element={<TermsOfService />} />
					<Route path="/privacy-policy" element={<PrivacyPolicy />} />
					<Route path="/hire-me" element={<HireMePage />} />

					{/* Archive routes */}
					<Route path="/offers" element={<Offers />} />
				</Route>

				{/* Auth routes - protect from authenticated users */}
				<Route
					path="/auth"
					element={
						<ProtectedRoute requireAuth={false}>
							<Auth />
						</ProtectedRoute>
					}
				/>

				{/* Protected CMS Routes */}
				<Route
					path="/cms/dashboard"
					element={
						<ProtectedRoute>
							<Dashboard />
						</ProtectedRoute>
					}
				/>
				<Route
					path="/blog/new"
					element={
						<ProtectedRoute>
							<FormBlog />
						</ProtectedRoute>
					}
				/>
				<Route
					path="/blog/edit/:id"
					element={
						<ProtectedRoute>
							<FormBlog />
						</ProtectedRoute>
					}
				/>
				<Route
					path="/projects/new"
					element={
						<ProtectedRoute>
							<FormProject />
						</ProtectedRoute>
					}
				/>
				<Route
					path="/projects/edit/:id"
					element={
						<ProtectedRoute>
							<FormProject />
						</ProtectedRoute>
					}
				/>
				<Route
					path="/cms/blogs"
					element={
						<ProtectedRoute>
							<CmsBlogs />
						</ProtectedRoute>
					}
				/>
				<Route
					path="/cms/projects"
					element={
						<ProtectedRoute>
							<CmsProjects />
						</ProtectedRoute>
					}
				/>
				<Route
					path="/cms/contacts"
					element={
						<ProtectedRoute>
							<CmsContacts />
						</ProtectedRoute>
					}
				/>
				<Route
					path="/cms/services"
					element={
						<ProtectedRoute>
							<CmsServices />
						</ProtectedRoute>
					}
				/>
				<Route
					path="/cms/consultations"
					element={
						<ProtectedRoute>
							<CmsConsultations />
						</ProtectedRoute>
					}
				/>
				<Route
					path="/cms/consultations/settings"
					element={
						<ProtectedRoute>
							<CmsConsultationSettings />
						</ProtectedRoute>
					}
				/>
				<Route
					path="/cms/profile"
					element={
						<ProtectedRoute>
							<CmsProfile />
						</ProtectedRoute>
					}
				/>
				<Route
					path="/cms/settings"
					element={
						<ProtectedRoute>
							<CmsSettings />
						</ProtectedRoute>
					}
				/>

				{/* 404 Page */}
				<Route path="*" element={<NotFound />} />
			</Routes>
		</Suspense>
	</AuthProvider>
);

export default AppRoutes;
