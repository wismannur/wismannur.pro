type TWismanNurLogoProps = {
  className?: string;
};

const WismanNurLogo = ({ className }: TWismanNurLogoProps) => {
  return (
    <svg
      width="800"
      height="400"
      viewBox="0 0 800 400"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Left angle bracket < */}
      <path
        d="M160 120L80 200L160 280"
        stroke="#6B7280"
        strokeWidth="40"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Letter W */}
      <path
        d="M230 120L290 280L350 120L410 280L470 120"
        stroke="#0EA5E9"
        strokeWidth="40"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Forward slash / */}
      <path
        d="M520 280L570 120"
        stroke="#6B7280"
        strokeWidth="40"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Right angle bracket > */}
      <path
        d="M640 120L720 200L640 280"
        stroke="#6B7280"
        strokeWidth="40"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default WismanNurLogo;
