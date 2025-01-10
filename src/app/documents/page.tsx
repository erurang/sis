"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import dayjs from "dayjs";

interface Document {
  id: string;
  created_at: string;
  company_name: string;
  document_number: string;
  total_amount: number; // 총금액
  status: string; // 문서 상태 (consultations.status)
  priority: string; // 우선순위 (consultations.priority)
  user_name: string; // 작성자
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    startDate: dayjs().startOf("month").format("YYYY-MM-DD"),
    endDate: dayjs().format("YYYY-MM-DD"),
    companyName: "",
    userName: "", // 사원명 검색 필터 추가
    documentType: "estimate", // 기본값: 견적서
  });

  const documentsPerPage = 10; // 한 페이지당 문서 수
  const router = useRouter();

  useEffect(() => {
    const fetchDocuments = async () => {
      const { startDate, endDate, companyName, userName, documentType } =
        filters;

      let query = supabase
        .from("documents")
        .select(
          `
          id,
          created_at,
          content->>company_name,
          content->>total_amount,
          document_number,
          consultation_id,
          user_id
        `
        )
        .eq("type", documentType)
        .range(
          (currentPage - 1) * documentsPerPage,
          currentPage * documentsPerPage - 1
        );

      if (startDate) query.gte("created_at", startDate);
      if (endDate) query.lte("created_at", endDate);
      if (companyName)
        query.ilike("content->>company_name", `%${companyName}%`);

      const { data, count, error } = await query;

      if (error) {
        console.error("문서 가져오기 실패:", error);
        return;
      }

      // consultations 테이블에서 status와 priority 가져오기
      const consultationIds = data.map((doc: any) => doc.consultation_id);
      const { data: consultationsData, error: consultationsError } =
        await supabase
          .from("consultations")
          .select("id, status, priority")
          .in("id", consultationIds);

      if (consultationsError) {
        console.error("상담 정보 가져오기 실패:", consultationsError);
        return;
      }

      // 작성자 이름 가져오기
      const userIds = data.map((doc: any) => doc.user_id);
      const { data: usersData, error: usersError } = await supabase
        .from("users")
        .select("id, name")
        .in("id", userIds);

      if (usersError) {
        console.error("작성자 정보 가져오기 실패:", usersError);
        return;
      }

      // 사원명 필터 적용
      const filteredUsers = userName
        ? usersData.filter((user: any) => user.name.includes(userName))
        : usersData;

      const filteredUserIds = filteredUsers.map((user: any) => user.id);

      // consultations와 users 데이터 매핑
      const consultationsMap = consultationsData.reduce(
        (
          map: Record<string, { status: string; priority: string }>,
          consultation: any
        ) => {
          map[consultation.id] = {
            status: consultation.status,
            priority: consultation.priority,
          };
          return map;
        },
        {}
      );

      const usersMap = usersData.reduce(
        (map: Record<string, string>, user: any) => {
          map[user.id] = user.name;
          return map;
        },
        {}
      );

      // 날짜 포맷 및 상태 추가
      const formattedData = data
        ?.filter(
          (doc: any) => !userName || filteredUserIds.includes(doc.user_id)
        )
        .map((doc: any) => ({
          ...doc,
          created_at: dayjs(doc.created_at).format("YYYY-MM-DD"),
          total_amount: Number(doc.total_amount).toLocaleString(),
          status: consultationsMap[doc.consultation_id]?.status || "알 수 없음",
          priority: consultationsMap[doc.consultation_id]?.priority || "보통",
          user_name: usersMap[doc.user_id] || "알 수 없음",
        }));

      setDocuments(formattedData || []);
      setTotalPages(Math.ceil((count || 0) / documentsPerPage));
    };

    fetchDocuments();
  }, [currentPage, filters]);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>문서 관리</h1>

      {/* 필터 영역 */}
      <div style={{ marginBottom: "20px", display: "flex", gap: "10px" }}>
        <input
          type="date"
          placeholder="시작 날짜"
          value={filters.startDate}
          onChange={(e) =>
            setFilters((prev) => ({ ...prev, startDate: e.target.value }))
          }
        />
        <input
          type="date"
          placeholder="종료 날짜"
          value={filters.endDate}
          onChange={(e) =>
            setFilters((prev) => ({ ...prev, endDate: e.target.value }))
          }
        />
        <input
          type="text"
          placeholder="회사명 검색"
          value={filters.companyName}
          onChange={(e) =>
            setFilters((prev) => ({ ...prev, companyName: e.target.value }))
          }
        />
        <input
          type="text"
          placeholder="사원명 검색"
          value={filters.userName}
          onChange={(e) =>
            setFilters((prev) => ({ ...prev, userName: e.target.value }))
          }
        />
        <p style={{ marginBottom: "10px" }}>
          총 <strong>{documents.length}</strong>개의 문서가 검색되었습니다.
        </p>
        <button
          onClick={() =>
            setFilters({
              startDate: dayjs().startOf("month").format("YYYY-MM-DD"),
              endDate: dayjs().format("YYYY-MM-DD"),
              companyName: "",
              userName: "",
              documentType: "estimate",
            })
          }
          style={{
            padding: "10px",
            backgroundColor: "#dc3545",
            color: "#fff",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
          }}
        >
          필터 초기화
        </button>

        <select
          value={filters.documentType}
          onChange={(e) =>
            setFilters((prev) => ({ ...prev, documentType: e.target.value }))
          }
        >
          <option value="estimate">견적서</option>
          <option value="order">발주서</option>
          <option value="request">견적의뢰서</option>
        </select>
      </div>

      {/* 문서 테이블 */}
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={{ border: "1px solid #ccc", padding: "10px" }}>번호</th>
            <th style={{ border: "1px solid #ccc", padding: "10px" }}>날짜</th>
            <th style={{ border: "1px solid #ccc", padding: "10px" }}>
              문서번호
            </th>
            <th style={{ border: "1px solid #ccc", padding: "10px" }}>
              회사명
            </th>
            <th style={{ border: "1px solid #ccc", padding: "10px" }}>
              총금액
            </th>
            <th style={{ border: "1px solid #ccc", padding: "10px" }}>
              작성자
            </th>
            <th style={{ border: "1px solid #ccc", padding: "10px" }}>상태</th>
            <th style={{ border: "1px solid #ccc", padding: "10px" }}>
              우선순위
            </th>
          </tr>
        </thead>
        <tbody>
          {documents.map((doc, index) => (
            <tr
              key={doc.id}
              onClick={() => router.push(`/documents/${doc.id}`)}
            >
              <td
                style={{
                  border: "1px solid #ccc",
                  padding: "10px",
                  textAlign: "center",
                }}
              >
                {(currentPage - 1) * documentsPerPage +
                  documents.length -
                  index}
              </td>
              <td style={{ border: "1px solid #ccc", padding: "10px" }}>
                {doc.created_at}
              </td>
              <td style={{ border: "1px solid #ccc", padding: "10px" }}>
                {doc.document_number}
              </td>
              <td style={{ border: "1px solid #ccc", padding: "10px" }}>
                {doc.company_name}
              </td>
              <td style={{ border: "1px solid #ccc", padding: "10px" }}>
                {doc.total_amount} 원
              </td>
              <td style={{ border: "1px solid #ccc", padding: "10px" }}>
                {doc.user_name}
              </td>
              <td
                style={{
                  border: "1px solid #ccc",
                  padding: "10px",
                  color:
                    doc.status === "completed"
                      ? "green"
                      : doc.status === "pending"
                      ? "orange"
                      : "red",
                  fontWeight: "bold",
                }}
              >
                {doc.status}
              </td>
              <td
                style={{
                  border: "1px solid #ccc",
                  padding: "10px",
                  color:
                    doc.priority === "high"
                      ? "red"
                      : doc.priority === "medium"
                      ? "orange"
                      : "green",
                  fontWeight: "bold",
                }}
              >
                {doc.priority}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* 페이지네이션 */}
      <div style={{ marginTop: "20px", textAlign: "center" }}>
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          style={{ marginRight: "10px" }}
        >
          이전
        </button>
        {totalPages > 0 ? (
          [...Array(totalPages)].map((_, i) => (
            <button
              key={i}
              onClick={() => handlePageChange(i + 1)}
              style={{
                margin: "0 5px",
                fontWeight: currentPage === i + 1 ? "bold" : "normal",
              }}
            >
              {i + 1}
            </button>
          ))
        ) : (
          <button
            key={0}
            onClick={() => handlePageChange(1)}
            style={{
              margin: "0 5px",
              fontWeight: "bold",
            }}
          >
            1
          </button>
        )}
        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages || totalPages === 0}
          style={{ marginLeft: "10px" }}
        >
          다음
        </button>
      </div>
    </div>
  );
}
