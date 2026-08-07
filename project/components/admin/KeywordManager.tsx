"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function KeywordManager({ keywords }: { keywords: { id: string; keyword: string }[] }) {
  const router = useRouter();
  const supabase = createClient();
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const add = async () => {
    const word = input.trim();
    if (!word) return;
    setLoading(true);
    const { error } = await (supabase.from("banned_keywords") as any).insert({ keyword: word });
    setLoading(false);
    if (error) {
      alert(error.message.includes("duplicate") ? "이미 등록된 키워드입니다." : error.message);
      return;
    }
    setInput("");
    router.refresh();
  };

  const remove = async (id: string) => {
    await supabase.from("banned_keywords").delete().eq("id", id);
    router.refresh();
  };

  return (
    <div>
      <div className="mb-3 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder="예: 대출, 도박, 카지노"
          className="flex-1 rounded border border-line px-3 py-2 text-[13px] outline-none focus:border-gold"
        />
        <button
          onClick={add}
          disabled={loading}
          className="rounded bg-gold px-4 text-[12.5px] font-semibold text-white disabled:opacity-60"
        >
          추가
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {keywords.length === 0 && <span className="text-[12.5px] text-stone">등록된 금지 키워드가 없습니다.</span>}
        {keywords.map((k) => (
          <span
            key={k.id}
            className="flex items-center gap-1.5 rounded-full border border-line bg-white py-1.5 pl-3.5 pr-2 text-[12.5px]"
          >
            {k.keyword}
            <button
              onClick={() => remove(k.id)}
              className="flex h-4.5 w-4.5 items-center justify-center rounded-full bg-mist text-[10px] text-gray-500 hover:bg-red-50 hover:text-red-500"
            >
              ✕
            </button>
          </span>
        ))}
      </div>
    </div>
  );
}
