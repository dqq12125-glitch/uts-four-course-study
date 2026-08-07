import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "DeepStudy",
    short_name: "DeepStudy",
    description:
      "Turn your semester into today’s next step with plans, practice, and spaced retesting.",
    start_url: "/app/today",
    display: "standalone",
    background_color: "#F4F1E9",
    theme_color: "#2D7A57",
    orientation: "portrait",
    categories: ["education", "productivity"],
    icons: [
      {
        src: "/icons/deepstudy-1024.png",
        sizes: "1024x1024",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/deepstudy-maskable-1024.png",
        sizes: "1024x1024",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
