import { ReactNode } from "react";

const Chip = ({ children }: { children: ReactNode }) => {
  return (
    <span className="px-3 py-1 bg-sky-700 dark:bg-gray-700 text-white rounded-full text-sm">
      {children}
    </span>
  );
};

export default Chip;
