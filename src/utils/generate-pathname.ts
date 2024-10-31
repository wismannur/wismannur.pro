import { objectToQueryString } from "./object-to-query-string";

export const generatePathname = ({
  path,
  query,
}: {
  path: string;
  query?: unknown;
}) => {
  if (query) {
    return `${path}?${objectToQueryString(query)}`;
  }
  return path;
};
