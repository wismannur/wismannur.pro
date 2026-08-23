import { cn } from "@/lib/utils";

interface RecaptchaDisclaimerProps {
	className?: string;
}

export function RecaptchaDisclaimer({ className }: RecaptchaDisclaimerProps) {
	return (
		<p className={cn("text-xs text-muted-foreground leading-relaxed", className)}>
			This site is protected by reCAPTCHA and the Google{" "}
			<a
				href="https://policies.google.com/privacy"
				target="_blank"
				rel="noopener noreferrer"
				className="underline hover:text-foreground transition-colors"
			>
				Privacy Policy
			</a>{" "}
			and{" "}
			<a
				href="https://policies.google.com/terms"
				target="_blank"
				rel="noopener noreferrer"
				className="underline hover:text-foreground transition-colors"
			>
				Terms of Service
			</a>{" "}
			apply.
		</p>
	);
}
