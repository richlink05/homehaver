import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/mypage", "/api", "/listings/new", "/listings/managing", "/listings/waitlist"],
      },
    ],
    sitemap: "https://homehaver.vercel.app/sitemap.xml",
  };
}
