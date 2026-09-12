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
  async redirects() {
    return [
      {
        source: "/resume",
        destination: "/cv",
        permanent: true,
      },
    ];
  },
  async rewrites() {
    const blobStoreHost =
      process.env.BLOB_STORE_DOMAIN ||
      (process.env.BLOB_READ_WRITE_TOKEN
        ? `${process.env.BLOB_READ_WRITE_TOKEN.split("_")[3]?.toLowerCase()}.public.blob.vercel-storage.com`
        : "dclry5yziridkrl7.public.blob.vercel-storage.com");

    return [
      {
        source: "/attachments/:path*",
        destination: `https://${blobStoreHost}/:path*`,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(self), geolocation=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
