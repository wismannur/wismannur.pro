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
  Cpu,
  FileQuestion,
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
import { cn } from "@/lib/utils";
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
  hiring: <Briefcase className="w-3.5 h-3.5 text-blue-400" />,
  technical: <Cpu className="w-3.5 h-3.5 text-indigo-400" />,
  philosophy: <Brain className="w-3.5 h-3.5 text-purple-400" />,
  screening: <FileQuestion className="w-3.5 h-3.5 text-amber-400" />,
  projects: <Layers className="w-3.5 h-3.5 text-emerald-400" />,
  general: <BookOpen className="w-3.5 h-3.5 text-gray-400" />,
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
  });

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
      header: "Category",
      cell: (item) => {
        const cat = item.category;
        const icon = CATEGORY_ICONS[cat] || <BookOpen className="w-3.5 h-3.5" />;
        const catObj = AI_KNOWLEDGE_CATEGORIES.find((c) => c.value === cat);
        return (
          <Badge
            variant="secondary"
            className="flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-medium capitalize bg-muted/60 border border-border/50"
          >
            {icon}
            <span>{catObj?.label || cat}</span>
          </Badge>
        );
      },
    },
    {
      accessorKey: "tags",
      header: "Tags",
      cell: (item) => {
        const tags = item.tags || [];
        if (tags.length === 0) {
          return <span className="text-xs text-muted-foreground">-</span>;
        }
        return (
          <div className="flex flex-wrap gap-1 max-w-[160px]">
            {tags.slice(0, 3).map((tag, idx) => (
              <span
                key={idx}
                className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground border border-border/40 font-mono"
              >
                #{tag}
              </span>
            ))}
            {tags.length > 3 && (
              <span className="text-[10px] text-muted-foreground">
                +{tags.length - 3}
              </span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "isPublished",
      header: "AI Active",
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
      cell: (item) => (
        <span className="text-xs font-mono text-muted-foreground">
          {item.sortOrder}
        </span>
      ),
    },
    {
      header: "Actions",
      cell: (item) => {
        return (
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
            <h1 className="text-2xl font-bold tracking-tight">AI Knowledge Hub</h1>
            <Badge variant="secondary" className="bg-primary/10 text-primary font-semibold text-xs">
              Wisman&apos;s Second Brain
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage deep knowledge, screening answers, philosophies, and background context for Wisman&apos;s AI Assistant
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
            <span className="text-xs font-medium text-muted-foreground">Total Knowledge Items</span>
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

      {/* Data Table */}
      <div className="rounded-xl border border-border/70 bg-card/40 overflow-hidden shadow-xs">
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
