import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

// GET 요청: 회사 목록 가져오기
export async function GET() {
  const { data, error } = await supabase.from("companies").select("*");

  console.log(data);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data, { status: 200 });
}

// POST 요청: 회사 추가하기
export async function POST(req: Request) {
  try {
    const body = await req.json(); // 요청에서 JSON 데이터 파싱
    const { name, address, phone, fax, email } = body;

    // 필수 데이터 확인
    if (!name || !address || !phone || !email) {
      return NextResponse.json(
        { error: "모든 필수 필드(name, address, phone, email)를 입력하세요." },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("companies")
      .insert([{ name, address, phone, fax, email }]); // 새로운 데이터 삽입

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 }); // 성공 시 생성된 데이터 반환
  } catch (err) {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 }
    );
  }
}
