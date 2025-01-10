import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { sendEmail } from "@/lib/sendEmail";

export async function POST(req: Request) {
  const { email } = await req.json();

  // 인증번호 생성
  const verificationCode = Math.floor(
    100000 + Math.random() * 900000
  ).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10분 후 만료

  try {
    // 인증번호 저장
    const { error: dbError } = await supabase
      .from("verification_codes")
      .insert({
        email,
        code: verificationCode,
        expires_at: expiresAt,
      });

    if (dbError) {
      console.error("DB 저장 오류:", dbError);
      return NextResponse.json(
        { error: "인증번호 저장 실패" },
        { status: 500 }
      );
    }

    // 인증번호 이메일 전송
    await sendEmail(
      email,
      "우양신소재 영업관리 시스템 인증번호",
      `안녕하세요! 인증번호는 ${verificationCode}입니다.`
    );

    console.log(`인증번호 ${verificationCode}이 ${email}로 전송되었습니다.`);

    return NextResponse.json({ message: "인증번호가 전송되었습니다." });
  } catch (error) {
    console.error("이메일 전송 오류:", error);
    return NextResponse.json(
      { error: "이메일 전송에 실패했습니다." },
      { status: 500 }
    );
  }
}
