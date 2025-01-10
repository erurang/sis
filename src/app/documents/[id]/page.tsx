"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import dayjs from "dayjs";

interface Document {
  id: string;
  created_at: string;
  document_number: string;
  type: string;
  content: {
    company_name: string;
    total_amount: string;
    [key: string]: any;
  };
  user_name: string;
}

export default function DocumentDetailPage() {
  const { id } = useParams(); // id 가져오기
  const router = useRouter();
  const [document, setDocument] = useState<Document | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDocument = async () => {
      try {
        const { data, error } = await supabase
          .from("documents")
          .select(
            `
            id,
            created_at,
            document_number,
            type,
            content,
            user_id
          `
          )
          .eq("id", id)
          .single();

        if (error) throw error;

        // 작성자 이름 가져오기
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("name")
          .eq("id", data.user_id)
          .single();

        if (userError) throw userError;

        setDocument({
          ...data,
          user_name: userData.name,
          created_at: dayjs(data.created_at).format("YYYY-MM-DD"),
        });
      } catch (error) {
        console.error("문서 가져오기 실패:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDocument();
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return <p>로딩 중...</p>;
  }

  if (!document) {
    return <p>문서를 찾을 수 없습니다.</p>;
  }

  const renderContent = () => {
    const { type, content } = document;

    if (type === "estimate") {
      return (
        <div>
          <h2>견적서</h2>
          <p>회사명: {content.company_name}</p>
          <p>총금액: {content.total_amount} 원</p>
          <p>유효기간: {content.valid_until}</p>
          <p>납품장소: {content.delivery_place}</p>
          <p>특이사항: {content.notes}</p>
          <h3>항목</h3>
          <ul>
            {content.items.map((item: any, index: number) => (
              <li key={index}>
                {index + 1}. {item.name} - {item.spec} - {item.quantity}개 -{" "}
                {item.unit_price}원 - 합계: {item.amount}원
              </li>
            ))}
          </ul>
        </div>
      );
    } else if (type === "order") {
      return (
        <div>
          <h2>발주서</h2>
          <p>회사명: {content.company_name}</p>
          <p>총금액: {content.total_amount} 원</p>
          <p>납기일자: {content.delivery_date}</p>
          <p>결제조건: {content.payment_terms}</p>
          <p>특이사항: {content.notes}</p>
          <h3>항목</h3>
          <ul>
            {content.items.map((item: any, index: number) => (
              <li key={index}>
                {index + 1}. {item.name} - {item.spec} - {item.quantity}개 -{" "}
                {item.unit_price}원 - 합계: {item.amount}원
              </li>
            ))}
          </ul>
        </div>
      );
    } else if (type === "request") {
      return (
        <div>
          <h2>견적의뢰서</h2>
          <p>회사명: {content.company_name}</p>
          <p>희망견적일: {content.estimate_date}</p>
          <p>특이사항: {content.notes}</p>
          <h3>항목</h3>
          <ul>
            {content.items.map((item: any, index: number) => (
              <li key={index}>
                {index + 1}. {item.name} - {item.spec} - {item.quantity}개 -{" "}
                {item.unit_price}원 - 합계: {item.amount}원
              </li>
            ))}
          </ul>
        </div>
      );
    } else {
      return <p>알 수 없는 문서 유형입니다.</p>;
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>문서 상세보기</h1>
      <p>문서 번호: {document.document_number}</p>
      <p>작성일: {document.created_at}</p>
      <p>작성자: {document.user_name}</p>
      {renderContent()}
      <button
        onClick={handlePrint}
        style={{
          marginTop: "20px",
          padding: "10px 20px",
          backgroundColor: "#28a745",
          color: "#fff",
          border: "none",
          borderRadius: "5px",
          cursor: "pointer",
        }}
      >
        프린트
      </button>
      <button
        onClick={() => router.back()}
        style={{
          marginTop: "20px",
          marginLeft: "10px",
          padding: "10px 20px",
          backgroundColor: "#007bff",
          color: "#fff",
          border: "none",
          borderRadius: "5px",
          cursor: "pointer",
        }}
      >
        돌아가기
      </button>
    </div>
  );
}
