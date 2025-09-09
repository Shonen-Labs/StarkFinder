export function Crosshair(): JSX.Element {
  return (
    <div
      style={{
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        zIndex: 2000,
        pointerEvents: "none", // Allow clicks to pass through
        color: "white",
        fontSize: "20px",
        fontWeight: "bold",
        textShadow: "2px 2px 4px rgba(0,0,0,0.8)",
        userSelect: "none",
      }}
    >
      <div
        style={{
          position: "relative",
          width: "20px",
          height: "20px",
        }}
      >
        {/* Horizontal line */}
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "0",
            width: "20px",
            height: "2px",
            backgroundColor: "white",
            transform: "translateY(-50%)",
            boxShadow: "0 0 4px rgba(0,0,0,0.8)",
          }}
        />
        {/* Vertical line */}
        <div
          style={{
            position: "absolute",
            top: "0",
            left: "50%",
            width: "2px",
            height: "20px",
            backgroundColor: "white",
            transform: "translateX(-50%)",
            boxShadow: "0 0 4px rgba(0,0,0,0.8)",
          }}
        />
        {/* Center dot */}
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            width: "4px",
            height: "4px",
            backgroundColor: "white",
            borderRadius: "50%",
            transform: "translate(-50%, -50%)",
            boxShadow: "0 0 4px rgba(0,0,0,0.8)",
          }}
        />
      </div>
    </div>
  );
}
