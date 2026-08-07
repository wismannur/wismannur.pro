import clsx from "clsx";
import { Sparkles } from "lucide-react";

type BlogHeaderProps = {
	eyebrow?: string;
	title?: string;
	description?: string;
};

const BlogHeader = ({ eyebrow, title, description }: BlogHeaderProps) => {
	return (
		<div className="text-center mb-16 space-y-4">
			<div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary font-medium">
				<Sparkles size={16} />
				{eyebrow}
			</div>
			<h1 className="text-4xl md:text-5xl font-bold">{title}</h1>
			<p className="text-muted-foreground text-lg max-w-2xl mx-auto">{description}</p>
			<div className={clsx("h-1 w-16 bg-primary/80 rounded-full mx-auto")} />
		</div>
	);
};

export default BlogHeader;
