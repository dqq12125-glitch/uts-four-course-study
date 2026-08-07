import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/pricing", "/legal/"],
      disallow: ["/app/", "/admin/", "/personal", "/api/"],
    },
  };
}
