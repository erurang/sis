import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params; // URL 파라미터에서 담당자 ID 추출
  const body = await req.json(); // 요청에서 수정할 데이터 추출

  const { data, error } = await supabase
    .from("contacts")
    .update(body) // body의 데이터를 업데이트
    .eq("id", id); // 특정 ID의 데이터만 업데이트

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 200 });
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params; // URL 파라미터에서 담당자 ID 추출

  const { data, error } = await supabase
    .from("contacts")
    .delete() // 데이터 삭제
    .eq("id", id); // 특정 ID의 데이터만 삭제

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(
    { message: "Contact deleted successfully.", data },
    { status: 200 }
  );
}
