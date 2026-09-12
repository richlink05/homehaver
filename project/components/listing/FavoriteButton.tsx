"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function FavoriteButton({ listingId }: { listingId: string }) {
  const router = useRouter();
  const supabase = createClient();
  const [isFavorited, setIsFavorited] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }
      const { data } = await supabase
        .from("favorites")
        .select("id")
        .eq("listing_id", listingId)
        .eq("user_id", user.id)
        .maybeSingle();
      setIsFavorited(!!data);
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listingId]);

  const toggle = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login");
      return;
    }

    setSaving(true);
    if (isFavorited) {
      await supabase.from("favorites").delete().eq("listing_id", listingId).eq("user_id", user.id);
      setIsFavorited(false);
    } else {
      // ⚠️ insert() 입력값 타입 추론 문제 우회 (다른 insert/update 호출과 동일한 이유)
      const { error } = await (supabase.from("favorites") as any).insert({
        listing_id: listingId,
        user_id: user.id,
      });
      if (!error) setIsFavorited(true);
    }
    setSaving(false);
    router.refresh();
  };

  if (loading) return null;

  return (
    <button
      onClick={toggle}
      disabled={saving}
      className={`flex items-center gap-1.5 rounded-md border px-4 py-2.5 text-[13px] font-semibold transition-colors disabled:opacity-60 ${
        isFavorited
          ? "border-gold bg-gold/10 text-gold-deep hover:bg-gold/20"
          : "border-line text-gray-600 hover:border-gold-deep hover:text-gold-deep"
      }`}
    >
      <svg width="15" height="15" viewBox="0 0 24 24" fill={isFavorited ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
        <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
      </svg>
      {isFavorited ? "즐겨찾기됨" : "즐겨찾기"}
    </button>
  );
}
