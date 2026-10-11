"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  Brain,
  Plus,
  Search,
  RefreshCw,
  MoreHorizontal,
  Pencil,
  Trash2,
  CheckCircle2,
  Filter,
  Sparkles,
  Layers,
  BookOpen,
  Briefcase,
  Compass,
  Cpu,
  FileQuestion,
  Flame,
  PenTool,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataTable, type ColumnDef } from "@/components/ui/data-table";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";
import { useRegisterCmsPageContext } from "@/lib/cms-page-context";
import {
  getAiKnowledgeItems,
  deleteAiKnowledgeItem,
  toggleAiKnowledgeItemPublished,
} from "@/services/ai-knowledge/actions";
import {
  AI_KNOWLEDGE_CATEGORIES,
  type AiKnowledgeItem,
} from "@/services/ai-knowledge/types";

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  "career-impact": <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />,
  "tech-opinions": <Compass className="w-3.5 h-3.5 text-cyan-400" />,
  "case-studies": <Flame className="w-3.5 h-3.5 text-amber-400" />,
  "writing-voice": <PenTool className="w-3.5 h-3.5 text-pink-400" />,
  technical: <Cpu className="w-3.5 h-3.5 text-indigo-400" />,
  philosophy: <Brain className="w-3.5 h-3.5 text-purple-400" />,
  screening: <FileQuestion className="w-3.5 h-3.5 text-amber-400" />,
  projects: <Layers className="w-3.5 h-3.5 text-teal-400" />,
  hiring: <Briefcase className="w-3.5 h-3.5 text-blue-400" />,
  general: <BookOpen className="w-3.5 h-3.5 text-gray-400" />,
};

const CATEGORY_STYLES: Record<string, string> = {
  "career-impact": "bg-emerald-500/10 text-emerald-300 border-emerald-500/25",
  "tech-opinions": "bg-cyan-500/10 text-cyan-300 border-cyan-500/25",
  "case-studies": "bg-amber-500/10 text-amber-300 border-amber-500/25",
  "writing-voice": "bg-pink-500/10 text-pink-300 border-pink-500/25",
  technical: "bg-indigo-500/10 text-indigo-300 border-indigo-500/25",
  philosophy: "bg-purple-500/10 text-purple-300 border-purple-500/25",
  screening: "bg-amber-500/10 text-amber-300 border-amber-500/25",
  projects: "bg-teal-500/10 text-teal-300 border-teal-500/25",
  hiring: "bg-blue-500/10 text-blue-300 border-blue-500/25",
  general: "bg-muted/60 text-muted-foreground border-border/50",
};

