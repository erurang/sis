export default function Modal({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div
        style={{
          backgroundColor: "white",
          padding: "20px",
          borderRadius: "5px",
          boxShadow: "0 2px 10px rgba(0, 0, 0, 0.1)",
          minWidth: "400px",
        }}
      >
        {children}
        <button onClick={onClose} style={{ marginTop: "10px" }}>
          닫기
        </button>
      </div>
    </div>
  );
}
