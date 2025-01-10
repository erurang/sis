"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

// 상담 데이터 타입 정의
interface Consultation {
  id: string;
  date: string;
  content: string;
  status: string;
  follow_up_date: string | null;
  priority: string;
  contact_id: string;
  user_id: string;
  created_at: string;
}

interface Contact {
  id: string;
  contact_name: string;
  email: string;
  level: string;
}

interface User {
  id: string;
  name: string;
  level: string;
}

interface Company {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  fax: string;
  notes: string | null;
}

export default function ConsultationsPage() {
  const [company, setCompany] = useState<Company | null>(null); // 회사 정보 상태
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [totalConsultations, setTotalConsultations] = useState(0); // 전체 게시글 수
  // 기존 상태들 유지
  const [showAddConsultationModal, setShowAddConsultationModal] =
    useState(false); // 모달 상태 추가

  // 모달 열기/닫기 함수
  const openAddConsultationModal = () => setShowAddConsultationModal(true);
  const closeAddConsultationModal = () => setShowAddConsultationModal(false);

  const [newConsultation, setNewConsultation] = useState({
    date: new Date().toISOString().split("T")[0], // 기본값: 오늘 날짜
    content: "",
    status: "pending", // 기본값: pending
    follow_up_date: "",
    priority: "medium", // 기본값: medium
    contact_id: "",
    user_id: "",
  });

  const [newContact, setNewContact] = useState({
    contact_name: "",
    department: "",
    mobile: "",
    email: "",
    level: "",
  });

  const [showAddContact, setShowAddContact] = useState(false);
  const [loading, setLoading] = useState(false);
  const { id } = useParams(); // 회사 ID 가져오기
  const router = useRouter();

  const [currentPage, setCurrentPage] = useState(1); // 현재 페이지
  const limit = 5; // 한 페이지에 보여줄 상담 내역 수

  const [tempNotes, setTempNotes] = useState<string>(""); // notes 임시 상태

  // 현재 수정 중인 content ID와 내용 상태
  const [editingContentId, setEditingContentId] = useState<string | null>(null);
  const [tempContent, setTempContent] = useState("");

  // 회사 정보 불러오기
  const fetchCompany = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("companies")
        .select("*")
        .eq("id", id)
        .single(); // 단일 데이터 가져오기

      console.log("data", data);
      if (error) throw error;
      setCompany(data as Company);
      setTempNotes(data.notes || ""); // notes 초기화
    } catch (error) {
      console.error("회사 정보 가져오기 실패:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateCompanyNotes = async () => {
    try {
      const { error } = await supabase
        .from("companies")
        .update({ notes: tempNotes })
        .eq("id", id);

      if (error) throw error;

      // 업데이트 성공 시 상태 갱신
      setCompany((prev) => (prev ? { ...prev, notes: tempNotes } : prev));
    } catch (error) {
      console.error("회사 노트 업데이트 실패:", error);
    }
  };

  const updateConsultationField = async (
    id: string,
    field: "status" | "priority" | "follow_up_date" | "content",
    value: string
  ) => {
    try {
      const { error } = await supabase
        .from("consultations")
        .update({ [field]: value })
        .eq("id", id);
      if (error) throw error;

      // UI 업데이트
      setConsultations((prev) =>
        prev.map((consultation) =>
          consultation.id === id
            ? { ...consultation, [field]: value }
            : consultation
        )
      );
    } catch (error) {
      console.error(`${field} 업데이트 실패:`, error);
    }
  };

  // useEffect에서 fetchConsultations 초기 호출
  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      try {
        // 로그인된 사용자 정보 가져오기
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          setNewConsultation((prev) => ({
            ...prev,
            user_id: user.id,
          }));
        }

        // 데이터 불러오기
        await fetchCompany();
        fetchConsultations();
        const { data: contactsData } = await supabase
          .from("contacts")
          .select("id, contact_name, email, level")
          .eq("company_id", id);

        console.log("contactsData", contactsData);
        setContacts(contactsData as Contact[]);

        const { data: usersData } = await supabase
          .from("users")
          .select("id, name, level");

        console.log("usersdata", usersData);
        setUsers(usersData as User[]);
      } catch (error) {
        console.error("데이터 가져오기 실패:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [id]);

  useEffect(() => {
    fetchConsultations();
  }, [currentPage]);

  const handleAddConsultation = async () => {
    const { content, contact_id, user_id, follow_up_date } = newConsultation;

    if (!content.trim() || !contact_id || !user_id) {
      alert("상담 내용, 담당자, 상담자를 선택하세요.");
      return;
    }

    const { error } = await supabase.from("consultations").insert({
      ...newConsultation,
      follow_up_date: follow_up_date || null, // 빈 문자열 대신 null로 설정
      company_id: id,
    });

    if (error) {
      console.error("상담 추가 실패:", error);
    } else {
      fetchConsultations(); // 상담 내역 갱신
      setNewConsultation({
        date: new Date().toISOString().split("T")[0],
        content: "",
        status: "pending",
        follow_up_date: "",
        priority: "medium",
        contact_id: "",
        user_id: "",
      });
      setShowAddConsultationModal(false);
    }
  };
  // 상담 내역 불러오는 함수
  const fetchConsultations = async () => {
    setLoading(true);
    try {
      // 전체 게시글 수 계산
      const { count: total } = await supabase
        .from("consultations")
        .select("*", { count: "exact" })
        .eq("company_id", id);
      setTotalConsultations(total || 0);

      const offset = (currentPage - 1) * limit;
      const { data, error } = await supabase
        .from("consultations")
        .select("*")
        .eq("company_id", id)
        .order("created_at", { ascending: false }) // 최신순
        .range(offset, offset + limit - 1);

      if (error) throw error;
      setConsultations(data || []);
    } catch (error) {
      console.error("상담 내역 불러오기 실패:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleContentEdit = (id: string, currentContent: string) => {
    setEditingContentId(id);
    setTempContent(currentContent);
  };

  const handleContentSave = (id: string) => {
    updateConsultationField(id, "content", tempContent);
    setEditingContentId(null); // 편집 모드 종료
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => prev + 1);
  };

  const handlePreviousPage = () => {
    setCurrentPage((prev) => (prev > 1 ? prev - 1 : prev));
  };

  const handleAddContact = async () => {
    if (!newContact.contact_name || !newContact.email) {
      alert("의뢰자명과 이메일을 입력하세요.");
      return;
    }

    try {
      const { data, error } = await supabase
        .from("contacts")
        .insert({
          ...newContact,
          company_id: id,
        })
        .select("*");

      if (error) throw error;

      console.log("contact추가", data);

      setContacts((prev) => [...prev, data[0]]);
      setNewContact({
        contact_name: "",
        department: "",
        mobile: "",
        email: "",
        level: "",
      });
      setShowAddContact(false);
    } catch (error) {
      console.error("의뢰자 추가 실패:", error);
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>상담 내역</h1>

      {/* 회사 정보 표시 */}
      {company && (
        <div
          style={{
            marginBottom: "20px",
            padding: "10px",
            border: "1px solid #ccc",
            borderRadius: "5px",
          }}
        >
          <h2>회사 정보</h2>
          <p>
            <strong>이름:</strong> {company.name}
          </p>
          <p>
            <strong>주소:</strong> {company.address}
          </p>
          <p>
            <strong>전화번호:</strong> {company.phone}
          </p>
          <p>
            <strong>이메일:</strong> {company.email}
          </p>
          <p>
            <strong>팩스:</strong> {company.fax}
          </p>
          <strong>노트:</strong>
          <textarea
            value={tempNotes}
            onChange={(e) => setTempNotes(e.target.value)}
            onBlur={updateCompanyNotes} // blur 이벤트 발생 시 자동 저장
            style={{
              width: "100%",
              height: "100px",
              marginTop: "5px",
              padding: "10px",
              border: "1px solid #ccc",
              borderRadius: "5px",
            }}
          />
        </div>
      )}

      <button
        onClick={openAddConsultationModal}
        style={{
          marginBottom: "10px",
          padding: "10px 20px",
          backgroundColor: "#28a745",
          color: "#fff",
          border: "none",
          borderRadius: "5px",
          cursor: "pointer",
        }}
      >
        새 상담 추가
      </button>
      {loading ? (
        <p>로딩 중...</p>
      ) : (
        <>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={{ border: "1px solid #ccc", padding: "10px" }}>
                  글No
                </th>
                <th style={{ border: "1px solid #ccc", padding: "10px" }}>
                  날짜
                </th>
                <th style={{ border: "1px solid #ccc", padding: "10px" }}>
                  의뢰자
                </th>
                <th style={{ border: "1px solid #ccc", padding: "10px" }}>
                  담당자
                </th>
                <th style={{ border: "1px solid #ccc", padding: "10px" }}>
                  내용
                </th>
                <th style={{ border: "1px solid #ccc", padding: "10px" }}>
                  후속 날짜
                </th>
                <th style={{ border: "1px solid #ccc", padding: "10px" }}>
                  우선순위
                </th>
                <th style={{ border: "1px solid #ccc", padding: "10px" }}>
                  상태
                </th>
                <th style={{ border: "1px solid #ccc", padding: "10px" }}>
                  문서
                </th>
              </tr>
            </thead>
            <tbody>
              {consultations.map((consultation, index) => {
                const globalIndex =
                  totalConsultations - (currentPage - 1) * limit - index;

                return (
                  <tr key={consultation.id}>
                    <td style={{ border: "1px solid #ccc", padding: "10px" }}>
                      {globalIndex}
                    </td>

                    <td style={{ border: "1px solid #ccc", padding: "10px" }}>
                      {consultation.date}
                    </td>
                    <td style={{ border: "1px solid #ccc", padding: "10px" }}>
                      {contacts.find(
                        (contact) => contact.id === consultation.contact_id
                      )
                        ? `${
                            contacts.find(
                              (contact) =>
                                contact.id === consultation.contact_id
                            )?.contact_name
                          } (${
                            contacts.find(
                              (contact) =>
                                contact.id === consultation.contact_id
                            )?.level
                          })`
                        : "알 수 없음"}
                    </td>
                    <td style={{ border: "1px solid #ccc", padding: "10px" }}>
                      {users.find((user) => user.id === consultation.user_id)
                        ? `${
                            users.find(
                              (user) => user.id === consultation.user_id
                            )?.name
                          } (${
                            users.find(
                              (user) => user.id === consultation.user_id
                            )?.level
                          })`
                        : "알 수 없음"}
                    </td>
                    <td style={{ border: "1px solid #ccc", padding: "10px" }}>
                      {editingContentId === consultation.id ? (
                        <textarea
                          value={tempContent}
                          onChange={(e) => setTempContent(e.target.value)}
                          onBlur={() => handleContentSave(consultation.id)}
                          style={{ width: "100%" }}
                        />
                      ) : (
                        <span
                          onClick={() =>
                            handleContentEdit(
                              consultation.id,
                              consultation.content
                            )
                          }
                          style={{ cursor: "pointer" }}
                        >
                          {consultation.content}
                        </span>
                      )}
                    </td>
                    <td style={{ border: "1px solid #ccc", padding: "10px" }}>
                      <input
                        type="date"
                        value={consultation.follow_up_date || ""}
                        onChange={(e) =>
                          updateConsultationField(
                            consultation.id,
                            "follow_up_date",
                            e.target.value
                          )
                        }
                      />
                    </td>
                    <td style={{ border: "1px solid #ccc", padding: "10px" }}>
                      <select
                        value={consultation.priority}
                        onChange={(e) =>
                          updateConsultationField(
                            consultation.id,
                            "priority",
                            e.target.value
                          )
                        }
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </select>
                    </td>
                    <td style={{ border: "1px solid #ccc", padding: "10px" }}>
                      <select
                        value={consultation.status}
                        onChange={(e) =>
                          updateConsultationField(
                            consultation.id,
                            "status",
                            e.target.value
                          )
                        }
                      >
                        <option value="pending">Pending</option>
                        <option value="completed">Completed</option>
                        <option value="canceled">Canceled</option>
                      </select>
                    </td>
                    <td style={{ border: "1px solid #ccc", padding: "10px" }}>
                      <button
                        onClick={() =>
                          window.open(
                            `/documents/consultations/${consultation.id}`,
                            "_blank",
                            "width=800,height=600,noopener,noreferrer"
                          )
                        }
                        style={{
                          padding: "8px 16px",
                          backgroundColor: "#007bff",
                          color: "#fff",
                          border: "none",
                          borderRadius: "5px",
                          cursor: "pointer",
                        }}
                      >
                        보기
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div style={{ marginTop: "20px", display: "flex", gap: "10px" }}>
            <button
              onClick={handlePreviousPage}
              disabled={currentPage === 1}
              style={{
                padding: "10px 20px",
                backgroundColor: "#f0f0f0",
                border: "1px solid #ccc",
                cursor: currentPage === 1 ? "not-allowed" : "pointer",
              }}
            >
              이전 페이지
            </button>
            <button
              onClick={handleNextPage}
              style={{
                padding: "10px 20px",
                backgroundColor: "#f0f0f0",
                border: "1px solid #ccc",
                cursor: "pointer",
              }}
            >
              다음 페이지
            </button>
          </div>
        </>
      )}

      <div>
        {/* 모달 */}
        {showAddConsultationModal && (
          <div
            style={{
              position: "fixed",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              backgroundColor: "white",
              padding: "20px",
              boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
              borderRadius: "8px",
              zIndex: 1000,
            }}
          >
            <h2>새 상담 추가</h2>
            <div>
              <label>날짜:</label>
              <input
                type="date"
                value={newConsultation.date}
                onChange={(e) =>
                  setNewConsultation((prev) => ({
                    ...prev,
                    date: e.target.value,
                  }))
                }
                style={{
                  display: "block",
                  width: "100%",
                  marginBottom: "10px",
                }}
              />
              <label>의뢰자:</label>
              <select
                value={newConsultation.contact_id}
                onChange={(e) =>
                  setNewConsultation((prev) => ({
                    ...prev,
                    contact_id: e.target.value,
                  }))
                }
                style={{
                  display: "block",
                  width: "100%",
                  marginBottom: "10px",
                }}
              >
                <option value="">의뢰자를 선택하세요</option>
                {contacts.map((contact) => (
                  <option key={contact.id} value={contact.id}>
                    {contact.contact_name} ({contact.email})
                  </option>
                ))}
              </select>
              <label>담당자:</label>
              <select
                value={newConsultation.user_id}
                onChange={(e) =>
                  setNewConsultation((prev) => ({
                    ...prev,
                    user_id: e.target.value,
                  }))
                }
                style={{
                  display: "block",
                  width: "100%",
                  marginBottom: "10px",
                }}
              >
                <option value="">담당자를 선택하세요</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name} ({user.level})
                  </option>
                ))}
              </select>
              <button
                onClick={() => setShowAddContact((prev) => !prev)}
                style={{
                  marginBottom: "10px",
                  padding: "10px",
                  backgroundColor: "#007bff",
                  color: "#fff",
                  border: "none",
                  borderRadius: "5px",
                  cursor: "pointer",
                }}
              >
                의뢰자 추가
              </button>

              {showAddContact && (
                <div
                  style={{
                    marginTop: "20px",
                    padding: "20px",
                    border: "1px solid #ccc",
                    borderRadius: "8px",
                    backgroundColor: "#f9f9f9",
                  }}
                >
                  <h3>새 의뢰자 정보</h3>
                  <div
                    style={{
                      display: "flex",
                      gap: "20px",
                      marginBottom: "20px",
                      alignItems: "center",
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <label>의뢰자명:</label>
                      <input
                        type="text"
                        value={newContact.contact_name}
                        onChange={(e) =>
                          setNewContact((prev) => ({
                            ...prev,
                            contact_name: e.target.value,
                          }))
                        }
                        style={{
                          display: "block",
                          width: "100%",
                          marginBottom: "10px",
                          padding: "8px",
                          border: "1px solid #ccc",
                          borderRadius: "4px",
                        }}
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label>부서:</label>
                      <input
                        type="text"
                        value={newContact.department}
                        onChange={(e) =>
                          setNewContact((prev) => ({
                            ...prev,
                            department: e.target.value,
                          }))
                        }
                        style={{
                          display: "block",
                          width: "100%",
                          marginBottom: "10px",
                          padding: "8px",
                          border: "1px solid #ccc",
                          borderRadius: "4px",
                        }}
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label>직급:</label>
                      <input
                        type="text"
                        value={newContact.level}
                        onChange={(e) =>
                          setNewContact((prev) => ({
                            ...prev,
                            level: e.target.value,
                          }))
                        }
                        style={{
                          display: "block",
                          width: "100%",
                          marginBottom: "10px",
                          padding: "8px",
                          border: "1px solid #ccc",
                          borderRadius: "4px",
                        }}
                      />
                    </div>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      gap: "20px",
                      alignItems: "center",
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <label>전화번호:</label>
                      <input
                        type="text"
                        value={newContact.mobile}
                        onChange={(e) =>
                          setNewContact((prev) => ({
                            ...prev,
                            mobile: e.target.value,
                          }))
                        }
                        style={{
                          display: "block",
                          width: "100%",
                          marginBottom: "10px",
                          padding: "8px",
                          border: "1px solid #ccc",
                          borderRadius: "4px",
                        }}
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label>이메일:</label>
                      <input
                        type="email"
                        value={newContact.email}
                        onChange={(e) =>
                          setNewContact((prev) => ({
                            ...prev,
                            email: e.target.value,
                          }))
                        }
                        style={{
                          display: "block",
                          width: "100%",
                          marginBottom: "10px",
                          padding: "8px",
                          border: "1px solid #ccc",
                          borderRadius: "4px",
                        }}
                      />
                    </div>
                  </div>
                  <div style={{ textAlign: "center", marginTop: "20px" }}>
                    <button
                      onClick={handleAddContact}
                      style={{
                        padding: "10px 20px",
                        backgroundColor: "#007bff",
                        color: "#fff",
                        border: "none",
                        borderRadius: "5px",
                        cursor: "pointer",
                      }}
                    >
                      추가
                    </button>
                  </div>
                </div>
              )}
              <label>내용:</label>
              <textarea
                value={newConsultation.content}
                onChange={(e) =>
                  setNewConsultation((prev) => ({
                    ...prev,
                    content: e.target.value,
                  }))
                }
                style={{
                  display: "block",
                  width: "100%",
                  marginBottom: "10px",
                }}
              />
              <label>우선순위:</label>
              <select
                value={newConsultation.priority}
                onChange={(e) =>
                  setNewConsultation((prev) => ({
                    ...prev,
                    priority: e.target.value,
                  }))
                }
                style={{
                  display: "block",
                  width: "100%",
                  marginBottom: "10px",
                }}
              >
                <option value="low">낮음</option>
                <option value="medium">보통</option>
                <option value="high">높음</option>
              </select>
              <label>후속 날짜:</label>
              <input
                type="date"
                value={newConsultation.follow_up_date || ""}
                onChange={(e) =>
                  setNewConsultation((prev) => ({
                    ...prev,
                    follow_up_date: e.target.value,
                  }))
                }
                style={{
                  display: "block",
                  width: "100%",
                  marginBottom: "10px",
                }}
              />

              <button
                onClick={handleAddConsultation} // handleAddConsultation 함수 호출
                style={{
                  padding: "10px 20px",
                  backgroundColor: "#007bff",
                  color: "#fff",
                  border: "none",
                  borderRadius: "5px",
                  cursor: "pointer",
                }}
              >
                저장
              </button>
              <button
                onClick={closeAddConsultationModal}
                style={{
                  marginLeft: "10px",
                  padding: "10px 20px",
                  backgroundColor: "#dc3545",
                  color: "#fff",
                  border: "none",
                  borderRadius: "5px",
                  cursor: "pointer",
                }}
              >
                닫기
              </button>
            </div>
          </div>
        )}

        {/* 모달 배경 */}
        {showAddConsultationModal && (
          <div
            onClick={closeAddConsultationModal}
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              backgroundColor: "rgba(0, 0, 0, 0.5)",
              zIndex: 999,
            }}
          ></div>
        )}
      </div>
    </div>
  );
}
