export function normalizeAnswer(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim()
    .toLocaleLowerCase("pt-BR")
    .replace(/\s+/g, " ");
}

export function normalizeCode(value) {
  return normalizeAnswer(value)
    .replaceAll("←", "<-")
    .replaceAll(":=", "=")
    .replace(/[;:\s]/g, "");
}

export function answerMatches(inputType, answer, acceptedAnswers) {
  const normalize = inputType === "code" ? normalizeCode : normalizeAnswer;
  const candidate = normalize(answer);
  return Array.isArray(acceptedAnswers) &&
    acceptedAnswers.some((accepted) => normalize(accepted) === candidate);
}
