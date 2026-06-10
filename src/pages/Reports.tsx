import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getTransactions } from '../services/dbService';
import { Transaction } from '../types';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Legend 
} from 'recharts';
import { 
  Calendar, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  PieChart as PieIcon, 
  Activity, 
  Download 
} from 'lucide-react';

type FilterPeriod = 'monthly' | 'quarterly' | 'yearly';

export const Reports: React.FC = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<FilterPeriod>('monthly');

  useEffect(() => {
    const loadReportData = async () => {
      if (!user) return;
      try {
        const data = await getTransactions(user.uid);
        setTransactions(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadReportData();
  }, [user]);

  // Função para filtrar as transações baseadas no período selecionado
  const getFilteredTransactions = () => {
    const now = new Date();
    return transactions.filter(t => {
      const tDate = new Date(t.transactionDate);
      if (isNaN(tDate.getTime())) return false;

      const diffTime = Math.abs(now.getTime() - tDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (period === 'monthly') {
        return diffDays <= 30;
      } else if (period === 'quarterly') {
        return diffDays <= 90;
      } else {
        return diffDays <= 365;
      }
    });
  };

  const filteredTrans = getFilteredTransactions();

  // Cálculos financeiros do período
  const totalIncome = filteredTrans
    .filter(t => t.type === 'income')
    .reduce((acc, t) => acc + t.value, 0);

  const totalExpense = filteredTrans
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => acc + t.value, 0);

  const netProfit = totalIncome - totalExpense;

  // Evolução Financeira do Período (Gráfico de Linha/Área)
  const getEvolutionData = () => {
    const dailyMap: Record<string, { dateLabel: string; formattedDate: string; Receitas: number; Despesas: number }> = {};
    
    filteredTrans.forEach(t => {
      const dateStr = t.transactionDate; // YYYY-MM-DD
      const dateObj = new Date(dateStr);
      if (isNaN(dateObj.getTime())) return;
      
      const label = dateStr.split('-').reverse().slice(0, 2).join('/'); // DD/MM ou MM/YY dependendo do período
      const formattedDate = dateObj.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });

      if (!dailyMap[dateStr]) {
        dailyMap[dateStr] = { 
          dateLabel: dateStr, 
          formattedDate,
          Receitas: 0, 
          Despesas: 0 
        };
      }

      if (t.type === 'income') {
        dailyMap[dateStr].Receitas += t.value;
      } else {
        dailyMap[dateStr].Despesas += t.value;
      }
    });

    // Ordenar por data cronologicamente
    return Object.values(dailyMap).sort((a, b) => a.dateLabel.localeCompare(b.dateLabel));
  };

  const evolutionData = getEvolutionData();

  // Distribuição de despesas por categoria
  const getCategoryData = () => {
    const categoryMap: Record<string, number> = {};
    filteredTrans
      .filter(t => t.type === 'expense')
      .forEach(t => {
        categoryMap[t.category] = (categoryMap[t.category] || 0) + t.value;
      });

    const colors = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#64748b'];

    return Object.entries(categoryMap).map(([name, value], index) => ({
      name,
      value,
      color: colors[index % colors.length]
    }));
  };

  const categoryData = getCategoryData();

  // Função para exportar CSV localmente das transações visíveis
  const handleExportCSV = () => {
    if (filteredTrans.length === 0) return;
    
    // Cabeçalho CSV
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Data,Tipo,Categoria,Valor (R$),Descricao\n";

    filteredTrans.forEach(t => {
      const dateFormatted = t.transactionDate.split('-').reverse().join('/');
      const typeLabel = t.type === 'income' ? 'Receita' : 'Despesa';
      const cleanDesc = (t.description || '').replace(/,/g, ';');
      csvContent += `${dateFormatted},${typeLabel},${t.category},${t.value.toFixed(2)},${cleanDesc}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `relatorio_financeiro_${period}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-emerald-600"></div>
        <p className="mt-4 text-slate-500 font-medium animate-pulse">Gerando relatórios e consolidações...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 font-sans tracking-tight">Relatórios Financeiros</h1>
          <p className="text-slate-400 text-sm mt-0.5">Filtre seus dados por período e visualize gráficos de custos e evolução.</p>
        </div>

        {/* Botoes de Controle */}
        <div className="flex items-center gap-3">
          <div className="flex bg-slate-100 border border-slate-200/50 p-1 rounded-2xl">
            <button
              onClick={() => setPeriod('monthly')}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
                period === 'monthly' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              30 Dias
            </button>
            <button
              onClick={() => setPeriod('quarterly')}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
                period === 'quarterly' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Trimestral
            </button>
            <button
              onClick={() => setPeriod('yearly')}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
                period === 'yearly' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Anual
            </button>
          </div>

          <button
            onClick={handleExportCSV}
            disabled={filteredTrans.length === 0}
            className="flex items-center gap-1 py-2 px-3 border border-slate-200 bg-white hover:bg-slate-50 disabled:bg-slate-50 disabled:text-slate-400 text-slate-700 rounded-xl text-xs font-bold transition-all shadow-sm"
            title="Exportar CSV"
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Exportar</span>
          </button>
        </div>
      </div>

      {/* Cards de Resumos Financeiros do Período */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Receitas */}
        <div className="bg-white border border-slate-100 p-5 rounded-3xl shadow-sm flex items-center gap-4">
          <div className="bg-emerald-50 text-emerald-600 p-3 rounded-2xl">
            <TrendingUp className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none">Receita Total no Período</p>
            <p className="text-lg font-black text-slate-800 mt-1">R$ {totalIncome.toFixed(2)}</p>
          </div>
        </div>

        {/* Despesas */}
        <div className="bg-white border border-slate-100 p-5 rounded-3xl shadow-sm flex items-center gap-4">
          <div className="bg-red-50 text-red-600 p-3 rounded-2xl">
            <TrendingDown className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none">Despesa Total no Período</p>
            <p className="text-lg font-black text-slate-800 mt-1">R$ {totalExpense.toFixed(2)}</p>
          </div>
        </div>

        {/* Margem Líquida */}
        <div className="bg-white border border-slate-100 p-5 rounded-3xl shadow-sm flex items-center gap-4">
          <div className={`p-3 rounded-2xl ${netProfit >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
            <DollarSign className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none">Margem Líquida</p>
            <p className={`text-lg font-black mt-1 ${netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              R$ {netProfit.toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      {/* Gráficos de Detalhamento e Evolução */}
      <div className="grid lg:grid-cols-12 gap-6">
        
        {/* Gráfico de Evolução Financeira (Área) */}
        <div className="lg:col-span-8 bg-white border border-slate-100 p-6 rounded-3xl shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
              <Activity className="h-4.5 w-4.5 text-emerald-600" />
              Evolução Diária / Semanal
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">Fluxo de caixa consolidado para o período selecionado.</p>
          </div>

          <div className="h-72 w-full text-xs mt-4">
            {evolutionData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-400 font-medium">
                Nenhum lançamento no período para plotar no gráfico de evolução.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={evolutionData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorReceita" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorDespesa" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="formattedDate" tickLine={false} stroke="#94a3b8" />
                  <YAxis tickLine={false} stroke="#94a3b8" />
                  <Tooltip 
                    formatter={(value) => [`R$ ${Number(value).toFixed(2)}`, '']}
                    contentStyle={{ background: '#fff', borderRadius: '16px', border: '1px solid #f1f5f9', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}
                  />
                  <Legend />
                  <Area type="monotone" dataKey="Receitas" stroke="#10b981" fillOpacity={1} fill="url(#colorReceita)" strokeWidth={2} />
                  <Area type="monotone" dataKey="Despesas" stroke="#ef4444" fillOpacity={1} fill="url(#colorDespesa)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Gráfico de Distribuição por Categorias (Pizza) */}
        <div className="lg:col-span-4 bg-white border border-slate-100 p-6 rounded-3xl shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <h2 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
              <PieIcon className="h-4.5 w-4.5 text-emerald-600" />
              Distribuição por Categoria
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">Detalhamento dos custos operacionais no período.</p>
          </div>

          <div className="h-64 w-full flex items-center justify-center text-xs mt-2 relative">
            {categoryData.length === 0 ? (
              <p className="text-slate-400 font-medium">Nenhuma despesa para classificar.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `R$ ${Number(value).toFixed(2)}`} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Legendas das categorias */}
          <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
            {categoryData.map((cat, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs font-semibold">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: cat.color }}></span>
                  <span className="text-slate-600">{cat.name}</span>
                </div>
                <span className="text-slate-800">R$ {cat.value.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};

export default Reports;
