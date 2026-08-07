import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	// Avatar upload posts the cropped image through a server action; the
	// default 1mb body cap is too tight for the 5MB legacy allowance.
	experimental: {
		serverActions: { bodySizeLimit: "5mb" },
	},
	images: {
		remotePatterns: [
			{ protocol: "https", hostname: "*.public.blob.vercel-storage.com" },
			{ protocol: "https", hostname: "images.unsplash.com" },
			{ protocol: "https", hostname: "picsum.photos" },
		],
	},
};

export default nextConfig;
