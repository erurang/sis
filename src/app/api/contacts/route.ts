import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const companyId = searchParams.get("company_id"); // company_id가 있는 경우 필터링

  const query = supabase.from("contacts").select("*");

  if (companyId) {
    query.eq("company_id", companyId); // 특정 회사의 담당자만 조회
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
    const { contact_name, department, position, mobile, email, company_id } =
      body;

    // 필수 필드 검증
    if (!contact_name || !company_id) {
      return NextResponse.json(
        { error: "필수 필드(contact_name, company_id)가 누락되었습니다." },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("contacts")
      .insert([
        { contact_name, department, position, mobile, email, company_id },
      ]);

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
