import type { MetadataRoute } from "next";
import { DOZEN_MARK_INK } from "@/lib/dozen-mark-data";
import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/seo";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE_NAME,
    short_name: SITE_NAME,
    description: SITE_DESCRIPTION,
    start_url: "/",
    display: "standalone",
    background_color: "#f7f5f0",
    theme_color: DOZEN_MARK_INK,
    lang: "en",
    icons: [
      { src: "/icon-48.png", sizes: "48x48", type: "image/png" },
      { src: "/icon-96.png", sizes: "96x96", type: "image/png" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  };
}
