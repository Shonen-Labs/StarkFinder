interface DropdownArrowIconProps {
  status: string;
}
const DropdownArrowIcon = ({ status }: DropdownArrowIconProps) => {
  if (status === "closed") {
    return (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M7 9L12.1429 15L17.2857 9"
          stroke="#141414"
          stroke-opacity="0.32"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (status === "open") {
    return (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M7 15L12.1429 9L17.2857 15"
          stroke="#141414"
          stroke-opacity="0.32"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
};

export default DropdownArrowIcon;
