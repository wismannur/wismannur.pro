"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { notificationService, type NotificationEntityType } from "@/services";

export const NOTIFICATION_QUERY_KEY = ["email-notifications-unread"];

export function useEmailNotifications() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: NOTIFICATION_QUERY_KEY,
    queryFn: () => notificationService.getSummary(),
    refetchInterval: 30_000, // 30s Smart Polling
    refetchIntervalInBackground: false, // Pauses when tab is inactive / backgrounded
    refetchOnWindowFocus: true, // Instantly syncs when user switches back to tab
    staleTime: 10_000,
  });

  const markAllMutation = useMutation({
    mutationFn: (entityType?: NotificationEntityType) =>
      notificationService.markAllAsRead(entityType),
    onSuccess: (_, entityType) => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      queryClient.invalidateQueries({ queryKey: ["direct-emails"] });
      queryClient.invalidateQueries({ queryKey: ["serviceRequests"] });
      queryClient.invalidateQueries({ queryKey: ["hireRequests"] });
      queryClient.invalidateQueries({ queryKey: ["jobOutreaches"] });
      toast.success(
        entityType
          ? `Marked ${entityType.replace("_", " ")} as read`
          : "All notifications marked as read"
      );
    },
    onError: () => {
      toast.error("Failed to mark notifications as read");
    },
  });

  const counts = query.data?.counts ?? {
    contacts: 0,
    directEmails: 0,
    serviceRequests: 0,
    hireRequests: 0,
    jobOutreaches: 0,
    total: 0,
  };

  const recentItems = query.data?.recentItems ?? [];

  return {
    counts,
    recentItems,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    refetch: query.refetch,
    markAllAsRead: (entityType?: NotificationEntityType) => markAllMutation.mutate(entityType),
    isMarkingRead: markAllMutation.isPending,
  };
}
