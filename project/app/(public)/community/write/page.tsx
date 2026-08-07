import { createClient } from "@/lib/supabase/server";
import { getProfileRole } from "@/lib/supabase/get-profile";
import { PostForm } from "@/components/community/PostForm";

export const dynamic = "force-dynamic";

export default async function CommunityWritePage() {
  const supabase = createClient();
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
      <PostForm isAdmin={isAdmin} />
    </section>
  );
}
