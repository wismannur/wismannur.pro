"use client";

import React, { useRef, useState, useCallback } from "react";
import { cn } from "@/lib/utils";

interface SpotlightCardProps extends React.HTMLAttributes<HTMLDivElement> {
	children: React.ReactNode;
	className?: string;
	spotlightColor?: string;
	spotlightSize?: number;
	hoverBorderColor?: string;
}

export function SpotlightCard({
	children,
	className,
	spotlightColor = "rgba(99, 102, 241, 0.18)",
	spotlightSize = 350,
	hoverBorderColor = "rgba(99, 102, 241, 0.4)",
	onMouseMove,
	onMouseEnter,
	onMouseLeave,
	...props
}: SpotlightCardProps) {
	const divRef = useRef<HTMLDivElement>(null);
	const [position, setPosition] = useState({ x: 0, y: 0 });
	const [opacity, setOpacity] = useState(0);

	const handleMouseMove = useCallback(
		(e: React.MouseEvent<HTMLDivElement>) => {
			if (!divRef.current) return;
			const rect = divRef.current.getBoundingClientRect();
			setPosition({
				x: e.clientX - rect.left,
				y: e.clientY - rect.top,
			});
			if (onMouseMove) onMouseMove(e);
		},
		[onMouseMove]
	);

	const handleMouseEnter = useCallback(
		(e: React.MouseEvent<HTMLDivElement>) => {
			setOpacity(1);
			if (onMouseEnter) onMouseEnter(e);
		},
		[onMouseEnter]
	);

	const handleMouseLeave = useCallback(
		(e: React.MouseEvent<HTMLDivElement>) => {
			setOpacity(0);
			if (onMouseLeave) onMouseLeave(e);
		},
		[onMouseLeave]
	);

	return (
		<div
			ref={divRef}
			onMouseMove={handleMouseMove}
			onMouseEnter={handleMouseEnter}
			onMouseLeave={handleMouseLeave}
			className={cn(
				"relative rounded-2xl border border-border/50 bg-card/60 backdrop-blur-sm overflow-hidden transition-all duration-300",
				className
			)}
			{...props}
		>
			{/* Spotlight background glow layer */}
			<div
				className="pointer-events-none absolute -inset-px transition-opacity duration-300 z-0"
				style={{
					opacity,
					background: `radial-gradient(${spotlightSize}px circle at ${position.x}px ${position.y}px, ${spotlightColor}, transparent 80%)`,
				}}
			/>
			{/* Spotlight border glow layer */}
			<div
				className="pointer-events-none absolute inset-0 rounded-2xl transition-opacity duration-300 z-0"
				style={{
					opacity,
					border: `1px solid ${hoverBorderColor}`,
					maskImage: `radial-gradient(${spotlightSize * 0.8}px circle at ${position.x}px ${position.y}px, black, transparent 70%)`,
					WebkitMaskImage: `radial-gradient(${spotlightSize * 0.8}px circle at ${position.x}px ${position.y}px, black, transparent 70%)`,
				}}
			/>
			{children}
		</div>
	);
}
