import "server-only";
import { headers } from "next/headers";
import { resolveAuthOrigin } from "./urls";

export async function getAuthSiteUrl() {
  return resolveAuthOrigin(process.env.NEXT_PUBLIC_SITE_URL, (await headers()).get("origin"), process.env.NODE_ENV === "development", Boolean(process.env.VERCEL));
}
