import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * 숫자만 입력해도 010-1234-5678 형태로 자동 하이픈을 붙여줍니다.
 * 최종 저장되는 값에도 하이픈이 포함됩니다.
 */
export function formatPhoneNumber(value: string) {
  const digits = value.replace(/[^0-9]/g, "").slice(0, 11);
  if (digits.length < 4) return digits;
  if (digits.length < 8) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7, 11)}`;
}
