/**
 * aiService.ts
 *
 * Em produção (Vercel): chama /api/gemini (proxy serverless) — chave fica no servidor.
 * Em desenvolvimento local: chama a API do Gemini diretamente com VITE_GEMINI_API_KEY.
 *
 * Isso impede o Google de revogar automaticamente a chave por detecção em bundle público.
 */
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Property, Transaction } from '../types';

// Detecta se está rodando em produção (Vercel) ou desenvolvimento local
const IS_PROD = import.meta.env.PROD;

// Chave local (usada apenas em dev local, nunca vai para o bundle de produção)
const LOCAL_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';

const GEMINI_MODEL = 'gemini-2.5-flash';

// SDK local apenas para desenvolvimento
let localGenAI: GoogleGenerativeAI | null = null;
if (!IS_PROD && LOCAL_API_KEY) {
  try {
    localGenAI = new GoogleGenerativeAI(LOCAL_API_KEY);
  } catch (e) {
    console.error('Falha ao inicializar SDK local:', e);
  }
}

// ─── Função auxiliar: chamada via proxy Vercel (produção) ─────────────────────
async function callProxyAPI(
  contents: { role: string; parts: { text: string }[] }[],
  systemInstruction?: string
): Promise<string> {
  const body: Record<string, unknown> = { contents };
  if (systemInstruction) body.systemInstruction = systemInstruction;

  const res = await fetch('/api/gemini', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const data = await res.json();

  if (!res.ok) {
    const err = new Error(data.error || 'Erro no proxy Gemini') as Error & { status: number };
    err.status = data.status || res.status;
    throw err;
  }

  return data.text || '';
}

// ─── Mensagens de erro amigáveis ──────────────────────────────────────────────
const getErrorMessage = (error: unknown): string => {
  const err = error as { status?: number; message?: string };
  const status = err?.status;
  const msg = (err?.message || '').toLowerCase();

  if (status === 429 || msg.includes('quota') || msg.includes('too many')) {
    return `### ⏳ Limite de uso atingido\n\nVocê atingiu o limite gratuito da API Gemini. Aguarde alguns minutos e tente novamente.\n\n`;
  }
  if (status === 404 || msg.includes('not found')) {
    return `### ⚠️ Modelo de IA não encontrado\n\nVerifique se a chave é do Google AI Studio (aistudio.google.com).\n\n`;
  }
  if (status === 401 || status === 403 || msg.includes('invalid') || msg.includes('unauthenticated')) {
    return `### 🔑 Chave de API inválida\n\nAtualize a variável \`GEMINI_API_KEY\` nas configurações da Vercel e faça um novo deploy.\n\n`;
  }
  return `### ⚠️ Erro na comunicação com a IA\n\nNão foi possível conectar ao Gemini. Tente novamente mais tarde.\n\n`;
};

const getErrorMessageChat = (error: unknown): string => {
  const err = error as { status?: number; message?: string };
  const status = err?.status;
  const msg = (err?.message || '').toLowerCase();

  if (status === 429 || msg.includes('quota') || msg.includes('too many')) {
    return '⏳ **Limite de uso atingido.** Aguarde alguns minutos e tente novamente.';
  }
  if (status === 401 || status === 403 || msg.includes('invalid') || msg.includes('unauthenticated')) {
    return '🔑 **Chave inválida.** Atualize `GEMINI_API_KEY` nas variáveis da Vercel e faça redeploy.';
  }
  return 'Desculpe, ocorreu um erro. Por favor, tente novamente.';
};

// ─── Contexto financeiro para os prompts ─────────────────────────────────────
const formatFinancialContext = (property: Property | null, transactions: Transaction[]) => {
  const farmInfo = property
    ? `Propriedade: ${property.propertyName}, Produção: ${property.productionType}, Área: ${property.area} hectares, Localização: ${property.city}/${property.state}`
    : 'Propriedade rural não cadastrada ainda.';

  const income = transactions.filter(t => t.type === 'income');
  const expenses = transactions.filter(t => t.type === 'expense');
  const totalIncome = income.reduce((acc, t) => acc + t.value, 0);
  const totalExpenses = expenses.reduce((acc, t) => acc + t.value, 0);
  const netProfit = totalIncome - totalExpenses;

  const expensesByCategory: Record<string, number> = {};
  expenses.forEach(t => {
    expensesByCategory[t.category] = (expensesByCategory[t.category] || 0) + t.value;
  });
  const categoriesBreakdown = Object.entries(expensesByCategory)
    .map(([cat, val]) => `- ${cat}: R$ ${val.toFixed(2)}`)
    .join('\n');

  const recentTransactionsList = transactions.slice(0, 10).map(t =>
    `- [${t.transactionDate}] ${t.type === 'income' ? 'Receita' : 'Despesa'} em ${t.category}: R$ ${t.value.toFixed(2)} (${t.description || 'sem descrição'})`
  ).join('\n');

  return {
    farmInfo,
    totalIncome: totalIncome.toFixed(2),
    totalExpenses: totalExpenses.toFixed(2),
    netProfit: netProfit.toFixed(2),
    categoriesBreakdown,
    recentTransactionsList,
    totalTransactions: transactions.length,
  };
};

// ─── Análise financeira completa ──────────────────────────────────────────────
export const generateFinancialAnalysis = async (
  property: Property | null,
  transactions: Transaction[]
): Promise<string> => {
  const context = formatFinancialContext(property, transactions);

  const prompt = `Você é o AgroGest IA, assistente especialista em gestão financeira e agronômica para produtores rurais.
Gere um relatório detalhado em português, estruturado em Markdown:

DADOS DA FAZENDA: ${context.farmInfo}

RESUMO FINANCEIRO:
- Receita Total: R$ ${context.totalIncome}
- Despesa Total: R$ ${context.totalExpenses}
- Lucro Líquido: R$ ${context.netProfit}
- Total de Movimentações: ${context.totalTransactions}

DESPESAS POR CATEGORIA:
${context.categoriesBreakdown || 'Nenhuma despesa registrada.'}

ÚLTIMAS MOVIMENTAÇÕES:
${context.recentTransactionsList || 'Nenhuma movimentação registrada.'}

Estruture em:
1. **Resumo da Situação Atual**
2. **Análise de Custos e Alertas**
3. **Recomendações Práticas**
4. **Insights de Produção**

Use linguagem amigável e encorajadora.`;

  try {
    // Produção: usa proxy serverless (chave segura no servidor)
    if (IS_PROD) {
      const text = await callProxyAPI([{ role: 'user', parts: [{ text: prompt }] }]);
      return text || getMockAnalysis(context);
    }

    // Desenvolvimento local: usa SDK diretamente
    if (localGenAI) {
      const model = localGenAI.getGenerativeModel({ model: GEMINI_MODEL });
      const result = await model.generateContent(prompt);
      return result.response.text();
    }

    return getMockAnalysis(context);

  } catch (error) {
    console.error('Erro ao gerar análise:', error);
    return getErrorMessage(error) + getMockAnalysis(context);
  }
};

// ─── Chat conversacional ──────────────────────────────────────────────────────
export const askAI = async (
  question: string,
  property: Property | null,
  transactions: Transaction[],
  chatHistory: { role: 'user' | 'model'; content: string }[]
): Promise<string> => {
  const context = formatFinancialContext(property, transactions);

  const systemInstruction = `Você é o AgroGest IA, consultor financeiro e de gestão rural.
Fazenda: ${context.farmInfo}
Receita: R$ ${context.totalIncome} | Despesa: R$ ${context.totalExpenses} | Lucro: R$ ${context.netProfit}
Despesas por categoria: ${context.categoriesBreakdown || '(nenhuma)'}
Responda de forma direta e profissional. Use markdown quando apropriado.`;

  const contents = [
    ...chatHistory.map(h => ({
      role: h.role === 'user' ? 'user' : 'model',
      parts: [{ text: h.content }],
    })),
    { role: 'user', parts: [{ text: question }] },
  ];

  try {
    // Produção: usa proxy serverless
    if (IS_PROD) {
      return await callProxyAPI(contents, systemInstruction);
    }

    // Desenvolvimento local: usa SDK diretamente
    if (localGenAI) {
      const model = localGenAI.getGenerativeModel({ model: GEMINI_MODEL, systemInstruction });
      const result = await model.generateContent({ contents });
      return result.response.text();
    }

    return `Modo offline (sem chave local). Seu lucro atual é R$ ${context.netProfit}.`;

  } catch (error) {
    console.error('Erro no chat IA:', error);
    return getErrorMessageChat(error);
  }
};

// ─── Fallback mock ────────────────────────────────────────────────────────────
function getMockAnalysis(context: ReturnType<typeof formatFinancialContext>): string {
  const profitNum = parseFloat(context.netProfit);
  const status = profitNum > 0 ? 'saudável' : 'crítica (gastos superam ganhos)';
  return `
# Análise AgroGest IA (Simulação)

## 1. Resumo da Situação Atual
A saúde financeira é **${status}**.
Receita de **R$ ${context.totalIncome}** contra despesas de **R$ ${context.totalExpenses}** — saldo de **R$ ${context.netProfit}**.

## 2. Análise de Custos
${context.categoriesBreakdown || '- Sem despesas cadastradas.'}

## 3. Recomendações Práticas
* Faça cotações periódicas de insumos com cooperativas locais.
* Diversifique os canais de venda para reduzir dependência de intermediários.
* Realize manutenção preventiva de equipamentos para evitar gastos inesperados.

## 4. Insights de Produção
* Considere manejo rotacionado de pastagens para maximizar produtividade.
* Realize análise química do solo antes de comprar fertilizantes.
`;
}
