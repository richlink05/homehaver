"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function ProfileForm({
  isAgency,
  initial,
  email,
}: {
  isAgency: boolean;
  initial: { name: string; phone: string; companyName: string };
  email: string;
}) {
  const router = useRouter();
  const supabase = createClient();

  const [name, setName] = useState(initial.name);
  const [phone, setPhone] = useState(initial.phone);
  const [companyName, setCompanyName] = useState(initial.companyName);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setError("");
    setSaved(false);
    if (!name.trim() || !phone.trim()) {
      setError("이름과 연락처는 필수입니다.");
      return;
    }

    setSaving(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // ⚠️ update() 입력값 타입 추론 문제 우회 (다른 insert/update 호출과 동일한 이유)
    const { error: updateError } = await (supabase.from("profiles") as any)
      .update({
        name: name.trim(),
        phone: phone.trim(),
        ...(isAgency ? { company_name: companyName.trim() || null } : {}),
      })
      .eq("id", user?.id);

    setSaving(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    setSaved(true);
    router.refresh();
  };

  return (
    <div className="max-w-[480px] rounded-lg border border-line bg-white p-7">
      <div className="mb-4">
        <label className="mb-1.5 block text-[12.5px] text-gray-600">이메일</label>
        <input
          value={email}
          readOnly
          className="w-full cursor-not-allowed rounded border border-line bg-mist px-3.5 py-2.5 text-[13.5px] text-gray-500"
        />
        <p className="mt-1 text-[11.5px] text-stone">이메일은 가입 시 등록한 계정 정보라 직접 변경할 수 없습니다.</p>
      </div>

      <div className="mb-4">
        <label className="mb-1.5 block text-[12.5px] text-gray-600">이름</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded border border-line px-3.5 py-2.5 text-[13.5px] outline-none focus:border-gold"
        />
      </div>

      <div className="mb-4">
        <label className="mb-1.5 block text-[12.5px] text-gray-600">연락처</label>
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="010-0000-0000"
          className="w-full rounded border border-line px-3.5 py-2.5 text-[13.5px] outline-none focus:border-gold"
        />
      </div>

      {isAgency && (
        <div className="mb-5">
          <label className="mb-1.5 block text-[12.5px] text-gray-600">업체명</label>
          <input
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="소속 업체명 (선택)"
            className="w-full rounded border border-line px-3.5 py-2.5 text-[13.5px] outline-none focus:border-gold"
          />
        </div>
      )}

      {error && <p className="mb-3 text-[12.5px] text-red-500">{error}</p>}
      {saved && <p className="mb-3 text-[12.5px] text-gold-deep">저장되었습니다.</p>}

      <button
        onClick={handleSave}
        disabled={saving}
        className="rounded bg-gold px-6 py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-gold-deep disabled:opacity-60"
      >
        {saving ? "저장 중..." : "저장하기"}
      </button>
    </div>
  );
}
