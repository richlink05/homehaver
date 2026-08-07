import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProfileRole } from "@/lib/supabase/get-profile";
import { PostForm } from "@/components/community/PostForm";

export const dynamic = "force-dynamic";

export default async function CommunityEditPage({ params }: { params: { id: string } }) {
  const supabase = createClient();

  const { data: post } = await supabase
    .from("community_posts")
    .select("id, category, title, content, author, image_url")
    .eq("id", params.id)
    .single<{ id: string; category: string; title: string; content: string; author: string; image_url: string | null }>();

  if (!post) notFound();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  let isAdmin = false;
  if (user) {
    const profile = await getProfileRole(supabase, user.id);
    isAdmin = profile?.role === "admin";
  }

  return (
    <section className="mx-auto max-w-[700px] px-8 py-12">
      <PostForm isAdmin={isAdmin} editing={post} />
    </section>
  );
}
