import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, ArrowLeft, ShieldCheck, Heart, UserMinus } from 'lucide-react';

export const PrivacyPolicy: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8 flex flex-col items-center">
      <div className="max-w-3xl w-full bg-white rounded-3xl shadow-xl border border-slate-100 p-8 sm:p-12 space-y-8 animate-in fade-in duration-200">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-100 p-2.5 rounded-2xl text-emerald-700">
              <Shield className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight m-0">Política de Privacidade</h1>
              <p className="text-slate-400 text-xs mt-0.5">Última atualização: Junho de 2026</p>
            </div>
          </div>
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl text-xs font-bold transition-all border border-slate-200/60 self-start sm:self-auto"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </button>
        </div>

        {/* Content */}
        <div className="space-y-6 text-sm text-slate-600 leading-relaxed font-sans">
          <p>
            Bem-vindo ao <strong>AgroGest IA</strong>. Nós levamos a sério a segurança dos seus dados e a sua privacidade. Esta política descreve como tratamos suas informações em estrita conformidade com a <strong>Lei Geral de Proteção de Dados (Lei nº 13.709/2018 - LGPD)</strong>.
          </p>

          {/* Section 1 */}
          <div className="space-y-3">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-600"></span>
              1. Princípio da Minimização de Dados
            </h2>
            <p>
              Coletamos apenas as informações estritamente necessárias para a prestação do serviço:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Nome completo:</strong> Para personalização de saudações e relatórios.</li>
              <li><strong>Endereço de E-mail:</strong> Para autenticação segura e recuperação de senha.</li>
              <li><strong>Dados de Negócio (Opcionais):</strong> Informações sobre a sua propriedade rural (área, tipo de cultura/produção, localização) e transações financeiras (receitas e despesas).</li>
            </ul>
            <div className="bg-emerald-50 text-emerald-800 p-3.5 rounded-xl border border-emerald-100 text-xs font-semibold">
              ⚠️ ATENÇÃO: Nós NÃO solicitamos, coletamos ou armazenamos CPF, RG, dados bancários de cartão de crédito ou quaisquer outros dados classificados como sensíveis pela LGPD.
            </div>
          </div>

          {/* Section 2 */}
          <div className="space-y-3">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-600"></span>
              2. Como os Dados São Utilizados
            </h2>
            <p>
              Os dados coletados são tratados com as seguintes finalidades exclusivas:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Viabilizar a autenticação segura do usuário à plataforma.</li>
              <li>Estruturar o painel de controle (Dashboard) e os gráficos de relatórios financeiros.</li>
              <li>Fornecer insumos para o processamento de IA (integração direta com o SDK do Google Gemini), gerando insights de economia e recomendações agrícolas personalizadas.</li>
            </ul>
          </div>

          {/* Section 3 */}
          <div className="space-y-3">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-600"></span>
              3. Compartilhamento com Terceiros e IA
            </h2>
            <p>
              Seus dados financeiros e de propriedade não são comercializados ou compartilhados com nenhum outro fim comercial. 
              Ao utilizar a funcionalidade do <strong>Assistente IA</strong>, os resumos de suas receitas e despesas são enviados ao modelo do <strong>Google Gemini</strong> através do SDK oficial em tempo real para a elaboração de respostas e análises. 
              As regras de privacidade do Google Gemini aplicam-se a esse processamento.
            </p>
          </div>

          {/* Section 4 */}
          <div className="space-y-3">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-600"></span>
              4. Direitos dos Titulares e Exclusão Permanente
            </h2>
            <p>
              Você, como titular de dados sob a LGPD, possui direitos totais sobre as suas informações:
            </p>
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3">
              <p className="font-semibold text-slate-800 flex items-center gap-1.5 text-xs uppercase tracking-wider">
                <UserMinus className="h-4 w-4 text-red-500" />
                Direito à Exclusão Definitiva
              </p>
              <p className="text-xs">
                A qualquer momento, você pode exercer seu direito de esquecimento através das Configurações de Conta em <strong>"Perfil da Fazenda"</strong>.
                Ao clicar em <strong>"Excluir Conta Permanentemente"</strong>, nosso sistema executará imediatamente uma limpeza completa:
              </p>
              <ol className="list-decimal pl-5 text-xs space-y-1 text-slate-500">
                <li>Apagará permanentemente seu registro de Propriedade Rural do banco de dados Firestore.</li>
                <li>Apagará todos os registros de Receitas e Despesas vinculados ao seu ID.</li>
                <li>Removerá todo o histórico de consultas geradas no chat do assistente IA.</li>
                <li>Deletará o seu documento de perfil e a sua conta de login na autenticação do Firebase.</li>
              </ol>
            </div>
          </div>

          {/* Section 5 */}
          <div className="space-y-3">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-600"></span>
              5. Segurança
            </h2>
            <p>
              Adotamos medidas técnicas robustas de segurança, tais como regras de segurança a nível de banco de dados (Cloud Firestore Rules) que impedem que qualquer outro usuário tenha acesso de leitura ou escrita sobre seus registros, criptografia em trânsito (HTTPS) fornecida pela infraestrutura do Google Firebase e persistência de sessão controlada por token de autenticação seguro.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-100 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-3">
          <div className="flex items-center gap-1.5 font-semibold text-slate-500">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <span>AgroGest IA está em conformidade com as Leis de Proteção brasileiras.</span>
          </div>
          <div className="flex items-center gap-1">
            <span>Cultivando segurança</span>
            <Heart className="h-3 w-3 text-red-400 fill-red-400" />
          </div>
        </div>

      </div>
    </div>
  );
};

export default PrivacyPolicy;
