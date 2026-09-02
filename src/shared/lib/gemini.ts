export interface ParsedStatementItem {
  description: string;
  amountCents: number;
  type: "receita" | "despesa";
  date: string | null;
  dueDate: string | null;
  plannedDate: string | null;
  status: "pendente" | "pago" | "recebido";
  priority: "essencial" | "importante" | "flexivel";
  categoryName: string | null;
  cardName: string | null;
  notes: string;
}

export const isGeminiConfigured = Boolean(import.meta.env.VITE_GEMINI_API_KEY);

interface GeminiResponseItem {
  description?: unknown;
  amount?: unknown;
  type?: unknown;
  date?: unknown;
  dueDate?: unknown;
  plannedDate?: unknown;
  status?: unknown;
  priority?: unknown;
  categoryName?: unknown;
  cardName?: unknown;
  notes?: unknown;
}

const RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    items: {
      type: "array",
      items: {
        type: "object",
        properties: {
          description: { type: "string" },
          amount: { type: "number" },
          type: { type: "string", enum: ["receita", "despesa"] },
          date: { type: "string", nullable: true },
          dueDate: { type: "string", nullable: true },
          plannedDate: { type: "string", nullable: true },
          status: { type: "string", enum: ["pendente", "pago", "recebido"] },
          priority: { type: "string", enum: ["essencial", "importante", "flexivel"] },
          categoryName: { type: "string", nullable: true },
          cardName: { type: "string", nullable: true },
          notes: { type: "string" },
        },
        required: ["description", "amount", "type"],
      },
    },
  },
  required: ["items"],
};

const PROMPT = `Você é um assistente financeiro que lê faturas de cartão de crédito e extratos bancários em PDF ou CSV.
Extraia CADA lançamento (linha) do documento anexado. Para cada um, retorne:
- description: o nome/descrição EXATAMENTE como aparece no documento, sem inventar nem resumir.
- amount: o valor em reais (número positivo, use ponto como separador decimal).
- type: "despesa" para compras, cobranças, tarifas, saques e débitos; "receita" para depósitos, transferências recebidas, salário, estornos, créditos e reembolsos.
- date: a data do lançamento no formato AAAA-MM-DD, se existir no documento; caso contrário, null.
- dueDate: vencimento/recebimento no formato AAAA-MM-DD quando estiver explícito; senão use date.
- plannedDate: data recomendada para pagar/receber no formato AAAA-MM-DD; use dueDate quando não houver outra indicação.
- status: use "pago" para despesas já efetivadas, "recebido" para receitas já efetivadas e "pendente" apenas para valores futuros.
- priority: classifique despesas como "essencial", "importante" ou "flexivel"; para receitas use "importante".
- categoryName: sugira uma categoria curta coerente com a descrição; use null se não houver contexto.
- cardName: nome do cartão emissor quando o documento identificar a fatura; caso contrário, null.
- notes: detalhes úteis explicitamente presentes na linha; use texto vazio se não houver.

Ignore linhas que sejam apenas totais, subtotais, cabeçalhos, saldo anterior/atual ou informações que não sejam um lançamento individual.
Responda estritamente no formato JSON definido pelo schema.`;

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(",")[1] ?? "");
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

/** Mensagem amigável exibida ao usuário quando a IA está temporariamente indisponível — nunca expor o erro técnico do Gemini. */
export const GEMINI_UNAVAILABLE_MESSAGE =
  "A inteligência artificial está temporariamente indisponível devido à alta demanda. Tente novamente em alguns instantes.";

const MAX_RETRIES = 3;
const BASE_RETRY_DELAY_MS = 1000;

