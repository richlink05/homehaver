import { redirect } from "next/navigation";

// 포인트 제도가 기간제 결제로 바뀌어 결제내역 화면으로 이동시킵니다.
export default function PointsPage() {
  redirect("/mypage/payments");
}
