import { API_CONFIG, APP_CONFIG } from "@/constants/app";
import { QueryClient } from "@tanstack/react-query";

export function makeQueryClient() {
	return new QueryClient({
		defaultOptions: {
			queries: {
				staleTime: APP_CONFIG.STALE_TIME,
				retry: API_CONFIG.RETRY_ATTEMPTS,
				refetchOnWindowFocus: false,
				refetchOnReconnect: true,
			},
			mutations: {
				retry: API_CONFIG.RETRY_ATTEMPTS,
			},
		},
	});
}

export const queryClient = makeQueryClient();
