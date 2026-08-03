import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";
export default function robots(): MetadataRoute.Robots { return { rules: { userAgent: "*", allow: ["/", "/novels", "/read"], disallow: ["/auth", "/dashboard", "/admin"] }, sitemap: `${siteUrl}/sitemap.xml` }; }
