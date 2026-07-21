import { useMutation } from "@tanstack/react-query";
import { parseStatementPdf } from "@/shared/lib/gemini";

/** Lê uma fatura de cartão ou extrato bancário em PDF via Gemini, usado tanto em Cartões quanto em Lançamentos. */
export function useParseStatement() {
  return useMutation({
    mutationFn: (file: File) => parseStatementPdf(file),
  });
}

export function statementImportErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return "Não foi possível ler o documento. Tente novamente.";
}
