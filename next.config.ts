import type { NextConfig } from "next";

// A minimal policy: no script-src, so it can't block the site's own scripts.
// It stops other sites framing MyTake and limits where forms and <base> point.
const contentSecurityPolicy = "frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'";

// No images.remotePatterns: TMDB images are loaded directly (unoptimized), so
// Vercel's image resizer stays limited to the site's own files.
const nextConfig: NextConfig = {
  async headers() {
    return [{
      source: "/:path*",
      headers: [
        { key: "Content-Security-Policy", value: contentSecurityPolicy },
        { key: "X-Frame-Options", value: "DENY" },
      ],
    }];
  },
};

export default nextConfig;
