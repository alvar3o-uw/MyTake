import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1"],
  images: { remotePatterns: [{ protocol: "https", hostname: "image.tmdb.org", pathname: "/t/p/**", search: "" }] },
};

export default nextConfig;
