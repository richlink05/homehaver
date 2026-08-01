import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

export type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

/**
 * 로그인한 사용자의 profiles 행을 가져옵니다.
 *
 * .single()의 반환 타입을 명시적으로 지정해서, Database 제네릭 추론이
 * 꼬여 Row가 never로 잡히는 문제(빌드 시 "Property 'x' does not exist
 * on type never")를 원천적으로 피합니다.
 */
export async function getProfile(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<Pick<ProfileRow, "role" | "name" | "phone" | "email" | "company_name" | "is_approved"> | null> {
  const { data } = await supabase
    .from("profiles")
    .select("role, name, phone, email, company_name, is_approved")
    .eq("id", userId)
    .single<Pick<ProfileRow, "role" | "name" | "phone" | "email" | "company_name" | "is_approved">>();

  return data;
}

/** role만 필요한 관리자 권한 체크용 경량 버전 */
export async function getProfileRole(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<Pick<ProfileRow, "role"> | null> {
  const { data } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single<Pick<ProfileRow, "role">>();

  return data;
}
