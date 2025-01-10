import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { sendEmail } from "@/lib/sendEmail";
import jwt from "jsonwebtoken";

const OPEN_CAGE_API_KEY = "d5ec3469dbeb4f158ac70066af8f9020";
const SECRET_KEY = process.env.JWT_SECRET || "default-secret-key";

type RoleData = {
  roles: {
    role_name: string;
  };
};

// Reverse Geocoding 함수
async function getLocationDetails(latitude: number, longitude: number) {
  const response = await fetch(
    `https://api.opencagedata.com/geocode/v1/json?q=${latitude}+${longitude}&key=${OPEN_CAGE_API_KEY}`
  );
  const data = await response.json();

  if (data && data.results && data.results.length > 0) {
    return data.results[0].formatted;
  }

  return "위치 정보를 가져올 수 없습니다.";
}

export async function POST(req: Request) {
  const { email, code, location } = await req.json();

  // 인증번호 검증
  const { data: verificationData, error: verificationError } = await supabase
    .from("verification_codes")
    .select("*")
    .eq("email", email)
    .eq("code", code)
    .single();

  if (verificationError || !verificationData) {
    return NextResponse.json(
      { error: "잘못된 인증번호입니다." },
      { status: 400 }
    );
  }

  // 사용자 역할 가져오기
  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("roles(role_name)")
    .eq("email", email)
    .single<RoleData>();

  if (userError || !userData) {
    return NextResponse.json(
      { error: "사용자 역할을 가져올 수 없습니다." },
      { status: 500 }
    );
  }

  const roleName = userData?.roles?.role_name; // 역할 이름 추출

  // 위치 정보 가져오기
  const { latitude, longitude } = location || {};
  let locationDetails = "위치 정보를 가져올 수 없습니다.";

  if (latitude && longitude) {
    locationDetails = await getLocationDetails(latitude, longitude);
  }

  // 로그인 기록 저장
  const ip =
    req.headers.get("x-forwarded-for") ||
    req.headers.get("remote-addr") ||
    "IP 주소를 확인할 수 없습니다.";

  await supabase.from("login_logs").insert({
    email,
    ip_address: ip,
    latitude,
    longitude,
    login_time: new Date().toISOString(),
  });

  // 관리자에게 이메일 발송
  const adminEmail = "erurang@naver.com";
  const emailSubject = `${email} / ${locationDetails}`;
  const emailContent = `
    <h2>로그인 알림</h2>
    <p><strong>로그인한 이메일:</strong> ${email}</p>
    <p><strong>로그인 IP:</strong> ${ip}</p>
    <p><strong>위치:</strong> ${locationDetails}</p>
    <p><strong>위도/경도:</strong> ${latitude || "N/A"}, ${
    longitude || "N/A"
  }</p>
    <p><strong>로그인 시간:</strong> ${new Date().toISOString()}</p>
  `;

  try {
    await sendEmail(adminEmail, emailSubject, emailContent);
    console.log("관리자에게 로그인 알림 이메일이 전송되었습니다.");
  } catch (err) {
    console.error("관리자 이메일 전송 오류:", err);
  }

  // JWT 토큰 생성 (role 포함)
  const token = jwt.sign({ email, role: roleName }, SECRET_KEY, {
    expiresIn: "10h",
  });

  // JWT를 HttpOnly 쿠키에 저장
  const response = NextResponse.json({ message: "로그인 성공!" });
  response.cookies.set("auth-token", token, {
    path: "/",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 36000,
  });

  return response;
}
