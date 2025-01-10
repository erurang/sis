"use client";
import { useRouter } from "next/navigation"; // Next.js router 사용

export default function LoginPage() {
  const router = useRouter(); // Next.js router 객체

  const handleLogout = async () => {
    // 로그아웃 API 호출
    const response = await fetch("/api/logout", {
      method: "GET", // GET 요청을 통해 로그아웃 처리
    });

    if (response.ok) {
      // 로그아웃 후 로그인 페이지로 리다이렉트
      router.push("/login");
    } else {
      console.error("로그아웃 실패");
    }
  };

  return (
    <div style={{ maxWidth: "400px", margin: "0 auto", padding: "20px" }}>
      eotlqhem
      <button onClick={handleLogout}>로그아웃</button>
    </div>
  );
}
