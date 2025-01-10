import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const consultationId = searchParams.get("consultation_id"); // 특정 상담 ID로 필터링

  const query = supabase.from("documents").select("*");

  if (consultationId) {
    query.eq("consultation_id", consultationId); // 특정 상담과 연결된 문서만 필터링
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 200 });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { consultation_id, type, content } = body;

    // 필수 필드 검증
    if (!consultation_id || !type || !content) {
      return NextResponse.json(
        {
          error: "필수 필드(consultation_id, type, content)가 누락되었습니다.",
        },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("documents")
      .insert([{ consultation_id, type, content }]);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 }
    );
  }
}