/** HTTP status considerados indisponibilidade temporária (alta demanda, rate limit, sobrecarga) — vale a pena tentar de novo. */
function isRetryableStatus(status: number): boolean {
  return status === 503 || status === 429 || status === 500 || status === 502 || status === 504;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchGemini(url: string, body: Record<string, unknown>): Promise<Response> {
  try {
    return await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch (error) {
    console.error("Falha de rede ao chamar a API do Gemini", error);
    throw new Error("Não foi possível contatar a API do Gemini. Verifique sua conexão e tente novamente.", { cause: error });
  }
}

// Modelos tentados em ordem. "gemini-flash-latest" é um alias flutuante do Google que, na
// prática, ficou apontando para uma versão/backend sobrecarregado (503 constante em 2026-09),
// enquanto "gemini-3.6-flash" (nome fixo do modelo atual) responde normalmente — por isso ele
// vem primeiro. Mantemos o alias como segunda tentativa: se um dia for o fixo que ficar
// sobrecarregado, ainda tentamos o alias antes de desistir, sem precisar alterar código.
const GEMINI_MODELS = ["gemini-3.6-flash", "gemini-flash-latest"];

/** Chama a API do Gemini direto do navegador (sem backend) e retorna o texto bruto da resposta.
 * Para cada modelo em GEMINI_MODELS, erros temporários (503/429/5xx) acionam retry automático
 * com backoff exponencial (1s, 2s, 4s); se todas as tentativas de um modelo falharem, tenta o
 * próximo modelo da lista antes de desistir e lançar uma mensagem amigável — o erro técnico do
 * Gemini nunca chega à UI. */
async function callGemini(body: Record<string, unknown>): Promise<string> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) throw new Error("Chave do Gemini não configurada (VITE_GEMINI_API_KEY).");

  let response: Response | undefined;
  for (const model of GEMINI_MODELS) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      response = await fetchGemini(url, body);
      if (response.ok || !isRetryableStatus(response.status) || attempt === MAX_RETRIES) break;
      console.warn(`Gemini (${model}) indisponível (status ${response.status}), tentativa ${attempt + 1}/${MAX_RETRIES + 1}...`);
      await sleep(BASE_RETRY_DELAY_MS * 2 ** attempt);
    }
    // response sempre foi atribuída acima: o loop de tentativas roda ao menos uma vez.
    if (response!.ok || !isRetryableStatus(response!.status)) break;
    console.warn(`Gemini (${model}) esgotou as tentativas, tentando o próximo modelo...`);
  }
  // response nunca é undefined aqui: GEMINI_MODELS e o loop de tentativas sempre rodam ao menos uma vez.
  const finalResponse = response!;

  if (!finalResponse.ok) {
    let detail = "";
    try {
      const errorBody = (await finalResponse.json()) as { error?: { message?: string } };
      detail = errorBody.error?.message ?? "";
    } catch {
      /* corpo do erro não veio em JSON — segue sem detalhe extra */
    }
    console.error("Gemini API retornou erro", finalResponse.status, detail);
    if (isRetryableStatus(finalResponse.status)) throw new Error(GEMINI_UNAVAILABLE_MESSAGE);
    throw new Error(
      detail
        ? `Não foi possível processar sua solicitação com a IA (${detail}).`
        : `Não foi possível processar sua solicitação com a IA. Verifique se a chave é válida e se a "Generative Language API" está habilitada no seu projeto.`,
    );
  }

  const payload = (await finalResponse.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  const rawText = payload.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawText) throw new Error("Não foi possível interpretar a resposta do Gemini.");
  return rawText;
}

/** Lê uma fatura de cartão ou extrato bancário em PDF direto do navegador usando a API do Gemini (sem backend). */
function parseGeminiStatementResponse(rawText: string): ParsedStatementItem[] {
  let parsed: { items?: GeminiResponseItem[] };
  try {
    parsed = JSON.parse(rawText);
  } catch {
    throw new Error("A leitura do documento retornou um formato inesperado.");
  }

  return (parsed.items ?? [])
    .map((item): ParsedStatementItem | null => {
      const description = typeof item.description === "string" ? item.description.trim() : "";
      const amount = typeof item.amount === "number" ? item.amount : Number(item.amount);
      const type = item.type === "receita" ? "receita" : item.type === "despesa" ? "despesa" : null;
      const date = typeof item.date === "string" && item.date.length > 0 ? item.date : null;
      const dueDate = typeof item.dueDate === "string" && item.dueDate.length > 0 ? item.dueDate : date;
      const plannedDate = typeof item.plannedDate === "string" && item.plannedDate.length > 0 ? item.plannedDate : dueDate;
      const status = item.status === "pago" || item.status === "recebido" ? item.status : "pendente";
      const priority = item.priority === "essencial" || item.priority === "flexivel" ? item.priority : "importante";
      const categoryName = typeof item.categoryName === "string" && item.categoryName.trim() ? item.categoryName.trim() : null;
      const cardName = typeof item.cardName === "string" && item.cardName.trim() ? item.cardName.trim() : null;
      const notes = typeof item.notes === "string" ? item.notes.trim() : "";

      if (!description || !Number.isFinite(amount) || amount <= 0 || !type) return null;
      return { description, amountCents: Math.round(amount * 100), type, date, dueDate, plannedDate, status, priority, categoryName, cardName, notes };
    })
    .filter((item): item is ParsedStatementItem => item !== null);
}

