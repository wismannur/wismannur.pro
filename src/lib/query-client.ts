import { API_CONFIG, APP_CONFIG } from "@/constants/app";
import { QueryClient } from "@tanstack/react-query";

// The only client is the one `Providers` mounts. Never export a module-level
// instance from here: components importing it would invalidate a cache nothing
// is subscribed to, so CMS lists would silently keep serving stale data.
// Inside components, reach for the mounted client with `useQueryClient()`.
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
