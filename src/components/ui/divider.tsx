import clsx from "clsx";

const Divider = () => {
  return (
    <div
      className={clsx(
        "shrink-0 bg-neutral-500 dark:bg-neutral-800 h-[1px] w-full bg-gradient-to-r",
        "from-neutral-300 via-neutral-500 to-neutral-300",
        "dark:from-[#171717] dark:via-[#525252] dark:to-[#171717]"
      )}
    />
  );
};

export default Divider;
