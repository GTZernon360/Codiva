import test from "node:test";
import assert from "node:assert/strict";
import { answerMatches, normalizeAnswer, normalizeCode } from "./answer-utils.ts";

test("normalizes accents, case, and repeated whitespace for text answers", () => {
  assert.equal(normalizeAnswer("  LÓGICA   de Programação "), "logica de programacao");
  assert.equal(answerMatches("short", "  VERDADEIRO ", ["verdadeiro"]), true);
});

test("matches multiple-choice answers exactly after normalization", () => {
  assert.equal(answerMatches("choice", "b", ["a", "b", "c"]), true);
  assert.equal(answerMatches("choice", "d", ["a", "b", "c"]), false);
});

test("matches pseudocode with arrow, colon, and formatting differences", () => {
  const starter = `se usuario_ativo e responsavel:
  permita_editar ← verdadeiro
senão:
  permita_editar ← falso`;
  const accepted = "se usuario_ativo e responsavel: permita_editar <- verdadeiro; senão: permita_editar <- falso";

  assert.equal(normalizeCode(starter), normalizeCode(accepted));
  assert.equal(answerMatches("code", starter, [accepted]), true);
});
