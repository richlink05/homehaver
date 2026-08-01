import { z } from "zod";

export const signupSchema = z.object({
  role: z.enum(["user", "agency"]),
  name: z.string().min(2, "이름을 입력해주세요"),
  email: z.string().email("올바른 이메일을 입력해주세요"),
  phone: z.string().regex(/^01[0-9]-?\d{3,4}-?\d{4}$/, "올바른 휴대폰번호를 입력해주세요"),
  password: z.string().min(8, "비밀번호는 8자 이상이어야 합니다"),
  companyName: z.string().optional(),
});

export type SignupInput = z.infer<typeof signupSchema>;
