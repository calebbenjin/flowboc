import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The landing page is app/home/page.tsx (see the comment there); "/" is
  // rewritten to it and the bare /home URL redirects back to "/".
  async rewrites() {
    return { beforeFiles: [{ source: "/", destination: "/home" }] };
  },
  async redirects() {
    return [{ source: "/home", destination: "/", permanent: true }];
  },
  images: {
    // Instructor uploads live in Vercel Blob; routing them through the image
    // optimizer serves AVIF/WebP at the rendered size instead of the raw
    // upload (the biggest item on the public page's Lighthouse report).
    remotePatterns: [{ protocol: "https", hostname: "*.public.blob.vercel-storage.com" }],
    formats: ["image/avif", "image/webp"],
    // Blob URLs carry a random suffix, so a given URL never changes content.
    minimumCacheTTL: 60 * 60 * 24 * 30,
  },
};

export default nextConfig;
