"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation"; // Next.js router 사용

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState(1);
  const [message, setMessage] = useState("");
  const [location, setLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false); // 로그인 상태 관리

  const router = useRouter(); // Next.js router 객체

  useEffect(() => {
    // 로그인 상태 확인
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/check-auth", {
          method: "GET",
          credentials: "include",
        });
        if (response.ok) {
          setIsLoggedIn(true);
          router.push("/dashboard"); // 로그인 상태일 경우 대시보드로 리다이렉트
        }
      } catch (error) {
        console.error("인증 확인 실패:", error);
      }
    };

    checkAuth();
  }, []);

  const handleSendCode = async () => {
    try {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setLocation({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            });
            console.log("위치 정보:", position.coords);
          },
          (error) => {
            console.error("위치 정보 가져오기 실패:", error.message);
            setMessage(
              "위치 정보 가져오기에 실패했습니다. 위치 액세스를 허용해주세요."
            );
          }
        );
      } else {
        setMessage("GeoLocation API를 지원하지 않는 브라우저입니다.");
      }

      const response = await fetch("/api/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      if (response.ok) {
        setStep(2);
        setMessage("인증번호가 전송되었습니다. 이메일을 확인하세요.");
      } else {
        setMessage(`오류: ${data.error}`);
      }
    } catch (error) {
      console.error("서버 오류:", error);
      setMessage("서버 오류가 발생했습니다.");
    }
  };

  const handleLogin = async () => {
    try {
      const response = await fetch("/api/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          code,
          location,
        }),
        credentials: "include", // 쿠키를 포함하여 요청
      });

      const data = await response.json();

      if (response.ok) {
        setMessage("로그인 성공!");

        // redirectTo 파라미터 확인
        const redirectTo =
          new URLSearchParams(window.location.search).get("redirectTo") ||
          "/dashboard";

        console.log("Redirecting to:", redirectTo);

        // router.push로 리다이렉트 처리
        router.push(redirectTo);
      } else {
        setMessage(`오류: ${data.error}`);
        console.error("로그인 오류:", data.error);
      }
    } catch (error) {
      console.error("서버 오류:", error);
      setMessage("서버 오류가 발생했습니다.");
    }
  };

  return (
    <div style={{ maxWidth: "400px", margin: "0 auto", padding: "20px" }}>
      {step === 1 && !isLoggedIn && (
        <div>
          <label>이메일:</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="이메일 입력"
            style={{ display: "block", width: "100%", marginBottom: "10px" }}
          />
          <button onClick={handleSendCode}>인증번호 받기</button>
        </div>
      )}
      {step === 2 && !isLoggedIn && (
        <div>
          <label>인증번호:</label>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="인증번호 입력"
            style={{ display: "block", width: "100%", marginBottom: "10px" }}
          />
          <button onClick={handleLogin}>로그인</button>
        </div>
      )}
      {message && <p>{message}</p>}
    </div>
  );
}
