"use client";

import type React from "react";

import { useQuery } from "@tanstack/react-query";
import {
  Briefcase,
  Check,
  Eye,
  Filter,
  ListOrdered,
  MoreHorizontal,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Workflow,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable, type ColumnDef } from "@/components/ui/data-table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getContentIcon } from "@/lib/icon-registry";
import { processStepsService, type ProcessScope, type ProcessStep } from "@/services";

// Number of entries to display per page (in-memory pagination)
const ENTRIES_PER_PAGE = 10;

export default function CmsProcessStepsPage() {
  const router = useRouter();
  const [activeScope, setActiveScope] = useState<ProcessScope>("services");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [stepToDelete, setStepToDelete] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["cmsProcessSteps"],
    queryFn: () => processStepsService.getAllForCms(),
  });

  // Reset to first page when the tab, search query or filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeScope, searchQuery, filterStatus]);

  // Apply scope tab + status filter + search filtering in memory
  const matchedSteps = useMemo(() => {
    let list = (data ?? []).filter((step) => step.scope === activeScope);

    if (filterStatus && filterStatus !== "all") {
      const isPublished = filterStatus === "published";
      list = list.filter((step) => Boolean(step.isPublished) === isPublished);
    }

    if (searchQuery) {
      const term = searchQuery.toLowerCase();
      list = list.filter(
        (step) =>
          step.title.toLowerCase().includes(term) || step.description.toLowerCase().includes(term)
      );
    }

    return list;
  }, [data, activeScope, filterStatus, searchQuery]);

  // In-memory pagination (no cursor)
  const pageStart = (currentPage - 1) * ENTRIES_PER_PAGE;
  const filteredSteps = matchedSteps.slice(pageStart, pageStart + ENTRIES_PER_PAGE);
  const hasMore = pageStart + ENTRIES_PER_PAGE < matchedSteps.length;

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleFilterChange = (value: string) => {
    setFilterStatus(value);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Search is applied in memory
  };

  const handlePublishToggle = async (stepId: string, currentStatus: boolean) => {
    try {
      await processStepsService.update(stepId, { isPublished: !currentStatus });

      refetch();
      toast.success(currentStatus ? "Step hidden from the public page" : "Step published");
    } catch (error) {
      console.error("Error toggling publish status:", error);
      toast.error("Failed to update step status");
    }
  };

  const handleDeleteStep = async (stepId: string) => {
    try {
      await processStepsService.delete(stepId);

      refetch();
      setStepToDelete(null);
      toast.success("Step deleted successfully");
    } catch (error) {
      console.error("Error deleting step:", error);
      toast.error("Failed to delete step");
    }
  };

  // Define columns for DataTable
  const columns: ColumnDef<ProcessStep>[] = [
    {
      header: "Step",
      cell: (step) => (
        <div className="flex flex-col">
          <div className="font-medium">{step.title}</div>
          <div className="text-sm text-muted-foreground line-clamp-1 max-w-[360px]">
            {step.description}
          </div>
        </div>
      ),
      className: "w-[380px]",
    },
    {
      header: "Icon",
      cell: (step) => {
        if (!step.icon) {
          return <span className="text-sm text-muted-foreground">—</span>;
        }
        const Icon = getContentIcon(step.icon);
        return (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Icon className="h-4 w-4 text-primary" />
            {step.icon}
          </div>
        );
      },
      className: "hidden md:table-cell",
    },
    {
      header: "Status",
      cell: (step) => (
        <div className="flex flex-col items-start gap-1">
          <Badge variant={step.isPublished ? "default" : "secondary"}>
            {step.isPublished ? "Published" : "Hidden"}
          </Badge>
          {step.sortOrder !== 0 && (
            <span className="text-xs text-muted-foreground">Order: {step.sortOrder}</span>
          )}
        </div>
      ),
      className: "hidden md:table-cell",
    },
    {
      header: "Actions",
      cell: (step) => (
        <div className="flex justify-end">
          <AlertDialog
            open={stepToDelete === step.id}
            onOpenChange={(open) => !open && setStepToDelete(null)}
          >
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => router.push(step.scope === "hire-me" ? "/hire-me" : "/services")}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  {step.scope === "hire-me" ? "View on Hire Me" : "View on Services"}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push(`/cms/process-steps/form/${step.id}`)}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => handlePublishToggle(step.id, step.isPublished)}
                  className={step.isPublished ? "text-destructive" : ""}
                >
                  {step.isPublished ? (
                    <>
                      <X className="h-4 w-4 mr-2" />
                      Hide
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Publish
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setStepToDelete(step.id)}
                  className="text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the "{step.title}" step
                  from /{step.scope === "hire-me" ? "hire-me" : "services"}.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  onClick={() => handleDeleteStep(step.id)}
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      ),
      className: "w-[50px]",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between gap-4 items-start md:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Process Steps</h1>
          <p className="text-muted-foreground">
            Manage the how-it-works steps on /services and /hire-me
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <Button asChild>
            <Link href={`/cms/process-steps/form?scope=${activeScope}`}>
              <Plus className="mr-2 h-4 w-4" />
              New Step
            </Link>
          </Button>
        </div>
      </div>

      <Tabs value={activeScope} onValueChange={(value) => setActiveScope(value as ProcessScope)}>
        <TabsList>
          <TabsTrigger value="services">
            <Workflow className="mr-2 h-4 w-4" />
            Services
          </TabsTrigger>
          <TabsTrigger value="hire-me">
            <Briefcase className="mr-2 h-4 w-4" />
            Hire Me
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="flex flex-col md:flex-row justify-between gap-4">
        <form onSubmit={handleSearch} className="relative w-full md:w-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search steps..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 w-full md:w-[250px] rounded-lg"
          />
        </form>

        <div className="flex gap-3">
          <Select value={filterStatus} onValueChange={handleFilterChange}>
            <SelectTrigger className="w-full sm:w-[180px] rounded-lg">
              <div className="flex items-center">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Filter by status" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Steps</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="draft">Hidden</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="icon"
            onClick={() => refetch()}
            disabled={isRefetching}
            className="rounded-lg"
          >
            <RefreshCw className={`h-4 w-4 ${isRefetching ? "animate-spin" : ""}`} />
            <span className="sr-only">Refresh</span>
          </Button>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filteredSteps}
        isLoading={isLoading}
        keyField="id"
        emptyState={{
          icon: <ListOrdered className="h-8 w-8 mb-2" />,
          title: `No ${activeScope === "hire-me" ? "hire-me" : "services"} steps found`,
          description: searchQuery
            ? "Try adjusting your search query"
            : filterStatus && filterStatus !== "all"
              ? `No ${filterStatus} steps found`
              : "Get started by adding your first process step",
        }}
        pagination={{
          currentPage,
          hasMore,
          onPageChange: handlePageChange,
        }}
        rowClassName={(step) => (!step.isPublished ? "bg-muted/30" : "")}
      />
    </div>
  );
}
