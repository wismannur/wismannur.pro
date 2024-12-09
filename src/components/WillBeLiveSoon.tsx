import { Typography } from "./ui/typography";

type TWillBeLiveSoonProps = {
  title?: string;
};

const WillBeLiveSoon = ({ title }: TWillBeLiveSoonProps) => {
  return (
    <div className="min-h-[calc(100vh-268px)] flex justify-center items-center">
      <Typography
        variant="h4"
        className="mb-4 bg-gradient-to-r from-blue-500 via-green-500 to-indigo-500 inline-block text-transparent bg-clip-text font-bold"
      >
        {title} - will be live soon.
      </Typography>
    </div>
  );
};

export default WillBeLiveSoon;
