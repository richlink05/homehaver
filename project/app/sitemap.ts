import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createClient();
  const { data: listings } = await supabase
    .from("listings")
    .select("id, updated_at")
    .eq("is_approved", true)
    .returns<{ id: string; updated_at: string }[]>();

  const staticPages: MetadataRoute.Sitemap = [
    { url: "https://www.homehaver.com", changeFrequency: "daily", priority: 1 },
    { url: "https://www.homehaver.com/search", changeFrequency: "hourly", priority: 0.9 },
    { url: "https://www.homehaver.com/business", changeFrequency: "weekly", priority: 0.7 },
    { url: "https://www.homehaver.com/community", changeFrequency: "daily", priority: 0.5 },
  ];

  const listingPages: MetadataRoute.Sitemap = (listings ?? []).map((l) => ({
    url: `https://www.homehaver.com/listing/${l.id}`,
    lastModified: l.updated_at,
    changeFrequency: "daily",
    priority: 0.8,
  }));

  return [...staticPages, ...listingPages];
}
