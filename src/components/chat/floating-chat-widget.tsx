"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
	Sparkles,
	X,
	Send,
	RotateCcw,
	Bot,
	User,
	CheckCircle2,
	Loader2,
	ArrowUpRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { ChatMessage } from "@/services/ai-chat/types";

const SUGGESTED_PROMPTS = [
	"Tell me about Wisman's Mobile & Flutter experience",
	"What is Wisman's primary tech stack & skill set?",
	"Is Wisman open for freelance or full-time roles?",
	"I would like to hire Wisman / discuss an opportunity",
];

const INITIAL_MESSAGE: ChatMessage = {
	id: "initial-greeting",
	role: "assistant",
	content:
		"Hi! I am **Wisman's AI Assistant** 🤖. I am here 24/7 to answer questions about Wisman Nur's professional background, portfolio projects, technical skills, services, and availability.\n\nHow can I help you today?",
	status: "done",
};

const STORAGE_KEY = "wismannur_ai_chat_history_v1";
const SESSION_STORAGE_KEY = "wismannur_ai_chat_session_id_v1";

let msgSequence = 0;
function createClientMessageId(): string {
	if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
		return crypto.randomUUID();
	}
	msgSequence += 1;
	return `msg_${Date.now()}_${msgSequence}`;
}

function getOrCreateClientSessionId(): string {
	if (typeof window === "undefined") return "session_init";
	try {
		let sid = localStorage.getItem(SESSION_STORAGE_KEY);
		if (!sid) {
			sid = typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
				? crypto.randomUUID()
				: `session_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
			localStorage.setItem(SESSION_STORAGE_KEY, sid);
		}
		return sid;
	} catch {
		return "session_fallback";
	}
}

export function FloatingChatWidget() {
	const [isOpen, setIsOpen] = useState(false);
	const [messages, setMessages] = useState<ChatMessage[]>(() => {
		if (typeof window === "undefined") {
			return [INITIAL_MESSAGE];
		}
		try {
			const saved = localStorage.getItem(STORAGE_KEY);
			if (saved) {
				const parsed = JSON.parse(saved);
				if (Array.isArray(parsed) && parsed.length > 0) {
					return parsed;
				}
			}
		} catch (e) {
			console.error("Failed to parse chat history:", e);
		}
		return [INITIAL_MESSAGE];
	});
	const [input, setInput] = useState("");
	const [isLoading, setIsLoading] = useState(false);

	const scrollViewportRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);

	// Save chat history to localStorage
	useEffect(() => {
		try {
			if (messages.length > 0) {
				localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
			}
		} catch (e) {
			console.error("Failed to persist chat history:", e);
		}
	}, [messages]);

	// Auto scroll to bottom of chat
	const scrollToBottom = useCallback(() => {
		if (scrollViewportRef.current) {
			scrollViewportRef.current.scrollTop =
				scrollViewportRef.current.scrollHeight;
		}
	}, []);

	useEffect(() => {
		scrollToBottom();
	}, [messages, isLoading, scrollToBottom]);

	// Focus input when chat opens
	useEffect(() => {
		if (isOpen) {
			const timer = setTimeout(() => {
				inputRef.current?.focus();
				scrollToBottom();
			}, 150);
			return () => clearTimeout(timer);
		}
	}, [isOpen, scrollToBottom]);

	const handleReset = () => {
		const fresh = [INITIAL_MESSAGE];
		setMessages(fresh);
		try {
			localStorage.removeItem(STORAGE_KEY);
			localStorage.removeItem(SESSION_STORAGE_KEY);
		} catch {}
	};

	const handleSendMessage = async (userText: string) => {
		const text = userText.trim();
		if (!text || isLoading) return;

		const userMsg: ChatMessage = {
			id: createClientMessageId(),
			role: "user",
			content: text,
			status: "done",
		};

		const assistantMsgId = createClientMessageId();
		const placeholderAssistantMsg: ChatMessage = {
			id: assistantMsgId,
			role: "assistant",
			content: "",
			status: "streaming",
		};

		const updatedMessages = [...messages, userMsg];
		setMessages([...updatedMessages, placeholderAssistantMsg]);
		setInput("");
		setIsLoading(true);

		try {
			const payloadMessages = updatedMessages
				.filter((m) => m.id !== "initial-greeting")
				.map((m) => ({
					role: m.role as "user" | "assistant",
					content: m.content,
				}));

			const clientSessionId = getOrCreateClientSessionId();

			const res = await fetch("/api/chat", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					messages: payloadMessages,
					clientSessionId,
				}),
			});

			if (!res.ok) {
				const errData = await res.json().catch(() => ({}));
				throw new Error(errData.error || `Server responded with ${res.status}`);
			}

			if (!res.body) {
				throw new Error("No response body received.");
			}

			const reader = res.body.getReader();
			const decoder = new TextDecoder("utf-8");
			let buffer = "";

			const state = {
				accumulatedContent: "",
				toolCallData: undefined as Record<string, unknown> | undefined,
				toolResultData: undefined as Record<string, unknown> | undefined,
			};

			while (true) {
				const { done, value } = await reader.read();
				if (done) break;

				buffer += decoder.decode(value, { stream: true });
				const lines = buffer.split("\n\n");
				buffer = lines.pop() || "";

				for (const line of lines) {
					const trimmed = line.trim();
					if (trimmed.startsWith("data: ")) {
						try {
							const data = JSON.parse(trimmed.slice(6));

							if (data.type === "text") {
								state.accumulatedContent += data.content;
								const textSnapshot = state.accumulatedContent;
								const toolArgs = state.toolCallData;
								const toolRes = state.toolResultData;

								setMessages((prev) =>
									prev.map((msg) =>
										msg.id === assistantMsgId
											? {
													...msg,
													content: textSnapshot,
													toolCallArgs: toolArgs,
													toolCallResult: toolRes,
												}
											: msg,
									),
								);
							} else if (data.type === "tool_call") {
								state.toolCallData = data.args;
								const toolName = data.toolName;
								const argsSnapshot = data.args;

								setMessages((prev) =>
									prev.map((msg) =>
										msg.id === assistantMsgId
											? {
													...msg,
													toolCallName: toolName,
													toolCallArgs: argsSnapshot,
												}
											: msg,
									),
								);
							} else if (data.type === "tool_result") {
								state.toolResultData = data.result;
								const resultSnapshot = data.result;

								setMessages((prev) =>
									prev.map((msg) =>
										msg.id === assistantMsgId
											? {
													...msg,
													toolCallResult: resultSnapshot,
												}
											: msg,
									),
								);
							} else if (data.type === "error") {
								state.accumulatedContent += `\n\n⚠️ ${data.content}`;
								const errorSnapshot = state.accumulatedContent;

								setMessages((prev) =>
									prev.map((msg) =>
										msg.id === assistantMsgId
											? {
													...msg,
													content: errorSnapshot,
													status: "error",
												}
											: msg,
									),
								);
							}
						} catch (jsonErr) {
							console.warn("Failed to parse SSE line:", trimmed, jsonErr);
						}
					}
				}
			}

			const finalContent = state.accumulatedContent;
			setMessages((prev) =>
				prev.map((msg) =>
					msg.id === assistantMsgId
						? {
								...msg,
								status: "done",
								content: finalContent || "How else can I assist you today?",
							}
						: msg,
				),
			);
		} catch (error) {
			console.error("Chat error:", error);
			const errText =
				error instanceof Error
					? error.message
					: "Sorry, an error occurred while connecting to the server.";
			setMessages((prev) =>
				prev.map((msg) =>
					msg.id === assistantMsgId
						? {
								...msg,
								content: `⚠️ ${errText}`,
								status: "error",
							}
						: msg,
				),
			);
		} finally {
			setIsLoading(false);
		}
	};

	// Helper to format basic markdown (bold, links, bullet points)
	const renderFormattedContent = (content: string) => {
		const lines = content.split("\n");

		return (
			<div className="space-y-1.5 leading-relaxed text-sm">
				{lines.map((line, idx) => {
					if (!line.trim()) {
						return <div key={idx} className="h-1.5" />;
					}

					const isBullet = line.trim().startsWith("- ") || line.trim().startsWith("* ");
					const cleanLine = isBullet ? line.trim().slice(2) : line;

					const parts = cleanLine.split(/(\*\*.*?\*\*|\[.*?\]\(.*?\))/g);

					const formatted = parts.map((part, pIdx) => {
						if (part.startsWith("**") && part.endsWith("**")) {
							return (
								<strong key={pIdx} className="font-semibold text-foreground">
									{part.slice(2, -2)}
								</strong>
							);
						}
						const linkMatch = part.match(/^\[(.*?)\]\((.*?)\)$/);
						if (linkMatch) {
							const [, text, url] = linkMatch;
							return (
								<a
									key={pIdx}
									href={url}
									target={url.startsWith("http") ? "_blank" : undefined}
									rel="noreferrer"
									className="text-primary underline font-medium hover:opacity-80 inline-flex items-center gap-0.5"
								>
									{text}
									{url.startsWith("http") && <ArrowUpRight className="w-3 h-3" />}
								</a>
							);
						}
						return part;
					});

					if (isBullet) {
						return (
							<div key={idx} className="flex items-start gap-2 pl-1">
								<span className="text-primary font-bold mt-1 text-xs">•</span>
								<span className="flex-1">{formatted}</span>
							</div>
						);
					}

					return <p key={idx}>{formatted}</p>;
				})}
			</div>
		);
	};

	return (
		<TooltipProvider>
			{/* Floating Trigger Button */}
			<div className="fixed bottom-6 right-6 z-50 flex items-center gap-2">
				{!isOpen && (
					<div className="relative group">
						<Button
							onClick={() => setIsOpen(true)}
							className={cn(
								"h-14 px-4 sm:px-5 rounded-full shadow-2xl flex items-center gap-2.5",
								"bg-gradient-to-r from-primary via-primary/90 to-primary/80 hover:scale-105 active:scale-95 transition-all duration-300 text-primary-foreground border border-primary/20",
							)}
							aria-label="Chat with Wisman's AI Assistant"
						>
							<div className="relative">
								<Bot className="w-5 h-5 animate-pulse" />
								<span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full ring-2 ring-background animate-ping" />
								<span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full ring-2 ring-background" />
							</div>
							<div className="flex flex-col items-start text-left">
								<span className="text-xs font-bold leading-tight flex items-center gap-1">
									Chat with Wisman&apos;s AI <Sparkles className="w-3 h-3 text-amber-300 fill-amber-300" />
								</span>
								<span className="text-[10px] opacity-85 font-medium leading-none">Online 24/7</span>
							</div>
						</Button>
					</div>
				)}
			</div>

			{/* Floating Chat Window */}
			{isOpen && (
				<div
					className={cn(
						"fixed z-50 transition-all duration-300 ease-out flex flex-col shadow-2xl border border-border/70 bg-background/95 backdrop-blur-md overflow-hidden",
						"inset-x-3 bottom-3 top-16 sm:inset-auto sm:bottom-6 sm:right-6 sm:w-[420px] sm:h-[600px] sm:rounded-2xl rounded-2xl",
					)}
				>
					{/* Header */}
					<div className="flex items-center justify-between px-4 py-3 border-b bg-muted/40 backdrop-blur-sm">
						<div className="flex items-center gap-2.5">
							<div className="relative p-2 rounded-xl bg-primary/10 border border-primary/20 text-primary">
								<Bot className="w-5 h-5" />
								<span className="absolute bottom-0.5 right-0.5 w-2 h-2 bg-emerald-500 rounded-full ring-1 ring-background" />
							</div>
							<div>
								<div className="flex items-center gap-1.5">
									<h3 className="font-semibold text-sm leading-tight text-foreground">
										Wisman&apos;s AI Assistant
									</h3>
									<Badge
										variant="secondary"
										className="text-[9px] px-1.5 py-0 h-4 font-semibold text-primary bg-primary/10"
									>
										AI
									</Badge>
								</div>
								<p className="text-[11px] text-muted-foreground leading-none mt-0.5 flex items-center gap-1">
									<span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
									Active 24/7 • Represents Wisman Nur
								</p>
							</div>
						</div>

						<div className="flex items-center gap-1">
							<Tooltip>
								<TooltipTrigger asChild>
									<Button
										variant="ghost"
										size="icon"
										className="h-8 w-8 text-muted-foreground hover:text-foreground"
										onClick={handleReset}
										aria-label="Reset conversation"
									>
										<RotateCcw className="w-4 h-4" />
									</Button>
								</TooltipTrigger>
								<TooltipContent>Reset Conversation</TooltipContent>
							</Tooltip>

							<Button
								variant="ghost"
								size="icon"
								className="h-8 w-8 text-muted-foreground hover:text-foreground"
								onClick={() => setIsOpen(false)}
								aria-label="Close chat"
							>
								<X className="w-4 h-4" />
							</Button>
						</div>
					</div>

					{/* Message Feed */}
					<div
						ref={scrollViewportRef}
						className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth"
					>
						{messages.map((msg, idx) => {
							const isUser = msg.role === "user";
							return (
								<div
									key={msg.id || idx}
									className={cn(
										"flex gap-2.5 max-w-[88%]",
										isUser ? "ml-auto flex-row-reverse" : "mr-auto",
									)}
								>
									{/* Avatar */}
									<div
										className={cn(
											"w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs shadow-sm mt-0.5",
											isUser
												? "bg-primary text-primary-foreground font-semibold"
												: "bg-muted border border-border text-foreground",
										)}
									>
										{isUser ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5 text-primary" />}
									</div>

									{/* Content Bubble */}
									<div className="flex flex-col space-y-1.5">
										<div
											className={cn(
												"p-3.5 rounded-2xl shadow-sm text-sm",
												isUser
													? "bg-primary text-primary-foreground rounded-tr-xs"
													: "bg-muted/70 dark:bg-muted/40 border border-border/60 text-foreground rounded-tl-xs",
											)}
										>
											{msg.content ? (
												renderFormattedContent(msg.content)
											) : msg.status === "streaming" ? (
												<div className="flex items-center gap-1.5 py-1 text-muted-foreground">
													<Loader2 className="w-4 h-4 animate-spin text-primary" />
													<span className="text-xs">Typing response...</span>
												</div>
											) : null}
										</div>

										{/* Tool execution badge feedback */}
										{msg.toolCallName && (
											<div className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
												<CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
												<span>
													{msg.toolCallName === "submit_hire_inquiry"
														? "Hiring inquiry submitted to Wisman's dashboard."
														: "Message submitted to Wisman's inbox."}
												</span>
											</div>
										)}
									</div>
								</div>
							);
						})}

						{/* Quick Suggested Prompts (shown when only initial greeting is present) */}
						{messages.length === 1 && !isLoading && (
							<div className="pt-2 space-y-2">
								<p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
									<Sparkles className="w-3 h-3 text-primary" /> Suggested Questions:
								</p>
								<div className="grid grid-cols-1 gap-1.5">
									{SUGGESTED_PROMPTS.map((prompt, pIdx) => (
										<button
											key={pIdx}
											type="button"
											onClick={() => handleSendMessage(prompt)}
											className="text-left text-xs p-2.5 rounded-xl border border-border/70 hover:border-primary/50 bg-background/50 hover:bg-primary/5 transition-all text-muted-foreground hover:text-foreground flex items-center justify-between group"
										>
											<span>{prompt}</span>
											<ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 text-primary transition-opacity" />
										</button>
									))}
								</div>
							</div>
						)}
					</div>

					{/* Input Footer */}
					<div className="p-3 border-t bg-muted/20">
						<form
							onSubmit={(e) => {
								e.preventDefault();
								handleSendMessage(input);
							}}
							className="flex items-center gap-2"
						>
							<input
								ref={inputRef}
								type="text"
								value={input}
								onChange={(e) => setInput(e.target.value)}
								placeholder="Ask anything about Wisman..."
								disabled={isLoading}
								className="flex-1 bg-background border border-input rounded-xl px-3.5 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-50"
							/>
							<Button
								type="submit"
								size="icon"
								disabled={!input.trim() || isLoading}
								className="h-10 w-10 rounded-xl shrink-0 shadow-sm"
								aria-label="Send message"
							>
								{isLoading ? (
									<Loader2 className="w-4 h-4 animate-spin" />
								) : (
									<Send className="w-4 h-4" />
								)}
							</Button>
						</form>
						<p className="text-[10px] text-center text-muted-foreground mt-2 leading-none">
							Powered by Google Gemini • Instant responses 24/7
						</p>
					</div>
				</div>
			)}
		</TooltipProvider>
	);
}
