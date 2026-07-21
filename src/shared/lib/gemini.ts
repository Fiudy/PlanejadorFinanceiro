export interface ParsedStatementItem {
  description: string;
  amountCents: number;
  type: "receita" | "despesa";
  date: string | null;
}

export const isGeminiConfigured = Boolean(import.meta.env.VITE_GEMINI_API_KEY);

interface GeminiResponseItem {
  description?: unknown;
  amount?: unknown;
  type?: unknown;
  date?: unknown;
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
        },
        required: ["description", "amount", "type"],
      },
    },
  },
  required: ["items"],
};

const PROMPT = `Você é um assistente financeiro que lê faturas de cartão de crédito e extratos bancários (consolidados) em PDF.
Extraia CADA lançamento (linha) do documento anexado. Para cada um, retorne:
- description: o nome/descrição EXATAMENTE como aparece no documento, sem inventar nem resumir.
- amount: o valor em reais (número positivo, use ponto como separador decimal).
- type: "despesa" para compras, cobranças, tarifas, saques e débitos; "receita" para depósitos, transferências recebidas, salário, estornos, créditos e reembolsos.
- date: a data do lançamento no formato AAAA-MM-DD, se existir no documento; caso contrário, null.

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

/** Chama a API do Gemini direto do navegador (sem backend) e retorna o texto bruto da resposta. */
async function callGemini(body: Record<string, unknown>): Promise<string> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) throw new Error("Chave do Gemini não configurada (VITE_GEMINI_API_KEY).");

  // Alias flutuante mantido pelo Google — evita quebrar quando uma versão específica
  // (ex: gemini-2.5-flash) é descontinuada para chaves novas.
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`;

  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch (error) {
    console.error("Falha de rede ao chamar a API do Gemini", error);
    throw new Error("Não foi possível contatar a API do Gemini. Verifique sua conexão e tente novamente.", { cause: error });
  }

  if (!response.ok) {
    let detail = "";
    try {
      const errorBody = (await response.json()) as { error?: { message?: string } };
      detail = errorBody.error?.message ?? "";
    } catch {
      /* corpo do erro não veio em JSON — segue sem detalhe extra */
    }
    console.error("Gemini API retornou erro", response.status, detail);
    throw new Error(
      detail
        ? `Gemini retornou erro ${response.status}: ${detail}`
        : `Gemini retornou erro ${response.status}. Verifique se a chave é válida e se a "Generative Language API" está habilitada no seu projeto.`,
    );
  }

  const payload = (await response.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  const rawText = payload.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawText) throw new Error("Não foi possível interpretar a resposta do Gemini.");
  return rawText;
}

/** Lê uma fatura de cartão ou extrato bancário em PDF direto do navegador usando a API do Gemini (sem backend). */
export async function parseStatementPdf(file: File): Promise<ParsedStatementItem[]> {
  const fileBase64 = await fileToBase64(file);
  const rawText = await callGemini({
    contents: [
      {
        role: "user",
        parts: [{ text: PROMPT }, { inline_data: { mime_type: file.type || "application/pdf", data: fileBase64 } }],
      },
    ],
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: RESPONSE_SCHEMA,
      temperature: 0.1,
    },
  });

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

      if (!description || !Number.isFinite(amount) || amount <= 0 || !type) return null;
      return { description, amountCents: Math.round(amount * 100), type, date };
    })
    .filter((item): item is ParsedStatementItem => item !== null);
}

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
