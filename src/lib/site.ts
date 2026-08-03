import { requireSiteUrl } from "@/lib/env";

export const siteUrl = requireSiteUrl();

export function getSiteUrl() {
  return siteUrl;
}
