import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function CompanyAddForm({
  initialCompanyName,
  onComplete,
}: {
  initialCompanyName: string;
  onComplete: (companyId: string) => void;
}) {
  const [companyName, setCompanyName] = useState(initialCompanyName || "");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [fax, setFax] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");

  // 담당자 입력 필드 상태
  const [managerName, setManagerName] = useState("");
  const [department, setDepartment] = useState("");
  const [position, setPosition] = useState("");
  const [mobile, setMobile] = useState("");
  const [managerEmail, setManagerEmail] = useState("");

  // 추가된 담당자 리스트
  const [managers, setManagers] = useState<
    {
      contact_name: string;
      department: string;
      position: string;
      mobile: string;
      email: string;
    }[]
  >([]);

  // 담당자 추가 기능
  const handleAddManager = () => {
    if (!managerName || !managerEmail || !mobile) {
      alert("담당자명, 전화번호, 이메일은 필수입니다.");
      return;
    }

    setManagers([
      ...managers,
      {
        contact_name: managerName,
        department,
        position,
        mobile,
        email: managerEmail,
      },
    ]);

    // 입력 필드 초기화
    setManagerName("");
    setDepartment("");
    setPosition("");
    setMobile("");
    setManagerEmail("");
  };

  // 회사 및 모든 담당자 저장
  const handleSave = async () => {
    // 회사 추가
    const { data: companyData, error: companyError } = await supabase
      .from("companies")
      .insert({ name: companyName, address, phone, fax, email, notes })
      .select("id")
      .single();

    if (companyError || !companyData) {
      console.error("회사 추가 실패:", companyError);
      return;
    }

    const companyId = companyData.id;

    // 모든 담당자 추가
    const managerPromises = managers.map((manager) =>
      supabase.from("contacts").insert({
        contact_name: manager.contact_name,
        department: manager.department,
        position: manager.position,
        mobile: manager.mobile,
        email: manager.email,
        company_id: companyId,
      })
    );

    const managerResults = await Promise.all(managerPromises);
    const managerErrors = managerResults.filter((result) => result.error);

    if (managerErrors.length > 0) {
      console.error("일부 담당자 추가 실패:", managerErrors);
    }

    // 완료 후 상담 페이지로 이동
    onComplete(companyId);
  };

  return (
    <div>
      <h2>새 회사 및 담당자 추가</h2>

      {/* 회사 정보 입력 */}
      <div>
        <label>회사명:</label>
        <input
          type="text"
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          style={{ width: "100%", marginBottom: "10px" }}
        />
      </div>
      <div>
        <label>주소:</label>
        <input
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          style={{ width: "100%", marginBottom: "10px" }}
        />
      </div>
      <div>
        <label>전화번호:</label>
        <input
          type="text"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          style={{ width: "100%", marginBottom: "10px" }}
        />
      </div>
      <div>
        <label>팩스:</label>
        <input
          type="text"
          value={fax}
          onChange={(e) => setFax(e.target.value)}
          style={{ width: "100%", marginBottom: "10px" }}
        />
      </div>
      <div>
        <label>이메일:</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ width: "100%", marginBottom: "10px" }}
        />
      </div>
      <div>
        <label>주의사항:</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          style={{ width: "100%", marginBottom: "10px" }}
        />
      </div>

      <hr style={{ margin: "20px 0" }} />

      {/* 담당자 정보 입력 */}
      <h3>담당자 추가</h3>
      <div>
        <label>담당자명:</label>
        <input
          type="text"
          value={managerName}
          onChange={(e) => setManagerName(e.target.value)}
          style={{ width: "100%", marginBottom: "10px" }}
        />
      </div>
      <div>
        <label>부서:</label>
        <input
          type="text"
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
          style={{ width: "100%", marginBottom: "10px" }}
        />
      </div>
      <div>
        <label>직급:</label>
        <input
          type="text"
          value={position}
          onChange={(e) => setPosition(e.target.value)}
          style={{ width: "100%", marginBottom: "10px" }}
        />
      </div>
      <div>
        <label>전화번호:</label>
        <input
          type="text"
          value={mobile}
          onChange={(e) => setMobile(e.target.value)}
          style={{ width: "100%", marginBottom: "10px" }}
        />
      </div>
      <div>
        <label>이메일:</label>
        <input
          type="email"
          value={managerEmail}
          onChange={(e) => setManagerEmail(e.target.value)}
          style={{ width: "100%", marginBottom: "10px" }}
        />
      </div>
      <button onClick={handleAddManager} style={{ marginBottom: "20px" }}>
        담당자 추가
      </button>

      <h4>추가된 담당자 리스트</h4>
      <ul>
        {managers.map((manager, index) => (
          <li key={index}>
            {manager.contact_name} ({manager.department} / {manager.position} /{" "}
            {manager.mobile} / {manager.email})
          </li>
        ))}
      </ul>

      <hr style={{ margin: "20px 0" }} />

      <button onClick={handleSave}>저장</button>
    </div>
  );
}
