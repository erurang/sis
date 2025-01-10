import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params; // URL 파라미터에서 문서 ID 추출

  const { data, error } = await supabase
    .from("documents")
    .delete() // 데이터 삭제
    .eq("id", id); // 특정 ID의 데이터만 삭제

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(
    { message: "Document deleted successfully.", data },
    { status: 200 }
  );
}
