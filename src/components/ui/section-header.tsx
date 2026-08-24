import { cn } from "@/lib/utils";

interface SectionHeaderProps {
	title: string;
	subtitle: string;
	description?: string;
	align?: "left" | "center" | "right";
	className?: string;
}

export function SectionHeader({
	title,
	subtitle,
	description,
	align = "center",
	className,
}: SectionHeaderProps) {
	return (
		<div
			className={cn(
				"space-y-3",
				align === "center" && "text-center",
				align === "right" && "text-right",
				className
			)}
		>
			{subtitle && (
				<div>
					<span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold border border-primary/20 tracking-wide">
						{subtitle}
					</span>
				</div>
			)}

			<h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-foreground">
				{title}
			</h2>

			{description && (
				<p className="text-xs sm:text-sm md:text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed">
					{description}
				</p>
			)}
		</div>
	);
}
