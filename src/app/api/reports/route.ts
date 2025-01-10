import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

// 상담 내역 및 문서 통계 보고서 API
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const startDate = searchParams.get("start_date"); // 시작 날짜
  const endDate = searchParams.get("end_date"); // 종료 날짜

  if (!startDate || !endDate) {
    return NextResponse.json(
      { error: "start_date와 end_date는 필수입니다." },
      { status: 400 }
    );
  }

  try {
    // 상담 내역 통계 가져오기
    const { data: consultations, error: consultationError } = await supabase
      .from("consultations")
      .select("id, status, priority, date")
      .gte("date", startDate)
      .lte("date", endDate);

    if (consultationError) throw consultationError;

    // 문서 통계 가져오기
    const { data: documents, error: documentError } = await supabase
      .from("documents")
      .select("id, type, consultation_id, created_at")
      .gte("created_at", startDate)
      .lte("created_at", endDate);

    if (documentError) throw documentError;

    // 상담 상태별 통계
    const statusStats = consultations.reduce(
      (acc: Record<string, number>, cur: { status: string }) => {
        acc[cur.status] = (acc[cur.status] || 0) + 1;
        return acc;
      },
      {}
    );

    // 상담 우선순위별 통계
    const priorityStats = consultations.reduce(
      (acc: Record<string, number>, cur: { priority: string }) => {
        acc[cur.priority] = (acc[cur.priority] || 0) + 1;
        return acc;
      },
      {}
    );

    // 문서 유형별 통계
    const documentTypeStats = documents.reduce(
      (acc: Record<string, number>, cur: { type: string }) => {
        acc[cur.type] = (acc[cur.type] || 0) + 1;
        return acc;
      },
      {}
    );

    // 결과 반환
    return NextResponse.json({
      consultationCount: consultations.length,
      documentCount: documents.length,
      statusStats,
      priorityStats,
      documentTypeStats,
      consultations,
      documents,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
