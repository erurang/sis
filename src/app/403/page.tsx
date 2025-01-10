export default function ForbiddenPage() {
  return (
    <div style={{ textAlign: "center", padding: "50px" }}>
      <h1>403 - 권한 없음</h1>
      <p>이 페이지에 접근할 권한이 없습니다.</p>
      <a href="/">홈으로 돌아가기</a>
    </div>
  );
}
