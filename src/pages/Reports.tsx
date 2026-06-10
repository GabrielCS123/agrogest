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
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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

  // Função para exportar PDF profissional
  const handleExportPDF = () => {
    if (filteredTrans.length === 0) return;

    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const now = new Date();
    const generatedAt = now.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
      + ' às ' + now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    const periodLabel: Record<string, string> = {
      monthly: 'Últimos 30 Dias',
      quarterly: 'Últimos 3 Meses (Trimestral)',
      yearly: 'Últimos 12 Meses (Anual)',
    };

    // ─── Cabeçalho (Banner Verde) ───────────────────────────────────────────
    doc.setFillColor(16, 185, 129); // emerald-500
    doc.rect(0, 0, pageWidth, 38, 'F');

    // Faixa decorativa escura inferior do banner
    doc.setFillColor(5, 150, 105); // emerald-600
    doc.rect(0, 30, pageWidth, 8, 'F');

    // Título principal
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.text('AgroGest IA', 14, 16);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text('Relatório Financeiro — Gestão de Propriedade Rural', 14, 23);

    // Metadados do relatório (alinhados à direita)
    doc.setFontSize(7.5);
    doc.text(`Período: ${periodLabel[period]}`, pageWidth - 14, 11, { align: 'right' });
    doc.text(`Gerado em: ${generatedAt}`, pageWidth - 14, 17, { align: 'right' });
    doc.text(`Total de movimentações: ${filteredTrans.length}`, pageWidth - 14, 23, { align: 'right' });

    let cursorY = 48;

    // ─── Cards de Resumo Financeiro ─────────────────────────────────────────
    const cardW = (pageWidth - 28 - 8) / 3; // 3 cards com margens e gap
    const cardH = 22;
    const cards = [
      { label: 'Receita Total', value: totalIncome, color: [16, 185, 129] as [number,number,number], textColor: [255,255,255] as [number,number,number] },
      { label: 'Despesa Total', value: totalExpense, color: [239, 68, 68] as [number,number,number], textColor: [255,255,255] as [number,number,number] },
      { label: netProfit >= 0 ? 'Lucro Líquido' : 'Prejuízo Líquido', value: Math.abs(netProfit), color: netProfit >= 0 ? [5, 150, 105] as [number,number,number] : [185, 28, 28] as [number,number,number], textColor: [255,255,255] as [number,number,number] },
    ];

    cards.forEach((card, i) => {
      const x = 14 + i * (cardW + 4);
      // Sombra simulada
      doc.setFillColor(220, 220, 220);
      doc.roundedRect(x + 0.5, cursorY + 0.5, cardW, cardH, 3, 3, 'F');
      // Card
      doc.setFillColor(...card.color);
      doc.roundedRect(x, cursorY, cardW, cardH, 3, 3, 'F');
      // Label
      doc.setTextColor(...card.textColor);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.text(card.label.toUpperCase(), x + 4, cursorY + 7);
      // Valor
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.text(`R$ ${card.value.toFixed(2)}`, x + 4, cursorY + 17);
    });

    cursorY += cardH + 10;

    // ─── Seção: Detalhamento de Movimentações ───────────────────────────────
    doc.setTextColor(30, 41, 59); // slate-800
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('Detalhamento de Movimentações', 14, cursorY);

    // Linha decorativa abaixo do título
    doc.setDrawColor(16, 185, 129);
    doc.setLineWidth(0.5);
    doc.line(14, cursorY + 2, 60, cursorY + 2);
    cursorY += 6;

    const tableRows = filteredTrans.map(t => [
      t.transactionDate.split('-').reverse().join('/'),
      t.type === 'income' ? 'Receita' : 'Despesa',
      t.category,
      `R$ ${t.value.toFixed(2)}`,
      t.description || '—',
    ]);

    autoTable(doc, {
      startY: cursorY,
      head: [['Data', 'Tipo', 'Categoria', 'Valor', 'Descrição']],
      body: tableRows,
      styles: {
        font: 'helvetica',
        fontSize: 8,
        cellPadding: { top: 3, right: 4, bottom: 3, left: 4 },
        lineColor: [241, 245, 249],
        lineWidth: 0.2,
        textColor: [51, 65, 85],
        overflow: 'ellipsize',
      },
      headStyles: {
        fillColor: [30, 41, 59],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 7.5,
        halign: 'left',
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      columnStyles: {
        0: { cellWidth: 22, halign: 'center' },
        1: { cellWidth: 20, halign: 'center' },
        2: { cellWidth: 32 },
        3: { cellWidth: 28, halign: 'right', fontStyle: 'bold' },
        4: { cellWidth: 'auto' },
      },
      // Colorir a célula de Tipo conforme receita/despesa
      didParseCell: (data) => {
        if (data.section === 'body' && data.column.index === 1) {
          const cellText = String(data.cell.raw);
          if (cellText === 'Receita') {
            data.cell.styles.textColor = [5, 150, 105];
            data.cell.styles.fontStyle = 'bold';
          } else {
            data.cell.styles.textColor = [220, 38, 38];
            data.cell.styles.fontStyle = 'bold';
          }
        }
        // Colorir valor conforme tipo
        if (data.section === 'body' && data.column.index === 3) {
          const row = filteredTrans[data.row.index];
          if (row) {
            data.cell.styles.textColor = row.type === 'income' ? [5, 150, 105] : [220, 38, 38];
          }
        }
      },
      margin: { left: 14, right: 14 },
    });

    // ─── Seção: Distribuição por Categoria ──────────────────────────────────
    if (categoryData.length > 0) {
      // @ts-ignore
      const afterTableY = (doc as any).lastAutoTable.finalY + 10;

      // Verifica se cabe na página ou precisa pular
      const needsNewPage = afterTableY > pageHeight - 60;
      if (needsNewPage) doc.addPage();
      const catY = needsNewPage ? 20 : afterTableY;

      doc.setTextColor(30, 41, 59);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('Distribuição de Despesas por Categoria', 14, catY);
      doc.setDrawColor(239, 68, 68);
      doc.setLineWidth(0.5);
      doc.line(14, catY + 2, 80, catY + 2);

      const catRows = categoryData.map(cat => [
        cat.name,
        `R$ ${cat.value.toFixed(2)}`,
        `${totalExpense > 0 ? ((cat.value / totalExpense) * 100).toFixed(1) : '0.0'}%`,
      ]);

      autoTable(doc, {
        startY: catY + 6,
        head: [['Categoria', 'Total Gasto', '% do Total']],
        body: catRows,
        styles: {
          font: 'helvetica',
          fontSize: 8.5,
          cellPadding: { top: 3.5, right: 5, bottom: 3.5, left: 5 },
          lineColor: [241, 245, 249],
          lineWidth: 0.2,
          textColor: [51, 65, 85],
        },
        headStyles: {
          fillColor: [239, 68, 68],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 8,
        },
        alternateRowStyles: { fillColor: [255, 245, 245] },
        columnStyles: {
          0: { cellWidth: 'auto' },
          1: { cellWidth: 40, halign: 'right', fontStyle: 'bold' },
          2: { cellWidth: 30, halign: 'center' },
        },
        margin: { left: 14, right: 14 },
      });
    }

    // ─── Rodapé em todas as páginas ──────────────────────────────────────────
    const totalPages = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.3);
      doc.line(14, pageHeight - 12, pageWidth - 14, pageHeight - 12);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(148, 163, 184);
      doc.text('AgroGest IA — Gestão Financeira Rural', 14, pageHeight - 6);
      doc.text(`Página ${i} de ${totalPages}`, pageWidth - 14, pageHeight - 6, { align: 'right' });
    }

    // ─── Salvar o PDF ─────────────────────────────────────────────────────────
    const fileName = `AgroGest_Relatorio_${period}_${now.toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
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
            onClick={handleExportPDF}
            disabled={filteredTrans.length === 0}
            className="flex items-center gap-1.5 py-2 px-4 border border-slate-200 bg-white hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-slate-700 rounded-xl text-xs font-bold transition-all shadow-sm"
            title="Exportar PDF"
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Exportar PDF</span>
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
