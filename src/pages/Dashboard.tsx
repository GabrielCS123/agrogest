import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getTransactions, getProperty } from '../services/dbService';
import { Transaction, Property } from '../types';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend 
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Activity, 
  ArrowRight, 
  Sparkles, 
  Plus,
  Compass,
  AlertTriangle,
  Lightbulb,
  CheckCircle,
  HelpCircle,
  HeartCrack
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { user, userProfile } = useAuth();
  const navigate = useNavigate();
  
  const [property, setProperty] = useState<Property | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      if (!user) return;
      try {
        const prop = await getProperty(user.uid);
        const trans = await getTransactions(user.uid);
        setProperty(prop);
        setTransactions(trans);
      } catch (error) {
        console.error("Erro ao carregar dados do dashboard:", error);
      } finally {
        setLoading(false);
      }
    };
    loadDashboardData();
  }, [user]);

  // Cálculos financeiros
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((acc, t) => acc + t.value, 0);

  const totalExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => acc + t.value, 0);

  const netProfit = totalIncome - totalExpense;
  const transactionCount = transactions.length;

  // Processamento de dados para o gráfico (agrupado por Categoria para dar visão clara, ou por Data de transação)
  // Agrupemos por mês nos últimos 6 meses para mostrar evolução
  const getMonthlyData = () => {
    const monthlyMap: Record<string, { month: string; receita: number; despesa: number }> = {};
    
    // Nomes dos meses curtos
    const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

    // Inicializar os últimos 4 meses com zeros para o gráfico não vir vazio
    const now = new Date();
    for (let i = 3; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = `${monthNames[d.getMonth()]}/${String(d.getFullYear()).slice(-2)}`;
      monthlyMap[label] = { month: label, receita: 0, despesa: 0 };
    }

    transactions.forEach(t => {
      try {
        const d = new Date(t.transactionDate);
        if (isNaN(d.getTime())) return;
        const label = `${monthNames[d.getMonth()]}/${String(d.getFullYear()).slice(-2)}`;
        
        if (!monthlyMap[label]) {
          monthlyMap[label] = { month: label, receita: 0, despesa: 0 };
        }

        if (t.type === 'income') {
          monthlyMap[label].receita += t.value;
        } else {
          monthlyMap[label].despesa += t.value;
        }
      } catch (e) {
        // Ignora datas inválidas
      }
    });

    // Retorna ordenado por cronologia (de trás pra frente)
    return Object.values(monthlyMap);
  };

  const chartData = getMonthlyData();

  // Recomendações da IA baseadas no perfil financeiro (Dados dinâmicos baseados nas transações reais!)
  const getAIRecommendations = () => {
    const recommendations = [];
    
    if (property) {
      if (property.productionType.includes('Pecuária')) {
        recommendations.push({
          type: 'tip',
          icon: Lightbulb,
          iconColor: 'text-amber-500 bg-amber-50',
          title: 'Manejo Rotacionado de Pastos',
          desc: `Como sua produção principal é ${property.productionType}, o manejo rotacionado de piquetes pode aumentar a lotação de animais em até 30% sem a necessidade de comprar ração adicional.`
        });
      } else if (property.productionType.includes('Agricultura')) {
        recommendations.push({
          type: 'tip',
          icon: Lightbulb,
          iconColor: 'text-amber-500 bg-amber-50',
          title: 'Plantio Direto & Adubação Verde',
          desc: 'Adote o plantio direto e insira adubação verde na rotação de culturas. Isso reduz custos com defensivos e melhora a retenção de nitrogênio natural no solo.'
        });
      }
    }

    // Alertas de gastos
    const feedExpenses = transactions
      .filter(t => t.type === 'expense' && t.category === 'Ração')
      .reduce((acc, t) => acc + t.value, 0);

    const fuelExpenses = transactions
      .filter(t => t.type === 'expense' && t.category === 'Combustível')
      .reduce((acc, t) => acc + t.value, 0);

    if (feedExpenses > totalIncome * 0.4 && totalIncome > 0) {
      recommendations.push({
        type: 'warning',
        icon: AlertTriangle,
        iconColor: 'text-red-500 bg-red-50',
        title: 'Custo de Alimentação Elevado',
        desc: `Os gastos com Ração (R$ ${feedExpenses.toFixed(2)}) representam mais de 40% das suas receitas. Considere alternativas como produção de silagem própria.`
      });
    }

    if (fuelExpenses > totalExpense * 0.25 && totalExpense > 0) {
      recommendations.push({
        type: 'warning',
        icon: AlertTriangle,
        iconColor: 'text-red-500 bg-red-50',
        title: 'Alerta: Combustível Alto',
        desc: 'Seu gasto com Combustível está muito representativo. Tente otimizar as rotas do trator e fazer manutenções nos filtros de ar para reduzir consumo.'
      });
    }

    // Sugestão padrão caso não haja transações
    if (recommendations.length === 0) {
      recommendations.push({
        type: 'info',
        icon: Compass,
        iconColor: 'text-emerald-500 bg-emerald-50',
        title: 'Primeiros Passos da Propriedade',
        desc: 'Cadastre suas receitas e despesas agrícolas em "Movimentações" para habilitar o diagnóstico financeiro completo da IA.'
      });
    }

    return recommendations;
  };

  const aiRecommendations = getAIRecommendations();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-emerald-600"></div>
        <p className="mt-4 text-slate-500 font-medium animate-pulse">Carregando painel principal...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Header com Boas-vindas */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 font-sans tracking-tight leading-none">
            Olá, {userProfile?.name ? userProfile.name.split(' ')[0] : 'Produtor'}!
          </h1>
          <p className="text-slate-400 text-sm mt-1.5">
            {property 
              ? `Fazenda: ${property.propertyName} | Produção de ${property.productionType}`
              : "Cadastre sua propriedade no perfil para obter insights personalizados."
            }
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/transactions"
            className="flex items-center gap-1.5 py-3 px-5 text-white bg-emerald-600 hover:bg-emerald-700 font-bold transition-all shadow-md shadow-emerald-600/10 rounded-2xl text-xs"
          >
            <Plus className="h-4.5 w-4.5" />
            Nova Movimentação
          </Link>
        </div>
      </div>

      {/* Cards de Resumo Estatístico */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Receita Total */}
        <div className="bg-white border border-slate-100 p-5 rounded-3xl shadow-sm flex items-center gap-4 hover:shadow-md hover:border-slate-200/60 transition-all duration-200">
          <div className="bg-emerald-55 bg-emerald-50 text-emerald-600 p-3 rounded-2xl">
            <TrendingUp className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none">Receita Mensal</p>
            <p className="text-lg font-black text-slate-800 mt-1">R$ {totalIncome.toFixed(2)}</p>
          </div>
        </div>

        {/* Despesa Total */}
        <div className="bg-white border border-slate-100 p-5 rounded-3xl shadow-sm flex items-center gap-4 hover:shadow-md hover:border-slate-200/60 transition-all duration-200">
          <div className="bg-red-50 text-red-600 p-3 rounded-2xl">
            <TrendingDown className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none">Despesa Mensal</p>
            <p className="text-lg font-black text-slate-800 mt-1">R$ {totalExpense.toFixed(2)}</p>
          </div>
        </div>

        {/* Lucro Estimado */}
        <div className="bg-white border border-slate-100 p-5 rounded-3xl shadow-sm flex items-center gap-4 hover:shadow-md hover:border-slate-200/60 transition-all duration-200">
          <div className={`p-3 rounded-2xl ${netProfit >= 0 ? 'bg-emerald-65 bg-emerald-50/70 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
            <DollarSign className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none">Lucro Estimado</p>
            <p className={`text-lg font-black mt-1 ${netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              R$ {netProfit.toFixed(2)}
            </p>
          </div>
        </div>

        {/* Movimentações */}
        <div className="bg-white border border-slate-100 p-5 rounded-3xl shadow-sm flex items-center gap-4 hover:shadow-md hover:border-slate-200/60 transition-all duration-200">
          <div className="bg-slate-50 text-slate-500 p-3 rounded-2xl">
            <Activity className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none">Movimentações</p>
            <p className="text-lg font-black text-slate-800 mt-1">{transactionCount} lançamentos</p>
          </div>
        </div>

      </div>

      {/* Seção Central - Gráfico & Recomendações */}
      <div className="grid md:grid-cols-12 gap-6">
        
        {/* Gráfico Financeiro */}
        <div className="md:col-span-8 bg-white border border-slate-100 p-6 rounded-3xl shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-800">Evolução Financeira (Histórico de Lançamentos)</h2>
            <Link to="/reports" className="text-xs text-emerald-600 hover:text-emerald-700 hover:underline font-bold flex items-center gap-0.5">
              Relatório Completo
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="h-72 w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" tickLine={false} stroke="#94a3b8" />
                <YAxis tickLine={false} stroke="#94a3b8" tickFormatter={(v) => `R$${v}`} />
                <Tooltip 
                  formatter={(value) => [`R$ ${Number(value).toFixed(2)}`, '']}
                  contentStyle={{ background: '#fff', borderRadius: '16px', border: '1px solid #f1f5f9', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}
                />
                <Legend wrapperStyle={{ paddingTop: '10px' }} />
                <Bar dataKey="receita" name="Receita" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={45} />
                <Bar dataKey="despesa" name="Despesa" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={45} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Painel lateral de Insights da IA */}
        <div className="md:col-span-4 bg-white border border-slate-100 p-6 rounded-3xl shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-50">
              <h2 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                <Sparkles className="h-4.5 w-4.5 text-emerald-600" />
                Insights Inteligentes
              </h2>
              <span className="text-[9px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-bold">Beta</span>
            </div>

            <div className="space-y-4 mt-4 overflow-y-auto max-h-56 pr-1">
              {aiRecommendations.map((rec, idx) => {
                const Icon = rec.icon;
                return (
                  <div key={idx} className="flex gap-3 text-xs leading-relaxed items-start">
                    <div className={`p-2 rounded-xl shrink-0 ${rec.iconColor}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 leading-snug">{rec.title}</p>
                      <p className="text-slate-400 mt-0.5">{rec.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <Link
            to="/ia"
            className="w-full flex items-center justify-center gap-1 py-2.5 px-4 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-2xl text-xs font-bold transition-all"
          >
            Acessar Assistente IA
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

      </div>

      {/* Rodapé - Últimas Movimentações */}
      <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-800">Últimas Movimentações</h2>
          <Link to="/transactions" className="text-xs text-emerald-600 hover:text-emerald-700 hover:underline font-bold flex items-center gap-0.5">
            Ver Todas
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="divide-y divide-slate-50 text-xs">
          {transactions.length === 0 ? (
            <p className="text-slate-400 py-4 font-medium text-center">Nenhuma movimentação registrada.</p>
          ) : (
            transactions.slice(0, 5).map((t) => {
              const isIncome = t.type === 'income';
              return (
                <div key={t.id} className="py-3 flex items-center justify-between hover:bg-slate-55 hover:bg-slate-50/30 transition-colors px-1 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl shrink-0 ${isIncome ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                      {isIncome ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                    </div>
                    <div className="overflow-hidden">
                      <p className="font-bold text-slate-800 truncate max-w-xs">{t.description || t.category}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {t.category} • {t.transactionDate.split('-').reverse().join('/')}
                      </p>
                    </div>
                  </div>
                  <span className={`font-bold text-sm ${isIncome ? 'text-emerald-600' : 'text-red-600'}`}>
                    {isIncome ? '+' : '-'} R$ {t.value.toFixed(2)}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>

    </div>
  );
};

export default Dashboard;
