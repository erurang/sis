"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

interface Company {
  id: string;
  name: string;
  phone: string;
  fax: string;
  address: string; // 주소 추가
}

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState(""); // 검색어
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const companiesPerPage = 10; // 한 페이지당 회사 수

  useEffect(() => {
    const fetchCompanies = async () => {
      setLoading(true);

      let query = supabase
        .from("companies")
        .select("*", { count: "exact" })
        .order("name", { ascending: true }) // 이름 오름차순 정렬
        .range(
          (currentPage - 1) * companiesPerPage,
          currentPage * companiesPerPage - 1
        );

      if (searchTerm) {
        query = query.ilike("name", `%${searchTerm}%`); // 이름 검색
      }

      const { data, count, error } = await query;

      if (error) {
        console.error("회사 목록 가져오기 실패:", error);
        setLoading(false);
        return;
      }

      setCompanies(data || []);
      setTotalPages(Math.ceil((count || 0) / companiesPerPage));
      setLoading(false);
    };

    fetchCompanies();
  }, [currentPage, searchTerm]);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleRowClick = (companyId: string) => {
    router.push(`/consultations/${companyId}`); // 특정 회사의 상담 페이지로 이동
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>회사 목록</h1>

      {/* 검색 필터 */}
      <div style={{ marginBottom: "20px" }}>
        <input
          type="text"
          placeholder="회사명 검색"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            padding: "10px",
            width: "100%",
            marginBottom: "10px",
            border: "1px solid #ccc",
            borderRadius: "5px",
          }}
        />
      </div>

      {/* 회사 테이블 */}
      {loading ? (
        <p>회사를 불러오는 중...</p>
      ) : (
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            cursor: "pointer",
          }}
        >
          <thead>
            <tr>
              <th style={{ border: "1px solid #ccc", padding: "10px" }}>
                회사명
              </th>
              <th style={{ border: "1px solid #ccc", padding: "10px" }}>
                전화번호
              </th>
              <th style={{ border: "1px solid #ccc", padding: "10px" }}>
                팩스
              </th>
              <th style={{ border: "1px solid #ccc", padding: "10px" }}>
                주소
              </th>
            </tr>
          </thead>
          <tbody>
            {companies.map((company) => (
              <tr
                key={company.id}
                onClick={() => handleRowClick(company.id)} // 클릭 시 상담 페이지로 이동
              >
                <td style={{ border: "1px solid #ccc", padding: "10px" }}>
                  {company.name}
                </td>
                <td style={{ border: "1px solid #ccc", padding: "10px" }}>
                  {company.phone}
                </td>
                <td style={{ border: "1px solid #ccc", padding: "10px" }}>
                  {company.fax}
                </td>
                <td style={{ border: "1px solid #ccc", padding: "10px" }}>
                  {company.address || "N/A"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* 페이지네이션 */}
      <div style={{ marginTop: "20px", textAlign: "center" }}>
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          style={{ marginRight: "10px" }}
        >
          이전
        </button>
        {[...Array(totalPages)].map((_, i) => (
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
        ))}
        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          style={{ marginLeft: "10px" }}
        >
          다음
        </button>
      </div>
    </div>
  );
}