/** Lê uma fatura ou extrato em PDF/CSV direto do navegador usando a API do Gemini. */
export async function parseStatementFile(file: File): Promise<ParsedStatementItem[]> {
  const extension = file.name.split(".").pop()?.toLowerCase();
  if (extension !== "pdf" && extension !== "csv") throw new Error("Selecione um arquivo PDF ou CSV.");
  const parts: Array<Record<string, unknown>> = [{ text: PROMPT }];
  if (extension === "csv") {
    const csv = await file.text();
    if (!csv.trim()) throw new Error("O arquivo CSV está vazio.");
    parts.push({ text: `Conteúdo do arquivo CSV:\n\n${csv.slice(0, 1_500_000)}` });
  } else {
    const fileBase64 = await fileToBase64(file);
    parts.push({ inline_data: { mime_type: "application/pdf", data: fileBase64 } });
  }
  const rawText = await callGemini({
    contents: [
      {
        role: "user",
        parts,
      },
    ],
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: RESPONSE_SCHEMA,
      temperature: 0.1,
    },
  });

  return parseGeminiStatementResponse(rawText);
}

export const parseStatementPdf = parseStatementFile;

export interface ChatMessage {
  role: "user" | "model";
  text: string;
}

function buildAssistantSystemInstruction(financialContext: string): string {
  return `Você é o assistente financeiro pessoal dentro do app "Planejador Financeiro". Seu único propósito é ajudar o usuário a entender e organizar as próprias finanças, usando os dados fornecidos abaixo.

Regras estritas:
- Responda SOMENTE perguntas sobre as finanças pessoais do usuário, os dados fornecidos, ou como usar o app. Qualquer outro assunto (notícias, programação, cultura geral, opiniões, etc.) você recusa em uma frase curta e educada, sem explicações longas.
- Seja direto e objetivo: no máximo 4 a 5 frases curtas por resposta. Nunca escreva textos longos, introduções ou floreios.
- Os dados abaixo cobrem TODO o histórico de lançamentos do usuário, não apenas o mês atual: use a seção "Totais por categoria em cada mês" para perguntas sobre qualquer mês ou categoria específica, o "Ranking de despesas por categoria em todo o histórico" para "no que eu mais gasto", e a lista de lançamentos para detalhes item a item. Nunca diga que não tem acesso ao histórico completo — ele está todo abaixo.
- Baseie-se exclusivamente nos dados abaixo. Nunca invente números. Se mesmo assim faltar algum dado específico para responder, diga isso claramente em vez de supor.
- Pode sugerir ideias práticas (cortar gastos de uma categoria, priorizar uma meta, etc.), sempre ancoradas nos números reais do usuário abaixo.
- Responda em português do Brasil, em texto simples (sem markdown, sem asteriscos, sem listas com marcadores).

=== DADOS FINANCEIROS DO USUÁRIO (gerados agora) ===
${financialContext}
=== FIM DOS DADOS ===`;
}

/** Envia uma mensagem ao assistente financeiro, com os dados do usuário como contexto e o histórico da conversa. */
export async function sendAssistantMessage(financialContext: string, history: ChatMessage[]): Promise<string> {
  const rawText = await callGemini({
    systemInstruction: { role: "system", parts: [{ text: buildAssistantSystemInstruction(financialContext) }] },
    contents: history.map((message) => ({ role: message.role, parts: [{ text: message.text }] })),
    // maxOutputTokens alto de propósito: o modelo usado gasta ~500 tokens de "pensamento"
    // interno (que contam nesse limite) antes de escrever a resposta visível. Um limite
    // baixo cortava a resposta no meio da frase. A concisão da resposta é garantida pela
    // instrução no prompt, não por este limite.
    generationConfig: { temperature: 0.4, maxOutputTokens: 1024 },
  });
  return rawText.trim();
}
