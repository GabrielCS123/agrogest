import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ShieldCheck, ExternalLink, AlertCircle } from 'lucide-react';

const LGPDModal: React.FC = () => {
  const { updatePrivacyConsent, logout } = useAuth();
  const [accepted, setAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    if (!accepted) {
      setError("Você precisa aceitar os termos de privacidade para continuar.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await updatePrivacyConsent(true);
    } catch (err: any) {
      console.error(err);
      setError("Ocorreu um erro ao salvar seu consentimento. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 max-w-lg w-full overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header com tom verde/escudo */}
        <div className="bg-emerald-600 px-6 py-5 flex items-center gap-3 text-white">
          <ShieldCheck className="h-8 w-8 text-emerald-100 shrink-0" />
          <div>
            <h2 className="text-xl font-bold font-sans tracking-tight leading-none text-white">Privacidade & Segurança</h2>
            <p className="text-emerald-100 text-xs mt-1">Conformidade com a Lei Geral de Proteção de Dados (LGPD)</p>
          </div>
        </div>

        {/* Corpo com explicações */}
        <div className="p-6 space-y-4 text-sm text-slate-600 leading-relaxed overflow-y-auto max-h-[60vh]">
          <p>
            Para garantir a melhor experiência na plataforma <strong>AgroGest IA</strong>, precisamos do seu consentimento explícito para armazenar e tratar seus dados de acordo com os princípios da LGPD:
          </p>

          <ul className="space-y-2.5 bg-slate-50 p-4 rounded-xl border border-slate-100">
            <li className="flex gap-2">
              <span className="text-emerald-600 font-bold">•</span>
              <span><strong>Minimização de Dados:</strong> Coletamos apenas Nome e E-mail. Nunca solicitamos CPF, RG ou dados financeiros bancários.</span>
            </li>
            <li className="flex gap-2">
              <span className="text-emerald-600 font-bold">•</span>
              <span><strong>Finalidade Direta:</strong> Seus dados de propriedade e movimentações servem unicamente para gerar o seu painel financeiro e insights da IA.</span>
            </li>
            <li className="flex gap-2">
              <span className="text-emerald-600 font-bold">•</span>
              <span><strong>Exclusão Permanente:</strong> A qualquer momento, você pode excluir sua conta na página de Perfil, o que apagará permanentemente todos os seus dados do nosso banco de dados.</span>
            </li>
          </ul>

          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <AlertCircle className="h-4 w-4 text-amber-500" />
            <span>Leia a nossa 
              <a 
                href="/privacy-policy" 
                target="_blank" 
                rel="noreferrer" 
                className="text-emerald-600 hover:underline mx-1 inline-flex items-center gap-0.5"
              >
                Política de Privacidade Integral <ExternalLink className="h-3 w-3" />
              </a>
            </span>
          </div>

          {error && (
            <div className="p-3 bg-red-50 text-red-600 rounded-lg text-xs font-medium border border-red-100">
              {error}
            </div>
          )}
        </div>

        {/* Checkbox e Ações */}
        <div className="p-6 bg-slate-50 border-t border-slate-100 space-y-4">
          <label className="flex items-start gap-3 cursor-pointer select-none">
            <input 
              type="checkbox"
              checked={accepted}
              onChange={(e) => setAccepted(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
            />
            <span className="text-xs text-slate-700 font-medium">
              Declaro que li e dou meu consentimento livre e informado para o processamento de meus dados cadastrais e financeiros conforme as diretrizes explicadas acima.
            </span>
          </label>

          <div className="flex gap-3 pt-2">
            <button
              onClick={logout}
              className="w-1/3 py-2.5 px-4 rounded-xl text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 transition-colors text-xs font-semibold"
            >
              Recusar e Sair
            </button>
            <button
              onClick={handleConfirm}
              disabled={submitting}
              className="w-2/3 py-2.5 px-4 rounded-xl text-white bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 transition-colors text-xs font-semibold shadow-md shadow-emerald-600/10 flex items-center justify-center gap-1.5"
            >
              {submitting ? 'Salvando...' : 'Aceitar e Continuar'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default LGPDModal;
