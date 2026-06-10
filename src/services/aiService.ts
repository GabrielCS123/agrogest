import { GoogleGenerativeAI } from '@google/generative-ai';
import { Property, Transaction } from '../types';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';

// Inicialização segura do SDK
let genAI: GoogleGenerativeAI | null = null;
if (API_KEY) {
  try {
    genAI = new GoogleGenerativeAI(API_KEY);
  } catch (error) {
    console.error("Falha ao inicializar o GoogleGenerativeAI SDK:", error);
  }
}

/**
 * Auxiliar para estruturar os dados financeiros do usuário para o prompt
 */
const formatFinancialContext = (property: Property | null, transactions: Transaction[]) => {
  const farmInfo = property 
    ? `Propriedade: ${property.propertyName}, Produção: ${property.productionType}, Área: ${property.area} hectares, Localização: ${property.city}/${property.state}`
    : "Propriedade rural não cadastrada ainda.";

  const income = transactions.filter(t => t.type === 'income');
  const expenses = transactions.filter(t => t.type === 'expense');

  const totalIncome = income.reduce((acc, t) => acc + t.value, 0);
  const totalExpenses = expenses.reduce((acc, t) => acc + t.value, 0);
  const netProfit = totalIncome - totalExpenses;

  // Agrupamento por categoria
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
    totalTransactions: transactions.length
  };
};

/**
 * Gera uma análise financeira automática
 */
export const generateFinancialAnalysis = async (
  property: Property | null, 
  transactions: Transaction[]
): Promise<string> => {
  const context = formatFinancialContext(property, transactions);

  const prompt = `
Você é o AgroGest IA, um assistente virtual especialista em gestão financeira e agronômica para produtores rurais.
Por favor, gere um relatório detalhado de análise financeira e recomendações de negócios para a seguinte propriedade rural:

DADOS DA FAZENDA:
${context.farmInfo}

RESUMO FINANCEIRO:
- Receita Total: R$ ${context.totalIncome}
- Despesa Total: R$ ${context.totalExpenses}
- Lucro Líquido Estimado: R$ ${context.netProfit}
- Total de Movimentações: ${context.totalTransactions}

DISTRIBUIÇÃO DE DESPESAS POR CATEGORIA:
${context.categoriesBreakdown || "Nenhuma despesa registrada ainda."}

ÚLTIMAS MOVIMENTAÇÕES FINANCEIRAS:
${context.recentTransactionsList || "Nenhuma movimentação registrada ainda."}

Por favor, escreva uma análise profissional em português estruturada em Markdown, contendo as seguintes seções:
1. **Resumo da Situação Atual**: Uma avaliação sincera sobre a saúde financeira da fazenda.
2. **Análise de Custos e Alertas**: Identificar se alguma categoria está muito alta (ex: Ração, Combustível, Fertilizante) e alertas de risco.
3. **Recomendações Práticas e Economia**: Dicas de otimização de custos, melhorias operacionais, e estratégias de venda.
4. **Insights de Produção**: Sugestões de práticas sustentáveis e produtividade baseadas no tipo de produção da propriedade.

Use uma linguagem amigável, clara e encorajadora para o produtor rural. Evite jargões financeiros excessivamente complexos sem explicação.
`;

  if (!genAI) {
    return getMockAnalysis(context);
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Erro ao chamar API do Gemini:", error);
    return `### ⚠️ Erro na comunicação com a IA\n\nNão foi possível conectar ao serviço inteligente Gemini no momento. Exibindo análise preliminar baseada em dados simulados:\n\n` + getMockAnalysis(context);
  }
};

/**
 * Responde perguntas do usuário em formato chat
 */
export const askAI = async (
  question: string,
  property: Property | null,
  transactions: Transaction[],
  chatHistory: { role: 'user' | 'model'; content: string }[]
): Promise<string> => {
  const context = formatFinancialContext(property, transactions);

  const systemInstruction = `
Você é o AgroGest IA, um consultor financeiro e de gestão rural inteligente.
Você está conversando com o produtor rural da fazenda descrita abaixo.

INFORMAÇÕES DA PROPRIEDADE E FINANCEIRO:
- Fazenda: ${context.farmInfo}
- Receita: R$ ${context.totalIncome} | Despesa: R$ ${context.totalExpenses} | Lucro Líquido: R$ ${context.netProfit}
- Despesas por Categoria:
${context.categoriesBreakdown}

Responda de forma direta, clara e profissional. Ofereça conselhos agrícolas e financeiros realistas.
Mantenha suas respostas organizadas e use formatação markdown quando apropriado para facilitar a leitura.
Se a pergunta não tiver relação com a fazenda ou com agronegócio, responda educadamente lembrando que seu foco é a gestão do AgroGest IA, mas ajude no que puder.
`;

  if (!genAI) {
    return "Olá! Sou o AgroGest IA. No momento estou operando em modo offline, mas posso responder que seu lucro líquido atual é de R$ " + context.netProfit + ". Para análises mais profundas, configure uma chave de API válida.";
  }

  try {
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-flash',
      systemInstruction: systemInstruction
    });

    // Converter histórico para o formato do SDK
    const contents = chatHistory.map(h => ({
      role: h.role === 'user' ? 'user' : 'model',
      parts: [{ text: h.content }]
    }));

    // Adicionar a pergunta atual
    contents.push({
      role: 'user',
      parts: [{ text: question }]
    });

    const result = await model.generateContent({ contents });
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Erro na conversa com a IA:", error);
    return "Desculpe, ocorreu um erro ao processar sua pergunta. Por favor, verifique sua conexão ou tente novamente mais tarde.";
  }
};

/**
 * Análise estática simulada para fallback (Mock)
 */
function getMockAnalysis(context: ReturnType<typeof formatFinancialContext>): string {
  const profitNum = parseFloat(context.netProfit.replace(',', '.'));
  const statusColor = profitNum > 0 ? "saudável" : "crítica (gastos superam ganhos)";

  return `
# Análise AgroGest IA (Simulação de Análise)

## 1. Resumo da Situação Atual
A saúde financeira da sua propriedade é considerada **${statusColor}**.
Você possui uma receita de **R$ ${context.totalIncome}** contra despesas de **R$ ${context.totalExpenses}**, resultando em um saldo final de **R$ ${context.netProfit}**.

## 2. Análise de Custos e Alertas
Com base nas categorias de despesas informadas:
${context.categoriesBreakdown || "- Sem despesas cadastradas para análise."}
* **Alerta**: Fique atento aos custos fixos e variáveis. A compra recorrente de insumos e ração sem cotação de preços pode comprometer sua margem líquida.

## 3. Recomendações Práticas e Economia
* **Negociação de Insumos**: Faça compras em lote de fertilizantes e rações com cooperativas locais para obter descontos por volume.
* **Planejamento de Vendas**: Tente diversificar os canais de distribuição para não ficar dependente de um único comprador ou intermediário.
* **Manutenção Preventiva**: Reduza os gastos de combustíveis e peças fazendo a manutenção periódica de tratores e equipamentos.

## 4. Insights de Produção
* **Aproveitamento de Área**: Considere o manejo rotacionado de pastagens para maximizar a capacidade de suporte por hectare.
* **Análise de Solo**: Realize análise química do solo antes de comprar fertilizantes para aplicar somente o necessário, economizando recursos e protegendo o meio ambiente.
`;
}
