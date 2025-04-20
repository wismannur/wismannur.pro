import { CmsLayout } from "@/components/layout/cms-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/auth-context";
import { calculateReadingTime } from "@/lib/mdx";
import { queryClient } from "@/lib/query-client";
import { Blog, blogService, NewBlog } from "@/services";
import { zodResolver } from "@hookform/resolvers/zod";
import { Timestamp } from "firebase/firestore";
import { ArrowRight, Check, Clock, FileText, Info, Loader2, Save, Tag } from "lucide-react";
import { lazy, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { z } from "zod";

const MDXEditor = lazy(() => import(`@/components/mdx/mdx-editor`));

const blogSchema = z.object({
	title: z.string().min(5, { message: "Title must be at least 5 characters" }),
	summary: z.string().min(10, { message: "Summary must be at least 10 characters" }),
	content: z.string().min(50, { message: "Content must be at least 50 characters" }),
	tags: z.string().min(3, { message: "Tags must be at least 3 characters" }),
	image: z.string().optional(),
	isPublished: z.boolean().default(false),
});

type BlogFormValues = z.infer<typeof blogSchema>;

const FormBlog = () => {
	const { user } = useAuth();
	const navigate = useNavigate();
	const { id } = useParams<{ id: string }>();
	const isEditMode = Boolean(id);

	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isLoading, setIsLoading] = useState(isEditMode);
	const [selectedImage, setSelectedImage] = useState<string | null>(null);
	const [readingTime, setReadingTime] = useState(0);
	const [currentBlog, setCurrentBlog] = useState<Blog | null>(null);

	const form = useForm<BlogFormValues>({
		resolver: zodResolver(blogSchema),
		defaultValues: {
			title: "",
			summary: "",
			content: "",
			tags: "",
			isPublished: false,
		},
	});

	const contentValues = form.getValues("content");

	useEffect(() => {
		const fetchBlog = async () => {
			if (id) {
				setIsLoading(true);
				try {
					const blog = await blogService.getById(id);
					if (blog) {
						setCurrentBlog(blog);
						form.reset({
							title: blog.title,
							summary: blog.summary,
							content: blog.content,
							tags: blog.tags.join(", "),
							isPublished: Boolean(blog.isPublished),
						});

						if (blog.image) {
							setSelectedImage(blog.image);
						}

						const time = calculateReadingTime(blog.content);
						setReadingTime(time);
					} else {
						toast.error("Blog not found");
						navigate("/cms/blogs");
					}
				} catch (error) {
					console.error("Error fetching blog:", error);
					toast.error("Failed to load blog");
				} finally {
					setIsLoading(false);
				}
			}
		};

		fetchBlog();
	}, [id, form, navigate]);

	useEffect(() => {
		const subscription = form.watch((value) => {
			if (value.content) {
				const time = calculateReadingTime(value.content);
				setReadingTime(time);
			}
		});
		return () => subscription.unsubscribe();
	}, [form.watch]);

	if (!user) {
		return <Navigate to="/auth" />;
	}

	const createSlug = (title: string) => {
		return title
			.toLowerCase()
			.replace(/[^\w\s-]/g, "")
			.replace(/\s+/g, "-");
	};

	const onSubmit = async (data: BlogFormValues) => {
		if (!user) return;

		setIsSubmitting(true);
		try {
			const tagList = data.tags
				.split(",")
				.map((tag) => tag.trim())
				.filter((tag) => tag.length > 0);

			const imageUrl = data.image || currentBlog?.image || "";
			const readingTime = calculateReadingTime(data.content);

			if (isEditMode && id) {
				await blogService.update(id, {
					title: data.title,
					summary: data.summary,
					content: data.content,
					image: imageUrl,
					tags: tagList,
					readingTime,
					isPublished: data.isPublished,
					...(data.isPublished && !currentBlog?.publishedDate
						? { publishedDate: Timestamp.now() }
						: { publishedDate: null }),
				});

				toast.success("Blog post updated successfully!");
			} else {
				const slug = createSlug(data.title);

				const newBlog: NewBlog = {
					title: data.title,
					slug,
					summary: data.summary,
					content: data.content,
					image: imageUrl,
					isPublished: data.isPublished,
					publishedDate: data.isPublished ? Timestamp.now() : null,
					tags: tagList,
					views: 0,
					likes: 0,
					readingTime,
					authorId: user.uid,
					authorName: user.displayName || "Anonymous",
				};

				await blogService.create(newBlog);
				toast.success("Blog post published successfully!");
			}

			queryClient.invalidateQueries({ queryKey: ["blogs", "latestBlogs"] });
			navigate("/cms/blogs");
		} catch (error) {
			console.error("Error saving blog:", error);
			toast.error("Failed to save blog post. Please try again.");
		} finally {
			setIsSubmitting(false);
		}
	};

	if (isLoading) {
		return (
			<CmsLayout>
				<div className="flex items-center justify-center h-96">
					<Loader2 className="h-10 w-10 animate-spin text-primary" />
					<span className="ml-2 text-lg">Loading blog post...</span>
				</div>
			</CmsLayout>
		);
	}

	return (
		<CmsLayout>
			<div className="max-w-6xl mx-auto">
				<div className="flex flex-col md:flex-row items-center justify-between gap-2 md:gap-0 mb-8">
					<h1 className="text-3xl font-bold">
						{isEditMode ? "Edit Blog Post" : "Create New Blog Post"}
					</h1>
					<div className="flex items-center text-muted-foreground">
						<Clock className="h-4 w-4 mr-1.5" />
						<span className="text-sm">Estimated reading time: {readingTime} min</span>
					</div>
				</div>

				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)}>
						<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
							<div className="lg:col-span-2">
								<Card className="border-border/50 shadow-md rounded-xl overflow-hidden">
									<CardHeader className="bg-muted/30 border-b border-border/30">
										<CardTitle className="flex items-center">
											<FileText className="h-5 w-5 mr-2 text-primary" />
											Blog Content
										</CardTitle>
									</CardHeader>
									<CardContent className="space-y-6 p-6">
										<FormField
											control={form.control}
											name="isPublished"
											render={({ field }) => (
												<FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
													<div className="space-y-0.5">
														<FormLabel className="text-base">Publication Status</FormLabel>
														<div className="text-sm text-muted-foreground">
															{field.value
																? "Your article will be publicly visible"
																: "Your article will be saved as a draft"}
														</div>
													</div>
													<FormControl>
														<Switch checked={field.value} onCheckedChange={field.onChange} />
													</FormControl>
												</FormItem>
											)}
										/>

										<FormField
											control={form.control}
											name="title"
											render={({ field }) => (
												<FormItem>
													<FormLabel className="text-foreground/80 font-medium">
														Blog Title
													</FormLabel>
													<FormControl>
														<Input
															placeholder="Enter blog title"
															className="rounded-lg border-border/50 focus-visible:ring-primary/30"
															{...field}
														/>
													</FormControl>
													<FormMessage />
													<div className="text-xs text-muted-foreground mt-1">
														Slug: {form.watch("title") ? createSlug(form.watch("title")) : ""}
													</div>
												</FormItem>
											)}
										/>

										<FormField
											control={form.control}
											name="summary"
											render={({ field }) => (
												<FormItem>
													<FormLabel className="text-foreground/80 font-medium">Summary</FormLabel>
													<FormControl>
														<Textarea
															placeholder="Brief summary of your blog post"
															className="resize-none h-20 rounded-lg border-border/50 focus-visible:ring-primary/30"
															{...field}
														/>
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>

										<FormField
											control={form.control}
											name="content"
											render={({ field }) => (
												<FormItem>
													<FormLabel className="text-foreground/80 font-medium m-0">
														Content (MDX)
													</FormLabel>
													<FormControl>
														<MDXEditor
															initialCode={contentValues}
															onChange={(code) => field.onChange(code)}
														/>
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>
									</CardContent>
								</Card>
							</div>

							<div className="lg:col-span-1">
								<div className="space-y-6 sticky">
									<Card className="border-border/50 shadow-md rounded-xl overflow-hidden">
										<CardHeader className="bg-muted/30 border-b border-border/30">
											<CardTitle className="flex items-center">
												<Tag className="h-5 w-5 mr-2 text-primary" />
												Blog Post Details
											</CardTitle>
										</CardHeader>
										<CardContent className="space-y-6 p-6">
											<FormField
												control={form.control}
												name="tags"
												render={({ field }) => (
													<FormItem>
														<FormLabel className="text-foreground/80 font-medium">Tags</FormLabel>
														<FormControl>
															<Input
																placeholder="technology, react, web-dev"
																className="rounded-lg border-border/50 focus-visible:ring-primary/30"
																{...field}
															/>
														</FormControl>
														<div className="text-xs text-muted-foreground mt-2 flex items-center">
															<Info className="h-3.5 w-3.5 mr-1.5" />
															Separate tags with commas
														</div>
														<FormMessage />
													</FormItem>
												)}
											/>

											<FormField
												control={form.control}
												name="image"
												render={({ field: { value, onChange, ...fieldProps } }) => (
													<FormItem>
														<FormLabel className="text-foreground/80 font-medium">
															Featured Image
														</FormLabel>
														<FormControl>
															<div className="space-y-3">
																<div className="relative">
																	<Input
																		placeholder="Enter image URL"
																		className="rounded-lg border-border/50 focus-visible:ring-primary/30"
																		value={selectedImage || ""}
																		onChange={(e) => {
																			setSelectedImage(e.target.value);
																			form.setValue("image", e.target.value);
																		}}
																	/>
																</div>
																{selectedImage && (
																	<div className="relative aspect-video rounded-lg overflow-hidden border border-border/50 bg-muted/30">
																		<img
																			src={selectedImage || "/placeholder.svg"}
																			alt="Preview"
																			className="w-full h-full object-cover"
																			onError={(e) => {
																				e.currentTarget.src = "/placeholder.svg";
																			}}
																		/>
																		<Button
																			type="button"
																			variant="destructive"
																			size="sm"
																			className="absolute top-2 right-2 h-8 w-8 p-0 rounded-full"
																			onClick={() => {
																				setSelectedImage(null);
																				form.setValue("image", "");
																			}}
																		>
																			<span className="sr-only">Remove image</span>×
																		</Button>
																	</div>
																)}
																<p className="text-xs text-muted-foreground">
																	Recommended: 1200 × 630 pixels
																</p>
															</div>
														</FormControl>
														<FormMessage />
													</FormItem>
												)}
											/>
										</CardContent>
										<CardFooter className="px-6 py-4 bg-muted/20 border-t border-border/30">
											<Button
												type="submit"
												className="w-full rounded-lg group relative overflow-hidden"
												disabled={isSubmitting}
											>
												{isSubmitting ? (
													<>
														<Loader2 className="mr-2 h-4 w-4 animate-spin" />
														{form.getValues("isPublished") ? "Publishing..." : "Saving..."}
													</>
												) : (
													<>
														<span className="flex items-center group-hover:-translate-x-1 transition-transform duration-300">
															{form.getValues("isPublished") ? (
																<>
																	<Check className="mr-2 h-4 w-4" />
																	Publish Blog Post
																</>
															) : (
																<>
																	<Save className="mr-2 h-4 w-4" />
																	Save as Draft
																</>
															)}
														</span>
														<ArrowRight className="absolute right-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 -translate-x-4 transition-all duration-300" />
													</>
												)}
											</Button>
										</CardFooter>
									</Card>

									<Card className="border-border/50 shadow-md rounded-xl overflow-hidden">
										<CardHeader className="bg-muted/30 border-b border-border/30 py-3">
											<CardTitle className="text-sm flex items-center">
												<Info className="h-4 w-4 mr-2 text-primary" />
												MDX Tips
											</CardTitle>
										</CardHeader>
										<CardContent className="p-4">
											<div className="text-xs space-y-2 text-muted-foreground">
												<p>
													<span className="font-semibold">Headings:</span> Use # for h1, ## for h2,
													etc.
												</p>
												<p>
													<span className="font-semibold">Lists:</span> Use - or * for bullet
													points, 1. for numbered lists
												</p>
												<p>
													<span className="font-semibold">Links:</span> [Link
													text](https://example.com)
												</p>
												<p>
													<span className="font-semibold">Images:</span> ![Alt
													text](https://example.com/image.jpg)
												</p>
												<p>
													<span className="font-semibold">Code:</span> `inline code` or ```js
													<br />
													// code block
													<br />
													```
												</p>
											</div>
										</CardContent>
									</Card>
								</div>
							</div>
						</div>
					</form>
				</Form>
			</div>
		</CmsLayout>
	);
};

export default FormBlog;
