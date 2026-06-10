import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getProperty, getTransactions, getAIReports, addAIReport } from '../services/dbService';
import { generateFinancialAnalysis, askAI } from '../services/aiService';
import { Property, Transaction, AIReport } from '../types';
import { 
  Sparkles, 
  Send, 
  History, 
  BrainCircuit, 
  FileText, 
  Loader2,
  ChevronRight,
  MessageSquare,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}

export const AI: React.FC = () => {
  const { user } = useAuth();
  
  const [property, setProperty] = useState<Property | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [historyReports, setHistoryReports] = useState<AIReport[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [inputQuestion, setInputQuestion] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  const [reportLoading, setReportLoading] = useState(false);
  const [currentAnalysis, setCurrentAnalysis] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<'chat' | 'report'>('chat');
  
  // Histórico colapsável no mobile
  const [historyOpen, setHistoryOpen] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const loadAIData = async () => {
    if (!user) return;
    try {
      const prop = await getProperty(user.uid);
      const trans = await getTransactions(user.uid);
      const reports = await getAIReports(user.uid);
      setProperty(prop);
      setTransactions(trans);
      setHistoryReports(reports);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    loadAIData();
  }, [user]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputQuestion.trim() || !user || chatLoading) return;

    const userQuery = inputQuestion.trim();
    setInputQuestion('');
    
    const updatedMessages: ChatMessage[] = [...chatMessages, { role: 'user', content: userQuery }];
    setChatMessages(updatedMessages);
    setChatLoading(true);

    try {
      const aiReply = await askAI(userQuery, property, transactions, chatMessages);
      setChatMessages([...updatedMessages, { role: 'model', content: aiReply }]);
    } catch (error) {
      console.error(error);
      setChatMessages([...updatedMessages, { 
        role: 'model', 
        content: 'Não foi possível processar sua pergunta. Tente novamente.' 
      }]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleGenerateReport = async () => {
    if (!user || reportLoading) return;
    setReportLoading(true);
    setCurrentAnalysis(null);
    try {
      const analysisText = await generateFinancialAnalysis(property, transactions);
      setCurrentAnalysis(analysisText);
      await addAIReport(user.uid, 'Análise de Desempenho Geral e Margens Financeiras', analysisText);
      const reports = await getAIReports(user.uid);
      setHistoryReports(reports);
    } catch (error) {
      console.error(error);
      setCurrentAnalysis('Desculpe, falhou ao gerar análise. Confirme suas chaves e movimentações.');
    } finally {
      setReportLoading(false);
    }
  };

  const handleLoadSavedReport = (report: AIReport) => {
    setActiveTab('report');
    setCurrentAnalysis(report.response);
    setHistoryOpen(false);
  };

  const renderMarkdown = (text: string) => {
    if (!text) return null;
    const lines = text.split('\n');
    return lines.map((line, idx) => {
      if (line.startsWith('# ')) {
        return <h3 key={idx} className="text-base font-black text-slate-800 mt-4 mb-2">{line.replace('# ', '')}</h3>;
      }
      if (line.startsWith('## ')) {
        return <h4 key={idx} className="text-sm font-bold text-slate-800 mt-4 mb-2">{line.replace('## ', '')}</h4>;
      }
      if (line.startsWith('### ')) {
        return <h5 key={idx} className="text-xs font-bold text-slate-800 mt-3 mb-1">{line.replace('### ', '')}</h5>;
      }
      if (line.startsWith('* ') || line.startsWith('- ')) {
        const cleanContent = line.replace(/^(\*\s|-\s)/, '');
        return (
          <li key={idx} className="ml-4 list-disc text-slate-600 my-1">
            {parseBoldText(cleanContent)}
          </li>
        );
      }
      if (line.trim() === '') {
        return <div key={idx} className="h-2" />;
      }
      return <p key={idx} className="my-1.5 leading-relaxed text-slate-600">{parseBoldText(line)}</p>;
    });
  };

  const parseBoldText = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={index} className="font-extrabold text-slate-800">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  if (loadingData) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-emerald-600" />
        <p className="mt-4 text-slate-500 font-medium animate-pulse text-sm">Carregando inteligência artificial...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">

      {/* Page Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
          <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-600 animate-pulse shrink-0" />
          Assistente Inteligente IA
        </h1>
        <p className="text-slate-400 text-xs sm:text-sm mt-0.5">
          Utilize o Gemini para analisar custos e planejar otimizações da sua propriedade rural.
        </p>
      </div>

      {/* Layout: coluna única no mobile, 12-col no desktop */}
      <div className="flex flex-col lg:grid lg:grid-cols-12 gap-4">

        {/* Painel Principal */}
        <div className="lg:col-span-8 bg-white border border-slate-100 rounded-2xl shadow-sm flex flex-col overflow-hidden"
             style={{ minHeight: '520px' }}>

          {/* Tabs */}
          <div className="border-b border-slate-100 px-3 sm:px-5 py-3 flex items-center justify-between gap-2 bg-slate-50/50 flex-wrap">
            <div className="flex bg-slate-100 border border-slate-200/50 p-1 rounded-xl gap-1 w-full sm:w-auto">
              <button
                onClick={() => setActiveTab('chat')}
                className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg transition-all ${
                  activeTab === 'chat'
                    ? 'bg-white text-emerald-700 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <MessageSquare className="h-3.5 w-3.5 shrink-0" />
                <span>Chat</span>
              </button>
              <button
                onClick={() => setActiveTab('report')}
                className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg transition-all ${
                  activeTab === 'report'
                    ? 'bg-white text-emerald-700 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <BrainCircuit className="h-3.5 w-3.5 shrink-0" />
                <span className="hidden xs:inline">Diagnóstico</span>
                <span className="xs:hidden">IA</span>
              </button>
            </div>

            {activeTab === 'report' && (
              <button
                onClick={handleGenerateReport}
                disabled={reportLoading}
                className="flex items-center gap-1.5 py-2 px-3 sm:px-4 text-white bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 font-bold transition-all rounded-xl text-xs shrink-0"
              >
                {reportLoading ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span className="hidden sm:inline">Analisando...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Gerar Diagnóstico</span>
                    <span className="sm:hidden">Gerar</span>
                  </>
                )}
              </button>
            )}
          </div>

          {/* Chat Tab */}
          {activeTab === 'chat' && (
            <div className="flex flex-col flex-1" style={{ minHeight: '420px' }}>
              {/* Mensagens */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {chatMessages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 max-w-xs mx-auto space-y-3 py-10">
                    <div className="bg-emerald-50 text-emerald-600 p-3.5 rounded-full">
                      <Sparkles className="h-6 w-6" />
                    </div>
                    <p className="text-xs font-bold text-slate-600">Olá! Eu sou o assistente do AgroGest IA.</p>
                    <p className="text-[11px] leading-relaxed">
                      Pergunte sobre custos operacionais, dicas de defensivos, épocas de plantio ou ideias de produtividade.
                    </p>

                    {/* Sugestões rápidas */}
                    <div className="w-full space-y-2 pt-2">
                      {[
                        'Como reduzir gastos com ração?',
                        'Qual minha receita total?',
                        'Dicas de economia para minha fazenda',
                      ].map((suggestion) => (
                        <button
                          key={suggestion}
                          onClick={() => setInputQuestion(suggestion)}
                          className="w-full text-left text-[11px] font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-100 rounded-xl px-3 py-2 transition-colors"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  chatMessages.map((msg, index) => {
                    const isUser = msg.role === 'user';
                    return (
                      <div
                        key={index}
                        className={`flex gap-2 ${isUser ? 'justify-end' : 'justify-start'}`}
                      >
                        {!isUser && (
                          <div className="h-7 w-7 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                            <Sparkles className="h-3.5 w-3.5" />
                          </div>
                        )}
                        <div className={`
                          max-w-[85%] sm:max-w-[78%] px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed
                          ${isUser
                            ? 'bg-slate-800 text-white rounded-tr-none'
                            : 'bg-slate-50 border border-slate-100 text-slate-700 rounded-tl-none'
                          }
                        `}>
                          {isUser ? msg.content : renderMarkdown(msg.content)}
                        </div>
                        {isUser && (
                          <div className="h-7 w-7 rounded-xl bg-slate-800 text-white flex items-center justify-center shrink-0 mt-0.5 text-[10px] font-bold">
                            U
                          </div>
                        )}
                      </div>
                    );
                  })
                )}

                {chatLoading && (
                  <div className="flex gap-2 justify-start animate-pulse">
                    <div className="h-7 w-7 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    </div>
                    <div className="px-3.5 py-2.5 bg-slate-50 border border-slate-100 rounded-2xl rounded-tl-none text-xs text-slate-400 font-medium">
                      AgroGest IA está escrevendo...
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Input */}
              <form
                onSubmit={handleSendMessage}
                className="p-3 border-t border-slate-100 flex gap-2 bg-white"
              >
                <input
                  type="text"
                  placeholder="Escreva sua dúvida..."
                  value={inputQuestion}
                  onChange={(e) => setInputQuestion(e.target.value)}
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-all text-slate-800 font-medium min-w-0"
                />
                <button
                  type="submit"
                  disabled={chatLoading || !inputQuestion.trim()}
                  className="p-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl transition-colors shadow-md shadow-emerald-600/10 shrink-0"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </div>
          )}

          {/* Diagnóstico Tab */}
          {activeTab === 'report' && (
            <div className="flex-1 p-4 overflow-y-auto">
              {reportLoading ? (
                <div className="flex flex-col items-center justify-center py-20 space-y-4">
                  <Loader2 className="h-10 w-10 text-emerald-600 animate-spin" />
                  <div className="text-center">
                    <p className="text-sm font-bold text-slate-800">Compilando dados financeiros...</p>
                    <p className="text-xs text-slate-400 mt-1 max-w-xs leading-normal">
                      Buscando propriedade e transações para processamento no Gemini.
                    </p>
                  </div>
                </div>
              ) : currentAnalysis ? (
                <div className="space-y-2 bg-slate-50/50 p-4 rounded-2xl border border-slate-100/60 leading-relaxed text-xs">
                  {renderMarkdown(currentAnalysis)}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-center py-16 max-w-sm mx-auto space-y-4">
                  <div className="bg-emerald-50 text-emerald-600 p-4 rounded-3xl">
                    <BrainCircuit className="h-8 w-8" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">Diagnóstico Financeiro Completo</p>
                    <p className="text-xs text-slate-400 mt-1 leading-normal">
                      Gere relatórios detalhados com sugestões de corte de custos e alertas agrícolas baseados nos dados reais da sua fazenda.
                    </p>
                  </div>
                  <button
                    onClick={handleGenerateReport}
                    className="py-2.5 px-5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-all rounded-2xl text-xs shadow-md shadow-emerald-600/10"
                  >
                    Gerar Diagnóstico Agora
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Histórico — Sidebar no desktop, Accordion no mobile */}
        <div className="lg:col-span-4">

          {/* Mobile: Accordion toggle */}
          <button
            className="lg:hidden w-full flex items-center justify-between bg-white border border-slate-100 rounded-2xl px-4 py-3 shadow-sm text-sm font-bold text-slate-700"
            onClick={() => setHistoryOpen(!historyOpen)}
          >
            <span className="flex items-center gap-2">
              <History className="h-4 w-4 text-slate-400" />
              Histórico de Análises
              {historyReports.length > 0 && (
                <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {historyReports.length}
                </span>
              )}
            </span>
            {historyOpen ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
          </button>

          {/* Desktop: sempre visível | Mobile: colapsável */}
          <div className={`
            bg-white border border-slate-100 rounded-2xl shadow-sm
            lg:block
            ${historyOpen ? 'mt-2 block' : 'hidden lg:block'}
          `}>
            {/* Header desktop */}
            <div className="hidden lg:flex items-center gap-2 px-5 pt-5 pb-3 border-b border-slate-50">
              <History className="h-4 w-4 text-slate-400" />
              <h2 className="text-sm font-bold text-slate-800">Histórico de Análises</h2>
            </div>

            <div className="p-3 space-y-1.5 max-h-96 lg:max-h-[430px] overflow-y-auto">
              {historyReports.length === 0 ? (
                <p className="text-slate-400 text-xs text-center py-8 font-medium">
                  Nenhum diagnóstico no histórico.
                </p>
              ) : (
                historyReports.map((report) => (
                  <button
                    key={report.id}
                    onClick={() => handleLoadSavedReport(report)}
                    className="w-full flex items-start text-left gap-2.5 p-3 rounded-xl border border-slate-100 hover:border-emerald-200 hover:bg-slate-50 transition-all group font-medium text-xs text-slate-700"
                  >
                    <FileText className="h-4 w-4 text-slate-400 group-hover:text-emerald-600 shrink-0 mt-0.5" />
                    <div className="overflow-hidden flex-1">
                      <p className="font-bold text-slate-800 truncate leading-snug group-hover:text-emerald-700 text-[11px]">
                        {report.prompt}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {new Date(report.createdAt).toLocaleDateString('pt-BR')} às{' '}
                        {new Date(report.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <ChevronRight className="h-3.5 w-3.5 text-slate-300 ml-auto self-center shrink-0 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AI;
