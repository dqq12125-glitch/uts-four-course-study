import type { MetadataRoute } from "next";

const base = "https://uts-deep-study.dqq12125-study.workers.dev";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: base, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/pricing`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/legal/privacy`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${base}/legal/terms`, changeFrequency: "monthly", priority: 0.4 },
    {
      url: `${base}/legal/academic-integrity`,
      changeFrequency: "monthly",
      priority: 0.5,
    },
  ];
}