export default function CmsAiKnowledgePage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [itemToDelete, setItemToDelete] = useState<AiKnowledgeItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const {
    data: items = [],
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ["cms-ai-knowledge-items", categoryFilter, searchQuery],
    queryFn: () => getAiKnowledgeItems(categoryFilter, searchQuery || undefined),
    refetchOnMount: "always",
    staleTime: 0,
  });

  // Expose live rendered knowledge items to CMS Copilot
  useRegisterCmsPageContext(
    useMemo(() => {
      if (items.length === 0) return null;
      return {
        pageTitle: "AI Assistant - Knowledge Base",
        summary: `Currently viewing ${items.length} knowledge items. Filters: category=${categoryFilter}, search="${searchQuery}"`,
        filters: { category: categoryFilter, query: searchQuery },
        activeItems: items.slice(0, 20).map((i) => ({
          id: i.id,
          title: i.title,
          category: i.category,
          content: i.content.slice(0, 150),
          isPublished: i.isPublished,
          tags: i.tags,
        })),
      };
    }, [items, categoryFilter, searchQuery])
  );

  const handleTogglePublished = async (item: AiKnowledgeItem, nextPublished: boolean) => {
    try {
      await toggleAiKnowledgeItemPublished(item.id, nextPublished);
      toast.success(
        nextPublished
          ? `"${item.title}" is now active in AI Knowledge Base.`
          : `"${item.title}" is now deactivated.`
      );
      refetch();
    } catch (error) {
      console.error("Failed to toggle publish:", error);
      toast.error("Failed to update published status.");
    }
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    try {
      await deleteAiKnowledgeItem(itemToDelete.id);
      toast.success("Knowledge item deleted successfully.");
      setItemToDelete(null);
      refetch();
    } catch (error) {
      console.error("Failed to delete knowledge item:", error);
      toast.error("Failed to delete knowledge item.");
    } finally {
      setIsDeleting(false);
    }
  };

  const publishedCount = useMemo(
    () => items.filter((i) => i.isPublished).length,
    [items]
  );

  const columns: ColumnDef<AiKnowledgeItem>[] = [
    {
      accessorKey: "title",
      header: "Title & Deep Insight",
      className: "min-w-[280px] max-w-[400px]",
      cell: (item) => {
        return (
          <div className="space-y-1 max-w-[380px]">
            <Link
              href={`/cms/ai-knowledge/form/${item.id}`}
              className="font-semibold text-sm hover:text-primary transition-colors line-clamp-1"
            >
              {item.title}
            </Link>
            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
              {item.content}
            </p>
          </div>
        );
      },
    },
    {
      accessorKey: "category",
      header: "Category & Tags",
      className: "min-w-[300px] lg:min-w-[340px]",
      cell: (item) => {
        const cat = item.category;
        const icon = CATEGORY_ICONS[cat] || <BookOpen className="w-3.5 h-3.5" />;
        const catObj = AI_KNOWLEDGE_CATEGORIES.find((c) => c.value === cat);
        const style = CATEGORY_STYLES[cat] || "bg-muted/60 text-muted-foreground border-border/50";
        const tags = item.tags || [];
        return (
          <div className="space-y-1.5 min-w-[270px]">
            <div>
              <Badge
                variant="secondary"
                className={cn(
                  "inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-medium capitalize border whitespace-nowrap",
                  style
                )}
              >
                <span className="shrink-0">{icon}</span>
                <span className="whitespace-nowrap">{catObj?.label || cat}</span>
              </Badge>
            </div>
            {tags.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {tags.slice(0, 3).map((tag, idx) => (
                  <span
                    key={idx}
                    className="text-[10px] px-1.5 py-0.5 rounded bg-muted/80 text-muted-foreground border border-border/40 font-mono"
                  >
                    #{tag}
                  </span>
                ))}
                {tags.length > 3 && (
                  <span className="text-[10px] text-muted-foreground font-mono self-center">
                    +{tags.length - 3}
                  </span>
                )}
              </div>
            ) : (
              <span className="text-[11px] text-muted-foreground/50 italic">No tags</span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "isPublished",
      header: "AI Active",
      className: "w-[120px] min-w-[110px]",
      cell: (item) => {
        return (
          <div className="flex items-center gap-2">
            <Switch
              checked={item.isPublished}
              onCheckedChange={(checked) => handleTogglePublished(item, checked)}
              aria-label="Toggle active status"
            />
            <span
              className={cn(
                "text-xs font-medium",
                item.isPublished ? "text-emerald-500" : "text-muted-foreground"
              )}
            >
              {item.isPublished ? "Active" : "Draft"}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "sortOrder",
      header: "Order",
      className: "w-[80px] min-w-[70px]",
      cell: (item) => (
        <span className="text-xs font-mono text-muted-foreground">
          {item.sortOrder}
        </span>
      ),
    },
    {
      header: "Actions",
      className: "w-[80px] min-w-[70px] text-right",
      cell: (item) => {
        return (
          <div className="flex justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => router.push(`/cms/ai-knowledge/form/${item.id}`)}
                  className="cursor-pointer gap-2"
                >
                  <Pencil className="h-4 w-4" /> Edit
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setItemToDelete(item)}
                  className="cursor-pointer text-destructive focus:text-destructive gap-2"
                >
                  <Trash2 className="h-4 w-4" /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">My Second Brain</h1>
            <Badge variant="secondary" className="bg-primary/10 text-primary font-semibold text-xs">
              Wisman&apos;s Digital Twin
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            Central knowledge repository, engineering philosophies, career impact, and authentic persona for all AI generators
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isRefetching}
            className="rounded-lg gap-1.5 text-xs h-9"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", isRefetching && "animate-spin")} />
            Refresh
          </Button>

          <Button asChild size="sm" className="rounded-lg gap-1.5 text-xs h-9 shadow-sm">
            <Link href="/cms/ai-knowledge/form">
              <Plus className="h-3.5 w-3.5" />
              New Knowledge Item
            </Link>
          </Button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl border border-border/60 bg-card/50 p-3.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Total Brain Documents</span>
            <Brain className="h-4 w-4 text-primary/70" />
          </div>
          <div className="text-2xl font-bold mt-1.5 tracking-tight">{items.length}</div>
        </div>

        <div className="rounded-xl border border-border/60 bg-card/50 p-3.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Active in AI Prompt</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold mt-1.5 tracking-tight text-emerald-500">
            {publishedCount}
          </div>
        </div>

        <div className="rounded-xl border border-border/60 bg-card/50 p-3.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Categories Active</span>
            <Layers className="h-4 w-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold mt-1.5 tracking-tight text-foreground">
            {new Set(items.map((i) => i.category)).size}
          </div>
        </div>

        <div className="rounded-xl border border-border/60 bg-card/50 p-3.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">AI Synchronization</span>
            <Sparkles className="h-4 w-4 text-amber-400" />
          </div>
          <div className="text-sm font-semibold mt-2.5 text-emerald-500 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Live Synced
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 sm:max-w-[340px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by title, category, or content..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 text-xs rounded-lg"
          />
        </div>

        <div className="flex items-center gap-2">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[180px] text-xs rounded-lg">
              <Filter className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {AI_KNOWLEDGE_CATEGORIES.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Mobile / Tablet Cards View (Screen <= 768px) */}
      <div className="block min-[769px]:hidden space-y-3">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={`card-skeleton-${index}`}
                className="rounded-2xl border border-border/60 bg-card/40 p-4 space-y-3 animate-pulse"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-6 w-28 rounded-full" />
                    <Skeleton className="h-5 w-12 rounded-md" />
                  </div>
                  <Skeleton className="h-6 w-16 rounded-full" />
                </div>
                <Skeleton className="h-5 w-3/4 rounded-md" />
                <Skeleton className="h-12 w-full rounded-md" />
                <div className="pt-2 border-t border-border/40 flex items-center justify-between">
                  <Skeleton className="h-4 w-32 rounded-md" />
                  <Skeleton className="h-7 w-16 rounded-md" />
                </div>
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            title="No AI knowledge items found"
            description="Click 'New Knowledge Item' to add your first deep insight or screening answer."
            action={{
              label: "New Knowledge Item",
              href: "/cms/ai-knowledge/form",
              icon: Plus,
            }}
          />
        ) : (
          <div className="grid grid-cols-1 gap-3.5">
            {items.map((item) => {
              const cat = item.category;
              const icon = CATEGORY_ICONS[cat] || <BookOpen className="w-3.5 h-3.5" />;
              const catObj = AI_KNOWLEDGE_CATEGORIES.find((c) => c.value === cat);
              const style = CATEGORY_STYLES[cat] || "bg-muted/60 text-muted-foreground border-border/50";
              const tags = item.tags || [];

              return (
                <div
                  key={item.id}
                  className="group relative rounded-2xl border border-border/70 bg-card/60 backdrop-blur-xs hover:border-primary/40 hover:bg-card/90 transition-all duration-200 p-4 space-y-3 shadow-xs"
                >
                  {/* Header: Category Badge + Order pill & Status Switch + Action Menu */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                      <Badge
                        variant="secondary"
                        className={cn("inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-medium capitalize border", style)}
                      >
                        {icon}
                        <span className="truncate max-w-[150px]">{catObj?.label || cat}</span>
                      </Badge>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-muted/70 text-muted-foreground border border-border/40">
                        #{item.sortOrder}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <div className="flex items-center gap-1.5">
                        <Switch
                          checked={item.isPublished}
                          onCheckedChange={(checked) => handleTogglePublished(item, checked)}
                          aria-label={`Toggle active status for ${item.title}`}
                          className="scale-90"
                        />
                        <span
                          className={cn(
                            "text-xs font-medium",
                            item.isPublished ? "text-emerald-500" : "text-muted-foreground"
                          )}
                        >
                          {item.isPublished ? "Active" : "Draft"}
                        </span>
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 -mr-1">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Open menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => router.push(`/cms/ai-knowledge/form/${item.id}`)}
                            className="cursor-pointer gap-2"
                          >
                            <Pencil className="h-4 w-4" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => setItemToDelete(item)}
                            className="cursor-pointer text-destructive focus:text-destructive gap-2"
                          >
                            <Trash2 className="h-4 w-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  {/* Body: Title & Content Preview */}
                  <div className="space-y-1">
                    <Link
                      href={`/cms/ai-knowledge/form/${item.id}`}
                      className="font-semibold text-sm sm:text-base hover:text-primary transition-colors line-clamp-2 block leading-snug"
                    >
                      {item.title}
                    </Link>
                    <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
                      {item.content}
                    </p>
                  </div>

                  {/* Footer: Tags & Quick Edit Link */}
                  <div className="pt-2 border-t border-border/40 flex items-center justify-between gap-2">
                    <div className="flex flex-wrap gap-1 items-center flex-1 min-w-0">
                      {tags.length > 0 ? (
                        <>
                          {tags.slice(0, 3).map((tag, idx) => (
                            <span
                              key={idx}
                              className="text-[10px] px-1.5 py-0.5 rounded bg-muted/80 text-muted-foreground border border-border/40 font-mono"
                            >
                              #{tag}
                            </span>
                          ))}
                          {tags.length > 3 && (
                            <span className="text-[10px] text-muted-foreground font-mono self-center">
                              +{tags.length - 3}
                            </span>
                          )}
                        </>
                      ) : (
                        <span className="text-[11px] text-muted-foreground/50 italic">No tags</span>
                      )}
                    </div>

                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="h-7 px-2.5 text-xs gap-1 rounded-lg border-border/60 hover:bg-muted/80 shrink-0"
                    >
                      <Link href={`/cms/ai-knowledge/form/${item.id}`}>
                        <Pencil className="h-3 w-3" />
                        <span>Edit</span>
                      </Link>
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Desktop Data Table (Screen > 768px) */}
      <div className="hidden min-[769px]:block rounded-xl border border-border/70 bg-card/40 overflow-hidden shadow-xs">
        <DataTable
          columns={columns}
          data={items}
          isLoading={isLoading}
          keyField="id"
          emptyState={{
            title: "No AI knowledge items found",
            description: "Click 'New Knowledge Item' to add your first deep insight or screening answer.",
          }}
        />
      </div>

      {/* Delete Confirmation Alert */}
      <AlertDialog
        open={Boolean(itemToDelete)}
        onOpenChange={(open) => !open && setItemToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Knowledge Item?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;<strong>{itemToDelete?.title}</strong>&quot;?
              This item will immediately be removed from Wisman&apos;s AI Assistant prompt context.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete Item"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
