/**
 * aiService.ts
 * Integração com Google Gemini usando @google/generative-ai
 * compatível com chaves AQ. geradas pelo Google AI Studio.
 */
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Property, Transaction } from '../types';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';

// gemini-1.5-flash foi descontinuado — usar gemini-2.5-flash
const GEMINI_MODEL = 'gemini-2.5-flash';

let genAI: GoogleGenerativeAI | null = null;
if (API_KEY) {
  try {
    genAI = new GoogleGenerativeAI(API_KEY);
  } catch (error) {
    console.error('Falha ao inicializar GoogleGenerativeAI SDK:', error);
  }
}

/** Mensagem de erro amigável baseada no status HTTP */
const getErrorMessage = (error: unknown): string => {
  const err = error as { status?: number; message?: string };
  const status = err?.status;
  const msg = (err?.message || '').toLowerCase();

  if (status === 429 || msg.includes('quota') || msg.includes('too many requests')) {
    return `### ⏳ Limite de uso atingido\n\nVocê atingiu o limite gratuito de requisições da API Gemini. Aguarde alguns minutos e tente novamente. Verifique sua cota em [ai.dev/rate-limit](https://ai.dev/rate-limit).\n\n`;
  }
  if (status === 404 || msg.includes('not found')) {
    return `### ⚠️ Modelo de IA não encontrado\n\nO modelo configurado não está disponível para esta chave. Verifique se a chave é do Google AI Studio (aistudio.google.com).\n\n`;
  }
  if (status === 401 || status === 403 || msg.includes('api_key') || msg.includes('invalid') || msg.includes('permission') || msg.includes('unauthenticated')) {
    return `### 🔑 Chave de API inválida\n\nA chave \`VITE_GEMINI_API_KEY\` parece estar incorreta ou expirada. Gere uma nova em [aistudio.google.com/apikey](https://aistudio.google.com/apikey).\n\n`;
  }
  return `### ⚠️ Erro na comunicação com a IA\n\nNão foi possível conectar ao Gemini no momento. Tente novamente.\n\n`;
};

const getErrorMessageChat = (error: unknown): string => {
  const err = error as { status?: number; message?: string };
  const status = err?.status;
  const msg = (err?.message || '').toLowerCase();

  if (status === 429 || msg.includes('quota') || msg.includes('too many')) {
    return '⏳ **Limite de uso atingido.** Aguarde alguns minutos e tente novamente.';
  }
  if (status === 401 || status === 403 || msg.includes('api_key') || msg.includes('invalid') || msg.includes('unauthenticated')) {
    return '🔑 **Chave de API inválida.** Verifique `VITE_GEMINI_API_KEY` no arquivo `.env` ou nas variáveis da Vercel.';
  }
  if (status === 404 || msg.includes('not found')) {
    return '⚠️ **Modelo não encontrado.** Verifique se a chave é do Google AI Studio.';
  }
  return 'Desculpe, ocorreu um erro. Por favor, tente novamente.';
};

/** Estrutura os dados financeiros do usuário para o prompt */
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

  return { farmInfo, totalIncome: totalIncome.toFixed(2), totalExpenses: totalExpenses.toFixed(2), netProfit: netProfit.toFixed(2), categoriesBreakdown, recentTransactionsList, totalTransactions: transactions.length };
};

/** Gera análise financeira completa */
export const generateFinancialAnalysis = async (
  property: Property | null,
  transactions: Transaction[]
): Promise<string> => {
  const context = formatFinancialContext(property, transactions);

  const prompt = `
Você é o AgroGest IA, assistente especialista em gestão financeira e agronômica para produtores rurais.
Gere um relatório detalhado para:

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

Escreva em português, estruturado em Markdown com:
1. **Resumo da Situação Atual**
2. **Análise de Custos e Alertas**
3. **Recomendações Práticas**
4. **Insights de Produção**

Use linguagem amigável e encorajadora para o produtor rural.
`;

  if (!genAI) {
    return getMockAnalysis(context);
  }

  try {
    const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    console.error('Erro ao chamar API do Gemini:', error);
    return getErrorMessage(error) + getMockAnalysis(context);
  }
};

/** Responde perguntas no modo chat */
export const askAI = async (
  question: string,
  property: Property | null,
  transactions: Transaction[],
  chatHistory: { role: 'user' | 'model'; content: string }[]
): Promise<string> => {
  const context = formatFinancialContext(property, transactions);

  const systemInstruction = `Você é o AgroGest IA, um consultor financeiro e de gestão rural inteligente.
Fazenda: ${context.farmInfo}
Receita: R$ ${context.totalIncome} | Despesa: R$ ${context.totalExpenses} | Lucro: R$ ${context.netProfit}
Despesas por categoria: ${context.categoriesBreakdown || '(nenhuma)'}
Responda de forma direta e profissional. Use markdown quando apropriado.`;

  if (!genAI) {
    return `Olá! Estou em modo offline (sem chave de API). Seu lucro atual é de R$ ${context.netProfit}. Configure \`VITE_GEMINI_API_KEY\` para análises completas.`;
  }

  try {
    const model = genAI.getGenerativeModel({
      model: GEMINI_MODEL,
      systemInstruction,
    });

    const contents = chatHistory.map(h => ({
      role: h.role === 'user' ? 'user' as const : 'model' as const,
      parts: [{ text: h.content }],
    }));
    contents.push({ role: 'user', parts: [{ text: question }] });

    const result = await model.generateContent({ contents });
    return result.response.text();
  } catch (error) {
    console.error('Erro na conversa com a IA:', error);
    return getErrorMessageChat(error);
  }
};

/** Análise simulada para fallback */
function getMockAnalysis(context: ReturnType<typeof formatFinancialContext>): string {
  const profitNum = parseFloat(context.netProfit.replace(',', '.'));
  const status = profitNum > 0 ? 'saudável' : 'crítica (gastos superam ganhos)';
  return `
# Análise AgroGest IA (Simulação)

## 1. Resumo da Situação Atual
A saúde financeira da propriedade é **${status}**.
Receita de **R$ ${context.totalIncome}** contra despesas de **R$ ${context.totalExpenses}**, saldo de **R$ ${context.netProfit}**.

## 2. Análise de Custos e Alertas
${context.categoriesBreakdown || '- Sem despesas cadastradas para análise.'}
* **Alerta**: Cotações periódicas de insumos podem reduzir custos significativamente.

## 3. Recomendações Práticas
* **Negociação de Insumos**: Compras em lote com cooperativas locais.
* **Planejamento de Vendas**: Diversifique os canais de distribuição.
* **Manutenção Preventiva**: Reduza gastos com manutenção periódica de equipamentos.

## 4. Insights de Produção
* **Aproveitamento de Área**: Considere manejo rotacionado de pastagens.
* **Análise de Solo**: Realize análise química antes de comprar fertilizantes.
`;
}
