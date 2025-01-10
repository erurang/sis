// /app/api/logout/route.ts
import { NextResponse } from "next/server";

export async function GET() {
  const response = NextResponse.redirect("http://localhost:3000/login"); // 로그인 페이지로 리다이렉트 (절대 경로 사용)

  // 쿠키에서 auth-token 삭제
  response.cookies.delete("auth-token");
  response.cookies.set("auth-token", "", { path: "/" }); // path를 포함하여 쿠키를 빈 값으로 설정하여 삭제됨을 확실히 함

  return response;
}
