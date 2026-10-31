import type { NextConfig } from "next";

// No images.remotePatterns: TMDB images are loaded directly (unoptimized), so
// Vercel's image resizer stays limited to the site's own files.
const nextConfig: NextConfig = {};

export default nextConfig;
