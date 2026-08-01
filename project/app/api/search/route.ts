import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database.types";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") ?? "";
  const type = searchParams.get("type");
  const status = searchParams.get("status");
  const page = Number(searchParams.get("page") ?? "1");
  const pageSize = 12;

  const supabase = createClient();

  type SearchListingRow = Database["public"]["Tables"]["listings"]["Row"] & {
    regions: { sido: string; sigungu: string | null; dong: string | null } | null;
    builders: { name: string } | null;
  };

  let query = supabase
    .from("listings")
    .select("*, regions(sido, sigungu, dong), builders(name)", { count: "exact" })
    .eq("is_approved", true)
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (q) {
    query = query.or(`title.ilike.%${q}%,address.ilike.%${q}%`);
  }
  if (type) query = query.eq("type", type);
  if (status) query = query.eq("status", status);

  const { data, error, count } = await query.returns<SearchListingRow[]>();

  if (error) {
    return NextResponse.json({ data: null, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data, count, error: null });
}
