"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import Modal from "@/components/Modal";
import CompanyAddForm from "@/components/CompanyAddForm";

// Company 타입 정의
interface Company {
  id: string;
  name: string;
}

export default function HomePage() {
  const [companyName, setCompanyName] = useState<string>(""); // 검색창 입력값
  const [searchResults, setSearchResults] = useState<Company[]>([]); // 검색 결과
  const [showDropdown, setShowDropdown] = useState<boolean>(false); // 드롭다운 표시 여부
  const [showModal, setShowModal] = useState<boolean>(false); // 회사 추가 모달 표시 여부
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null); // 입력창 위치 참조

  // 회사 검색 함수
  useEffect(() => {
    const fetchCompanies = async () => {
      if (companyName.trim() === "") {
        setSearchResults([]);
        setShowDropdown(false);
        return;
      }

      const { data, error } = await supabase
        .from("companies")
        .select("id, name")
        .ilike("name", `%${companyName}%`); // 부분 검색

      if (error) {
        console.error("회사 검색 실패:", error);
        return;
      }

      setSearchResults(data as Company[]);
      setShowDropdown(data.length > 0); // 결과가 있을 때만 드롭다운 표시
    };

    fetchCompanies();
  }, [companyName]);

  // 회사 선택 시 이동
  const handleSelectCompany = (companyId: string) => {
    router.push(`/consultations/${companyId}`); // 선택된 회사로 이동
  };

  // 검색 버튼 클릭 시 동작
  const handleSearch = async () => {
    const { data, error } = await supabase
      .from("companies")
      .select("id")
      .eq("name", companyName)
      .single();

    if (error || !data) {
      console.log("회사 없음, 모달 띄우기");
      setShowModal(true); // 모달 표시
    } else {
      router.push(`/consultations/${data.id}`); // 회사로 이동
    }
  };

  return (
    <div style={{ padding: "20px", textAlign: "center", position: "relative" }}>
      <h1>회사 검색</h1>
      <div
        style={{
          position: "relative",
          display: "inline-block",
          width: "300px",
        }}
      >
        <input
          ref={inputRef}
          type="text"
          placeholder="회사명을 입력하세요"
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          style={{
            width: "100%",
            padding: "10px",
            borderRadius: "5px",
            border: "1px solid #ccc",
          }}
        />

        {/* 검색 결과 드롭다운 */}
        {showDropdown && (
          <ul
            style={{
              position: "absolute",
              top: "100%", // 입력창 바로 아래
              left: 0,
              width: "100%",
              margin: 0,
              padding: "10px",
              listStyleType: "none",
              backgroundColor: "white",
              border: "1px solid #ccc",
              borderRadius: "5px",
              boxShadow: "0 2px 10px rgba(0, 0, 0, 0.1)",
              zIndex: 10,
            }}
          >
            {searchResults.map((company) => (
              <li
                key={company.id}
                onClick={() => handleSelectCompany(company.id)}
                style={{
                  padding: "10px",
                  cursor: "pointer",
                  borderBottom: "1px solid #eee",
                }}
              >
                {company.name}
              </li>
            ))}
          </ul>
        )}
      </div>

      <button
        onClick={handleSearch}
        style={{
          marginTop: "10px",
          padding: "10px 20px",
          backgroundColor: "#007bff",
          color: "#fff",
          border: "none",
          borderRadius: "5px",
          cursor: "pointer",
        }}
      >
        검색
      </button>

      {/* 모달 */}
      {showModal && (
        <Modal onClose={() => setShowModal(false)}>
          <CompanyAddForm
            initialCompanyName={companyName}
            onComplete={(companyId) => {
              setShowModal(false);
              router.push(`/consultations/${companyId}`);
            }}
          />
        </Modal>
      )}
    </div>
  );
}
