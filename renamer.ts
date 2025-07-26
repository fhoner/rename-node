import { RenameData } from "./model";

const variableMatchRegex = /%(\w+)%/g;
const safePathRegex = /[\/\\:*?"<>|]/g;

export const renameFile = (
  input: string,
  data: { timestamp: string; geo: RenameData },
): string => {
  const matches = [...input.matchAll(variableMatchRegex)].map(
    (match) => match[1],
  );
  input = input.replace("%timestamp%", data.timestamp);
  return matches
    .reduce(
      // @ts-ignore
      (acc, curr) => acc.replace(`%${curr}%`, data.geo[curr] ?? ""),
      input,
    )
    .trim()
    .replace(safePathRegex, "-");
};
