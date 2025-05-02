interface ToggleBtnProps {
  mode: string;
  onClick: () => void;
}

const ToggleBtn = ({ mode, onClick }: ToggleBtnProps) => {
  if (mode === "on") {
    return (
      <button onClick={onClick}>
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect
            x="2.75"
            y="5.75"
            width="18.5"
            height="13.5"
            rx="6.75"
            stroke="#297E71"
            strokeWidth="1.5"
          />
          <circle cx="14.5" cy="12.5" r="4.5" fill="#297E71" />
        </svg>{" "}
      </button>
    );
  }

  if (mode === "off") {
    return (
      <button onClick={onClick}>
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect
            x="2.75"
            y="5.75"
            width="18.5"
            height="13.5"
            rx="6.75"
            stroke="#131313"
            stroke-opacity="0.4"
            strokeWidth="1.5"
          />
          <circle
            cx="9.5"
            cy="12.5"
            r="4.5"
            fill="#131313"
            fill-opacity="0.4"
          />
        </svg>
      </button>
    );
  }
};

export default ToggleBtn;
