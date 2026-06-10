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
  Trash2, 
  Loader2,
  ChevronRight,
  MessageSquare,
  AlertCircle
} from 'lucide-react';

interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}

export const AI: React.FC = () => {
  const { user } = useAuth();
  
  // Dados do usuário para a IA
  const [property, setProperty] = useState<Property | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [historyReports, setHistoryReports] = useState<AIReport[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // States do Assistente (Chat)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [inputQuestion, setInputQuestion] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  // States do Diagnóstico Geral (Botão Gerar Análise)
  const [reportLoading, setReportLoading] = useState(false);
  const [currentAnalysis, setCurrentAnalysis] = useState<string | null>(null);

  // Aba selecionada
  const [activeTab, setActiveTab] = useState<'chat' | 'report'>('chat');

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Rolar chat para o final
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Carregar dados iniciais
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

  // Função para enviar pergunta no Chat
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputQuestion.trim() || !user || chatLoading) return;

    const userQuery = inputQuestion.trim();
    setInputQuestion('');
    
    // Adicionar mensagem do usuário
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
        content: "Não foi possível processar sua pergunta. Verifique se sua VITE_GEMINI_API_KEY no arquivo .env está configurada e tente novamente." 
      }]);
    } finally {
      setChatLoading(false);
    }
  };

  // Função para gerar uma Análise Geral (Completa)
  const handleGenerateReport = async () => {
    if (!user || reportLoading) return;
    setReportLoading(true);
    setCurrentAnalysis(null);
    try {
      const analysisText = await generateFinancialAnalysis(property, transactions);
      setCurrentAnalysis(analysisText);
      
      // Salvar no banco de dados Firestore para guardar histórico
      await addAIReport(user.uid, "Análise de Desempenho Geral e Margens Financeiras", analysisText);
      
      // Recarregar histórico
      const reports = await getAIReports(user.uid);
      setHistoryReports(reports);
    } catch (error) {
      console.error(error);
      setCurrentAnalysis("Desculpe, falhou ao gerar análise. Confirme suas chaves e movimentações.");
    } finally {
      setReportLoading(false);
    }
  };

  // Carregar um relatório salvo do histórico na tela
  const handleLoadSavedReport = (report: AIReport) => {
    setActiveTab('report');
    setCurrentAnalysis(report.response);
  };

  // Custom parser simples para markdown na tela
  const renderMarkdown = (text: string) => {
    if (!text) return null;
    
    const lines = text.split('\n');
    return lines.map((line, idx) => {
      // Títulos #
      if (line.startsWith('# ')) {
        return <h3 key={idx} className="text-lg font-black text-slate-800 mt-4 mb-2">{line.replace('# ', '')}</h3>;
      }
      if (line.startsWith('## ')) {
        return <h4 key={idx} className="text-base font-bold text-slate-850 mt-4 mb-2">{line.replace('## ', '')}</h4>;
      }
      if (line.startsWith('### ')) {
        return <h5 key={idx} className="text-sm font-bold text-slate-800 mt-3 mb-1">{line.replace('### ', '')}</h5>;
      }
      // Itens de Lista
      if (line.startsWith('* ') || line.startsWith('- ')) {
        const cleanContent = line.replace(/^(\*\s|-\s)/, '');
        return (
          <li key={idx} className="ml-4 list-disc text-slate-650 my-1">
            {parseBoldText(cleanContent)}
          </li>
        );
      }
      // Parágrafos normais
      if (line.trim() === '') {
        return <div key={idx} className="h-2"></div>;
      }
      return <p key={idx} className="my-1.5 leading-relaxed text-slate-600">{parseBoldText(line)}</p>;
    });
  };

  // Parser auxiliar de negritos (**)
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
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-emerald-600"></div>
        <p className="mt-4 text-slate-500 font-medium animate-pulse">Carregando inteligência artificial...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-800 font-sans tracking-tight flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-emerald-600 animate-pulse" />
          Assistente Inteligente IA
        </h1>
        <p className="text-slate-400 text-sm mt-0.5">Utilize o modelo Gemini para analisar custos e planejar otimizações de sua propriedade rural.</p>
      </div>

      <div className="grid lg:grid-cols-12 gap-6 items-start">
        
        {/* Lado Esquerdo - Chat & Geração (Principal) */}
        <div className="lg:col-span-8 bg-white border border-slate-100 rounded-3xl shadow-sm flex flex-col min-h-[550px] overflow-hidden">
          
          {/* Tabs do Painel */}
          <div className="border-b border-slate-100 px-6 py-4 flex items-center justify-between bg-slate-50/50">
            <div className="flex bg-slate-100 border border-slate-200/50 p-1 rounded-xl">
              <button
                onClick={() => setActiveTab('chat')}
                className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                  activeTab === 'chat' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-850'
                }`}
              >
                <MessageSquare className="h-4 w-4" />
                Chat Conversacional
              </button>
              <button
                onClick={() => setActiveTab('report')}
                className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                  activeTab === 'report' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-850'
                }`}
              >
                <BrainCircuit className="h-4 w-4" />
                Diagnóstico Financeiro
              </button>
            </div>
            
            {activeTab === 'report' && (
              <button
                onClick={handleGenerateReport}
                disabled={reportLoading}
                className="flex items-center gap-1.5 py-2 px-4 text-white bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-450 font-bold transition-all rounded-xl text-xs"
              >
                {reportLoading ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Analisando...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3.5 w-3.5" />
                    Gerar Novo Diagnóstico
                  </>
                )}
              </button>
            )}
          </div>

          {/* Conteúdo da Aba 1 - Chat */}
          {activeTab === 'chat' && (
            <div className="flex-1 flex flex-col justify-between h-[450px]">
              {/* Feed de Mensagens */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 max-h-[360px]">
                {chatMessages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 max-w-sm mx-auto space-y-3 py-10">
                    <div className="bg-emerald-50 text-emerald-600 p-3.5 rounded-full">
                      <Sparkles className="h-6 w-6" />
                    </div>
                    <p className="text-xs font-bold text-slate-600">Olá! Eu sou o assistente do AgroGest IA.</p>
                    <p className="text-[11px] leading-relaxed">Você pode me perguntar sobre seus custos operacionais, dicas de defensivos, épocas de plantio ou pedir ideias de produtividade.</p>
                  </div>
                ) : (
                  chatMessages.map((msg, index) => {
                    const isUser = msg.role === 'user';
                    return (
                      <div
                        key={index}
                        className={`flex gap-3 max-w-[85%] ${isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
                      >
                        <div className={`
                          h-8.5 w-8.5 h-8 w-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold shadow-sm
                          ${isUser ? 'bg-slate-800 text-white' : 'bg-emerald-100 text-emerald-700'}
                        `}>
                          {isUser ? 'U' : <Sparkles className="h-4.5 w-4.5" />}
                        </div>
                        <div className={`
                          px-4 py-3 rounded-2xl text-xs leading-relaxed
                          ${isUser ? 'bg-slate-850 bg-slate-850 bg-slate-800 text-white rounded-tr-none' : 'bg-slate-50 border border-slate-100 text-slate-700 rounded-tl-none'}
                        `}>
                          {isUser ? msg.content : renderMarkdown(msg.content)}
                        </div>
                      </div>
                    );
                  })
                )}
                {chatLoading && (
                  <div className="flex gap-3 mr-auto max-w-[85%] animate-pulse">
                    <div className="h-8 w-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                    <div className="px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl rounded-tl-none text-xs text-slate-400 font-medium">
                      O AgroGest IA está escrevendo...
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Input de Mensagem */}
              <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-100 flex gap-2.5 bg-slate-50/20">
                <input
                  type="text"
                  placeholder="Escreva sua dúvida aqui... (ex: Como reduzir meus gastos com adubo?)"
                  value={inputQuestion}
                  onChange={(e) => setInputQuestion(e.target.value)}
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl py-3 px-4 text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-all text-slate-800 font-medium"
                />
                <button
                  type="submit"
                  disabled={chatLoading || !inputQuestion.trim()}
                  className="p-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-2xl transition-colors shadow-md shadow-emerald-600/10"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </div>
          )}

          {/* Conteúdo da Aba 2 - Diagnóstico Geral */}
          {activeTab === 'report' && (
            <div className="flex-1 p-6 overflow-y-auto max-h-[450px]">
              {reportLoading ? (
                <div className="flex flex-col items-center justify-center py-24 space-y-4">
                  <Loader2 className="h-10 w-10 text-emerald-600 animate-spin" />
                  <div className="text-center">
                    <p className="text-sm font-bold text-slate-800">Compilando dados financeiros...</p>
                    <p className="text-xs text-slate-400 mt-1 max-w-xs leading-normal">Buscando propriedade e transações para processamento inteligente no Gemini v1.5.</p>
                  </div>
                </div>
              ) : currentAnalysis ? (
                <div className="space-y-4 bg-slate-50/50 p-6 rounded-2xl border border-slate-100/60 leading-relaxed text-xs">
                  {renderMarkdown(currentAnalysis)}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-center py-20 max-w-sm mx-auto space-y-4">
                  <div className="bg-emerald-50 text-emerald-600 p-4 rounded-3xl">
                    <BrainCircuit className="h-8 w-8" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">Diagnóstico Financeiro Completo</p>
                    <p className="text-xs text-slate-400 mt-1 leading-normal">
                      Gere relatórios detalhados com sugestões de corte de custos operacionais e alertas agrícolas baseados nos dados reais da sua fazenda.
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

        {/* Lado Direito - Histórico de Relatórios/Diagnósticos */}
        <div className="lg:col-span-4 bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-50">
            <History className="h-4.5 w-4.5 text-slate-400" />
            <h2 className="text-sm font-bold text-slate-800 m-0">Histórico de Análises</h2>
          </div>

          <div className="space-y-2 max-h-[430px] overflow-y-auto pr-1">
            {historyReports.length === 0 ? (
              <p className="text-slate-400 text-xs text-center py-8 font-medium">Nenhum diagnóstico no histórico.</p>
            ) : (
              historyReports.map((report) => (
                <button
                  key={report.id}
                  onClick={() => handleLoadSavedReport(report)}
                  className="w-full flex items-start text-left gap-2.5 p-3 rounded-2xl border border-slate-100 hover:border-emerald-250 hover:bg-slate-50 transition-all group font-medium text-xs text-slate-700"
                >
                  <FileText className="h-4.5 w-4.5 text-slate-400 group-hover:text-emerald-600 shrink-0 mt-0.5" />
                  <div className="overflow-hidden">
                    <p className="font-bold text-slate-800 truncate leading-snug group-hover:text-emerald-700">{report.prompt}</p>
                    <p className="text-[10px] text-slate-400 mt-1">
                      {new Date(report.createdAt).toLocaleDateString('pt-BR')} às {new Date(report.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-350 ml-auto self-center shrink-0 group-hover:translate-x-0.5 transition-transform" />
                </button>
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  );
};

export default AI;
