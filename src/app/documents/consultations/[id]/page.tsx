"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import dayjs from "dayjs";

interface Document {
  id: string;
  created_at: string;
  type: string;
  document_number: string;
  contact_id: string;
  user_id: string;
  content: {
    total_amount: number;
  };
}

interface Contact {
  id: string;
  contact_name: string;
}

interface User {
  id: string;
  name: string;
}

export default function ConsultationDocumentsPage() {
  const { id } = useParams(); // 특정 상담 ID
  const router = useRouter();

  const [documents, setDocuments] = useState<Document[]>([]);
  const [contacts, setContacts] = useState<Record<string, string>>({});
  const [users, setUsers] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState("estimate"); // 기본 탭: 견적서
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDocuments = async () => {
      setLoading(true);

      // 최신순으로 문서 데이터 가져오기
      const { data: documentsData, error: documentsError } = await supabase
        .from("documents")
        .select(
          "id, created_at, type, document_number, contact_id, user_id, content"
        )
        .eq("consultation_id", id)
        .order("created_at", { ascending: false }); // 최신순 정렬

      if (documentsError) {
        console.error("문서 가져오기 실패:", documentsError);
        setLoading(false);
        return;
      }

      const contactIds = [
        ...new Set(documentsData.map((doc) => doc.contact_id)),
      ];
      const userIds = [...new Set(documentsData.map((doc) => doc.user_id))];

      const { data: contactsData, error: contactsError } = await supabase
        .from("contacts")
        .select("id, contact_name")
        .in("id", contactIds);

      if (contactsError) {
        console.error("연락처 가져오기 실패:", contactsError);
        setLoading(false);
        return;
      }

      const { data: usersData, error: usersError } = await supabase
        .from("users")
        .select("id, name")
        .in("id", userIds);

      if (usersError) {
        console.error("사용자 가져오기 실패:", usersError);
        setLoading(false);
        return;
      }

      const contactsMap = contactsData?.reduce(
        (map, contact) => ({ ...map, [contact.id]: contact.contact_name }),
        {}
      );
      const usersMap = usersData?.reduce(
        (map, user) => ({ ...map, [user.id]: user.name }),
        {}
      );

      setDocuments(documentsData || []);
      setContacts(contactsMap || {});
      setUsers(usersMap || {});
      setLoading(false);
    };

    fetchDocuments();
  }, [id]);

  const handleOpenDocument = (documentId: string) => {
    router.push(`/documents/${documentId}`); // 문서 상세 페이지로 이동
  };

  const handleCreateDocument = (type: string) => {
    router.push(`/documents/${type}/${id}`); // 새로운 문서 생성 페이지로 이동
  };

  const filteredDocuments = documents.filter((doc) => doc.type === activeTab);

  return (
    <div style={{ padding: "20px" }}>
      <h1>문서 관리 (상담 ID: {id})</h1>

      {/* 새 문서 생성 버튼 */}
      <div style={{ marginBottom: "20px" }}>
        <h2>새 문서 생성</h2>
        <button
          onClick={() => handleCreateDocument("estimate")}
          style={{
            padding: "10px 20px",
            backgroundColor: "#28a745",
            color: "#fff",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
            marginRight: "10px",
          }}
        >
          견적서 생성
        </button>
        <button
          onClick={() => handleCreateDocument("order")}
          style={{
            padding: "10px 20px",
            backgroundColor: "#ffc107",
            color: "#fff",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
            marginRight: "10px",
          }}
        >
          발주서 생성
        </button>
        <button
          onClick={() => handleCreateDocument("quotation_request")}
          style={{
            padding: "10px 20px",
            backgroundColor: "#17a2b8",
            color: "#fff",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
          }}
        >
          견적의뢰서 생성
        </button>
      </div>

      {/* 탭 메뉴 */}
      <div style={{ marginBottom: "20px" }}>
        <button
          onClick={() => setActiveTab("estimate")}
          style={{
            padding: "10px 20px",
            backgroundColor: activeTab === "estimate" ? "#007bff" : "#f0f0f0",
            color: activeTab === "estimate" ? "#fff" : "#000",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
            marginRight: "10px",
          }}
        >
          견적서
        </button>
        <button
          onClick={() => setActiveTab("order")}
          style={{
            padding: "10px 20px",
            backgroundColor: activeTab === "order" ? "#007bff" : "#f0f0f0",
            color: activeTab === "order" ? "#fff" : "#000",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
            marginRight: "10px",
          }}
        >
          발주서
        </button>
        <button
          onClick={() => setActiveTab("quotation_request")}
          style={{
            padding: "10px 20px",
            backgroundColor:
              activeTab === "quotation_request" ? "#007bff" : "#f0f0f0",
            color: activeTab === "quotation_request" ? "#fff" : "#000",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
          }}
        >
          견적의뢰서
        </button>
      </div>

      {loading ? (
        <p>문서를 불러오는 중...</p>
      ) : (
        <>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              marginBottom: "20px",
            }}
          >
            <thead>
              <tr>
                <th style={{ border: "1px solid #ccc", padding: "10px" }}>
                  작성 날짜
                </th>
                <th style={{ border: "1px solid #ccc", padding: "10px" }}>
                  문서 번호
                </th>
                <th style={{ border: "1px solid #ccc", padding: "10px" }}>
                  의뢰자
                </th>
                <th style={{ border: "1px solid #ccc", padding: "10px" }}>
                  담당자
                </th>
                <th style={{ border: "1px solid #ccc", padding: "10px" }}>
                  총금액
                </th>
                <th style={{ border: "1px solid #ccc", padding: "10px" }}>
                  액션
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredDocuments.map((doc) => (
                <tr key={doc.id}>
                  <td style={{ border: "1px solid #ccc", padding: "10px" }}>
                    {dayjs(doc.created_at).format("YYYY-MM-DD")}
                  </td>
                  <td style={{ border: "1px solid #ccc", padding: "10px" }}>
                    {doc.document_number || "N/A"}
                  </td>
                  <td style={{ border: "1px solid #ccc", padding: "10px" }}>
                    {contacts[doc.contact_id] || "N/A"}
                  </td>
                  <td style={{ border: "1px solid #ccc", padding: "10px" }}>
                    {users[doc.user_id] || "N/A"}
                  </td>
                  <td style={{ border: "1px solid #ccc", padding: "10px" }}>
                    ₩ {doc.content?.total_amount?.toLocaleString() || "0"}
                  </td>
                  <td style={{ border: "1px solid #ccc", padding: "10px" }}>
                    <button
                      onClick={() => handleOpenDocument(doc.id)}
                      style={{
                        padding: "8px 16px",
                        backgroundColor: "#007bff",
                        color: "#fff",
                        border: "none",
                        borderRadius: "5px",
                        cursor: "pointer",
                        marginRight: "5px",
                      }}
                    >
                      보기
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}
