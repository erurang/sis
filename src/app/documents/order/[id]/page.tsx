"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

interface Contact {
  id: string;
  contact_name: string;
  email: string;
  level: string;
}

interface User {
  id: string;
  name: string;
}

interface Company {
  id: string;
  name: string;
  phone: string;
  fax: string;
}

export default function OrderPage() {
  const { id } = useParams(); // 상담 ID
  const router = useRouter();

  const [company, setCompany] = useState<Company | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedContact, setSelectedContact] = useState(""); // 담당자
  const [selectedUser, setSelectedUser] = useState(""); // 발주자
  const [orderDate, setOrderDate] = useState(
    new Date().toISOString().split("T")[0] // 기본값: 오늘 날짜
  );
  const [deliveryDate, setDeliveryDate] = useState(""); // 납기일자
  const [paymentTerms, setPaymentTerms] = useState("협의"); // 기본값 설정
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState([
    { name: "", spec: "", quantity: 1, unit_price: 0, amount: 0 },
  ]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [koreanAmount, setKoreanAmount] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // consultation_id로 company_id 가져오기
        const { data: consultationData, error: consultationError } =
          await supabase
            .from("consultations")
            .select("company_id")
            .eq("id", id) // 여기서 id는 consultation_id
            .single();

        if (consultationError) throw consultationError;

        const companyId = consultationData.company_id;

        // company_id로 company 정보 가져오기
        const { data: companyData, error: companyError } = await supabase
          .from("companies")
          .select("*")
          .eq("id", companyId)
          .single();

        if (companyError) throw companyError;
        setCompany(companyData); // 회사 정보 상태 업데이트

        // company_id로 의뢰자(contact) 가져오기
        const { data: contactsData, error: contactsError } = await supabase
          .from("contacts")
          .select("id, contact_name, email, level")
          .eq("company_id", companyId);

        if (contactsError) throw contactsError;
        setContacts(contactsData || []);

        // 발주자(users) 가져오기
        const { data: usersData, error: usersError } = await supabase
          .from("users")
          .select("id, name");

        if (usersError) throw usersError;
        setUsers(usersData || []);
      } catch (error) {
        console.error("데이터 가져오기 실패:", error);
      }
    };

    fetchData();
  }, [id]);

  const calculateTotalAmount = () => {
    const total = items.reduce((sum, item) => sum + item.amount, 0);
    setTotalAmount(total);
    setKoreanAmount(numberToKorean(total));
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    setItems((prev) =>
      prev.map((item, i) =>
        i === index
          ? {
              ...item,
              [field]: value,
              amount:
                field === "quantity" || field === "unit_price"
                  ? item.quantity *
                    (field === "unit_price" ? value : item.unit_price)
                  : item.unit_price * item.quantity,
            }
          : item
      )
    );
  };

  const numberToKorean = (num: number): string => {
    const units = ["", "십", "백", "천"];
    const bigUnits = ["", "만", "억", "조", "경"];
    const digits = ["", "일", "이", "삼", "사", "오", "육", "칠", "팔", "구"];
    let result = "";

    let bigUnitIndex = 0;

    while (num > 0) {
      const chunk = num % 10000;
      if (chunk > 0) {
        let chunkResult = "";
        let unitIndex = 0;
        let tempChunk = chunk;

        while (tempChunk > 0) {
          const digit = tempChunk % 10;
          if (digit > 0) {
            chunkResult = `${digits[digit]}${units[unitIndex]}${chunkResult}`;
          }
          tempChunk = Math.floor(tempChunk / 10);
          unitIndex++;
        }

        result = `${chunkResult}${bigUnits[bigUnitIndex]} ${result}`;
      }

      num = Math.floor(num / 10000);
      bigUnitIndex++;
    }

    return result.trim().replace(/일십/g, "십"); // '일십'을 '십'으로 간략화
  };

  const addItem = () => {
    setItems([
      ...items,
      { name: "", spec: "", quantity: 1, unit_price: 0, amount: 0 },
    ]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (
      !selectedContact ||
      !selectedUser ||
      !deliveryDate ||
      totalAmount === 0
    ) {
      alert("담당자, 발주자, 납기일자, 총 금액을 입력하세요.");
      return;
    }

    const content = {
      items: items.map((item, index) => ({
        number: index + 1,
        name: item.name,
        spec: item.spec,
        unit_price: item.unit_price,
        quantity: item.quantity,
        amount: item.unit_price * item.quantity,
      })),
      company_name: company?.name,
      total_amount: totalAmount,
      korean_amount: koreanAmount,
      delivery_date: deliveryDate,
      payment_terms: paymentTerms,
      notes: notes,
    };

    setLoading(true);

    try {
      const { data, error } = await supabase
        .from("documents")
        .insert({
          company_id: company?.id,
          consultation_id: id,
          type: "order",
          content: content,
          file_url: "",
          contact_id: selectedContact,
          user_id: selectedUser,
          created_at: orderDate,
        })
        .select("id");

      if (error) throw error;

      const documentId = data[0].id;

      alert("발주서가 저장되었습니다.");

      // 문서 상세 페이지를 새 창으로 열기
      window.open(
        `/documents/${documentId}`,
        "_blank",
        "width=800,height=600,noopener,noreferrer"
      );

      // 상담 내역 페이지로 이동
      router.push(`/consultations/${company?.id}`);
    } catch (err) {
      console.error("발주서 저장 실패:", err);
      alert("저장에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    calculateTotalAmount();
  }, [items]);

  return (
    <div style={{ padding: "20px" }}>
      <h1>발주서 작성</h1>

      {company && (
        <div
          style={{
            marginBottom: "20px",
            padding: "10px",
            border: "1px solid #ccc",
            borderRadius: "5px",
          }}
        >
          <p>
            <strong>회사명:</strong> {company.name}
          </p>
          <p>
            <strong>전화번호:</strong> {company.phone}
          </p>
          <p>
            <strong>팩스:</strong> {company.fax}
          </p>
        </div>
      )}

      <label>담당자:</label>
      <select
        value={selectedContact}
        onChange={(e) => setSelectedContact(e.target.value)}
        style={{ display: "block", width: "100%", marginBottom: "10px" }}
      >
        <option value="">담당자를 선택하세요</option>
        {contacts.map((contact) => (
          <option key={contact.id} value={contact.id}>
            {contact.contact_name} ({contact.email})
          </option>
        ))}
      </select>

      <label>발주자:</label>
      <select
        value={selectedUser}
        onChange={(e) => setSelectedUser(e.target.value)}
        style={{ display: "block", width: "100%", marginBottom: "10px" }}
      >
        <option value="">발주자를 선택하세요</option>
        {users.map((user) => (
          <option key={user.id} value={user.id}>
            {user.name}
          </option>
        ))}
      </select>

      <label>발주일자:</label>
      <input
        type="date"
        value={orderDate}
        readOnly
        style={{ display: "block", width: "100%", marginBottom: "10px" }}
      />

      <label>납기일자:</label>
      <input
        type="text"
        placeholder="예: 2025-01-30"
        value={deliveryDate}
        onChange={(e) => setDeliveryDate(e.target.value)}
        style={{ display: "block", width: "100%", marginBottom: "10px" }}
      />

      <label>결제방식:</label>
      <select
        value={paymentTerms}
        onChange={(e) => setPaymentTerms(e.target.value)}
        style={{ display: "block", width: "100%", marginBottom: "10px" }}
      >
        <option value="협의">협의</option>
        <option value="정기결제">정기결제</option>
        <option value="선현금결제">선현금결제</option>
      </select>

      <label>특이사항:</label>
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        style={{
          display: "block",
          width: "100%",
          height: "100px",
          marginBottom: "10px",
        }}
      />

      <label>항목:</label>
      {items.map((item, index) => (
        <div
          key={index}
          style={{ display: "flex", gap: "10px", marginBottom: "10px" }}
        >
          <span style={{ alignSelf: "center" }}>{index + 1}</span>
          <input
            type="text"
            placeholder="제품명"
            value={item.name}
            onChange={(e) =>
              setItems((prev) =>
                prev.map((item, i) =>
                  i === index ? { ...item, name: e.target.value } : item
                )
              )
            }
            style={{ flex: 2 }}
          />
          <input
            type="text"
            placeholder="규격"
            value={item.spec}
            onChange={(e) =>
              setItems((prev) =>
                prev.map((item, i) =>
                  i === index ? { ...item, spec: e.target.value } : item
                )
              )
            }
            style={{ flex: 1 }}
          />
          <input
            type="number"
            placeholder="수량"
            value={item.quantity}
            onChange={(e) =>
              setItems((prev) =>
                prev.map((item, i) =>
                  i === index
                    ? {
                        ...item,
                        quantity: Number(e.target.value),
                        amount: item.unit_price * Number(e.target.value),
                      }
                    : item
                )
              )
            }
            style={{ flex: 1 }}
          />
          <input
            type="number"
            placeholder="단가"
            value={item.unit_price}
            onChange={(e) =>
              setItems((prev) =>
                prev.map((item, i) =>
                  i === index
                    ? {
                        ...item,
                        unit_price: Number(e.target.value),
                        amount: Number(e.target.value) * item.quantity,
                      }
                    : item
                )
              )
            }
            style={{ flex: 1 }}
          />
          <input
            type="number"
            placeholder="금액"
            value={item.amount}
            readOnly
            style={{ flex: 1, backgroundColor: "#f0f0f0" }}
          />
          <button
            onClick={() => removeItem(index)}
            style={{
              padding: "5px",
              backgroundColor: "#dc3545",
              color: "#fff",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
            }}
          >
            삭제
          </button>
        </div>
      ))}

      <button
        onClick={addItem}
        style={{
          padding: "10px",
          backgroundColor: "#28a745",
          color: "#fff",
          border: "none",
          borderRadius: "5px",
          cursor: "pointer",
          marginBottom: "20px",
        }}
      >
        항목 추가
      </button>

      <div style={{ marginBottom: "20px" }}>
        <label>총합계:</label>
        <input
          type="text"
          value={`${koreanAmount} 원`}
          readOnly
          style={{
            display: "block",
            width: "100%",
            marginBottom: "10px",
            backgroundColor: "#f0f0f0",
          }}
        />
        <input
          type="text"
          value={`₩ ${totalAmount.toLocaleString()}`}
          readOnly
          style={{
            display: "block",
            width: "100%",
            marginBottom: "10px",
            backgroundColor: "#f0f0f0",
          }}
        />
      </div>

      <button
        onClick={handleSave}
        style={{
          padding: "10px 20px",
          backgroundColor: "#007bff",
          color: "#fff",
          border: "none",
          borderRadius: "5px",
          cursor: "pointer",
          marginRight: "10px",
        }}
        disabled={loading}
      >
        {loading ? "저장 중..." : "저장"}
      </button>

      <button
        onClick={() => router.back()}
        style={{
          padding: "10px 20px",
          backgroundColor: "#dc3545",
          color: "#fff",
          border: "none",
          borderRadius: "5px",
          cursor: "pointer",
        }}
      >
        취소
      </button>
    </div>
  );
}
