type TitleAnalysisLike = {
  algorithm_name?: string | null;
  pseudocode?: string[] | null;
  algorithm_steps?: string[] | null;
};

const toTitleCase = (value: string) =>
  value
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

export const isWeakSessionTitle = (title: string | null | undefined) => {
  if (!title) {
    return true;
  }

  const trimmed = title.trim();
  if (!trimmed) {
    return true;
  }

  if (trimmed.length > 72) {
    return true;
  }

  if (/[{}[\];=>]/.test(trimmed)) {
    return true;
  }

  if (/^(const|let|var|function|class|def|print|console\.log|if|for|while)\b/i.test(trimmed)) {
    return true;
  }

  return false;
};

export const deriveSessionTitle = (
  code: string,
  analysisData?: TitleAnalysisLike | null
) => {
  const algorithmName =
    typeof analysisData?.algorithm_name === "string"
      ? analysisData.algorithm_name.trim()
      : "";

  if (algorithmName) {
    return algorithmName.slice(0, 80);
  }

  const pseudocodeLines = analysisData?.pseudocode?.filter(
    (line): line is string => typeof line === "string" && line.trim().length > 0
  ) ?? [];
  const functionLine = pseudocodeLines.find((line) => /^FUNCTION\s+/i.test(line));

  if (functionLine) {
    const match = functionLine.match(/^FUNCTION\s+([A-Za-z0-9_ ]+)/i);
    const candidate = match?.[1]?.replace(/\s+/g, " ").trim();
    if (candidate) {
      return toTitleCase(candidate.replace(/_/g, " "));
    }
  }

  const firstStep = analysisData?.algorithm_steps?.find(
    (step): step is string => typeof step === "string" && step.trim().length > 0
  );

  if (firstStep) {
    const cleaned = firstStep
      .replace(/^step\s*\d+[:.)-]?\s*/i, "")
      .replace(/\b(return|initialize|set|add|loop through|iterate through)\b/gi, "")
      .replace(/\s+/g, " ")
      .trim();

    if (cleaned) {
      return cleaned.charAt(0).toUpperCase() + cleaned.slice(1, 70);
    }
  }

  const firstLine = code.split("\n").find((line) => line.trim().length > 0);
  return firstLine ? firstLine.trim().slice(0, 80) : "Untitled session";
};

export const resolveSessionTitle = ({
  code,
  preferredTitle,
  analysisData,
}: {
  code: string;
  preferredTitle?: string | null;
  analysisData?: TitleAnalysisLike | null;
}) => {
  if (!isWeakSessionTitle(preferredTitle)) {
    return preferredTitle!.trim();
  }

  return deriveSessionTitle(code, analysisData);
};
