import { useMutation } from "@tanstack/react-query";
import { parseStatementFile } from "@/shared/lib/gemini";

/** Lê uma fatura ou extrato em PDF/CSV via Gemini, usado tanto em Cartões quanto em Lançamentos. */
export function useParseStatement() {
  return useMutation({
    mutationFn: (file: File) => parseStatementFile(file),
  });
}

export function statementImportErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return "Não foi possível ler o documento. Tente novamente.";
}
