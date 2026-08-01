import { z } from "zod";

export const listingSchema = z.object({
  title: z.string().min(2, "분양명을 입력해주세요"),
  type: z.enum(["아파트", "오피스텔", "지식산업센터", "상가"]),
  status: z.enum(["분양예정", "분양중", "계약중", "마감"]),
  address: z.string().min(2, "주소를 입력해주세요"),
  moveInDate: z.string().optional(),
  priceMin: z.coerce.number().positive("분양가(최소)를 입력해주세요"),
  priceMax: z.coerce.number().positive("분양가(최대)를 입력해주세요"),
  builderName: z.string().min(1, "시공사를 입력해주세요"),
  brandName: z.string().optional(),
  managerName: z.string().min(1, "담당자 이름을 입력해주세요"),
  managerPhone: z.string().regex(/^01[0-9]-?\d{3,4}-?\d{4}$/, "올바른 담당자 연락처를 입력해주세요"),
  description: z.string().min(10, "10자 이상 작성해주세요"),
});

export type ListingInput = z.infer<typeof listingSchema>;
