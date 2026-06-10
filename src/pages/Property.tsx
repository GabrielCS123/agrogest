import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '../contexts/AuthContext';
import { getProperty, saveProperty } from '../services/dbService';
import { Property as PropertyType } from '../types';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import ConfirmationModal from '../components/ConfirmationModal';
import { 
  MapPin, 
  Layers, 
  Home, 
  Trash2, 
  Save, 
  CheckCircle, 
  User,
  ShieldAlert
} from 'lucide-react';

export const Property: React.FC = () => {
  const { user, userProfile, deleteAccount, logout } = useAuth();
  const [property, setProperty] = useState<PropertyType | null>(null);
  
  const [loadingProperty, setLoadingProperty] = useState(true);
  const [savingProperty, setSavingProperty] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  
  const [propSuccess, setPropSuccess] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Forms
  const { register: registerProp, handleSubmit: handleSubmitProp, reset: resetProp } = useForm();
  const { register: registerUser, handleSubmit: handleSubmitUser, reset: resetUser } = useForm();

  // Load property and user details
  useEffect(() => {
    const loadData = async () => {
      if (user) {
        try {
          const prop = await getProperty(user.uid);
          if (prop) {
            setProperty(prop);
            resetProp({
              propertyName: prop.propertyName,
              productionType: prop.productionType,
              area: prop.area,
              city: prop.city,
              state: prop.state
            });
          }
          if (userProfile) {
            resetUser({
              name: userProfile.name
            });
          }
        } catch (error) {
          console.error("Erro ao carregar dados do perfil:", error);
          setErrorMsg("Não foi possível carregar os dados da propriedade rural.");
        } finally {
          setLoadingProperty(false);
        }
      }
    };
    loadData();
  }, [user, userProfile, resetProp, resetUser]);

  const onSaveProperty = async (data: any) => {
    if (!user) return;
    setSavingProperty(true);
    setPropSuccess(false);
    setErrorMsg(null);
    try {
      await saveProperty(user.uid, {
        propertyName: data.propertyName,
        productionType: data.productionType,
        area: Number(data.area),
        city: data.city,
        state: data.state
      });
      setPropSuccess(true);
      // Recarregar dados
      const updated = await getProperty(user.uid);
      setProperty(updated);
      setTimeout(() => setPropSuccess(false), 4000);
    } catch (error) {
      console.error(error);
      setErrorMsg("Erro ao salvar os dados da propriedade rural.");
    } finally {
      setSavingProperty(false);
    }
  };

  const onSaveProfile = async (data: any) => {
    if (!user) return;
    setSavingProfile(true);
    setProfileSuccess(false);
    setErrorMsg(null);
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, { name: data.name });
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 4000);
    } catch (error) {
      console.error(error);
      setErrorMsg("Erro ao salvar as configurações de perfil.");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleDeleteAccount = async () => {
    setErrorMsg(null);
    try {
      await deleteAccount();
      // O hook do context cuidará do estado de login
    } catch (error: any) {
      console.error("Erro ao excluir conta:", error);
      if (error.code === 'auth/requires-recent-login') {
        setErrorMsg("Por motivos de segurança, a exclusão da conta exige um login recente. Por favor, saia e entre novamente no sistema antes de prosseguir com a exclusão.");
      } else {
        setErrorMsg("Erro ao excluir conta. Caso o erro persista, saia e entre novamente na sua conta.");
      }
    }
  };

  if (loadingProperty) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-emerald-600"></div>
        <p className="mt-4 text-slate-500 font-medium animate-pulse">Carregando dados da fazenda...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-800 font-sans tracking-tight">Perfil & Propriedade</h1>
        <p className="text-slate-400 text-sm mt-0.5">Gerencie as configurações da sua fazenda e as opções de privacidade de sua conta.</p>
      </div>

      {errorMsg && (
        <div className="p-4 bg-red-50 border border-red-100 text-sm text-red-700 rounded-2xl flex gap-2.5 items-start">
          <ShieldAlert className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="grid md:grid-cols-12 gap-6 items-start">
        
        {/* Lado Esquerdo - Perfil da Propriedade */}
        <div className="md:col-span-8 bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex items-center gap-2.5 pb-4 border-b border-slate-50">
            <div className="bg-emerald-100 p-2 rounded-xl text-emerald-700">
              <Home className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800 m-0">Dados da Propriedade Rural</h2>
              <p className="text-xs text-slate-400 mt-0.5">As informações inseridas aqui personalizam os insights de inteligência artificial.</p>
            </div>
          </div>

          <form onSubmit={handleSubmitProp(onSaveProperty)} className="space-y-5">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Nome da Fazenda/Propriedade</label>
                <input
                  type="text"
                  placeholder="Ex: Fazenda Bela Vista"
                  required
                  {...registerProp('propertyName')}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-4 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Tipo de Produção Principal</label>
                <select
                  required
                  {...registerProp('productionType')}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-4 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all text-slate-800"
                >
                  <option value="">Selecione...</option>
                  <option value="Agricultura (Soja/Milho)">Agricultura (Soja/Milho)</option>
                  <option value="Pecuária de Corte">Pecuária de Corte</option>
                  <option value="Pecuária Leiteira">Pecuária Leiteira</option>
                  <option value="Hortifrúti">Hortifrúti</option>
                  <option value="Cafeicultura">Cafeicultura</option>
                  <option value="Silvicultura">Silvicultura</option>
                  <option value="Misto/Outros">Misto/Outros</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Área (em Hectares)</label>
                <input
                  type="number"
                  step="any"
                  placeholder="Ex: 150"
                  required
                  {...registerProp('area')}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-4 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Município</label>
                <input
                  type="text"
                  placeholder="Ex: Uberlândia"
                  required
                  {...registerProp('city')}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-4 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Estado (UF)</label>
                <input
                  type="text"
                  placeholder="Ex: MG"
                  maxLength={2}
                  required
                  {...registerProp('state')}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-4 text-sm uppercase focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all text-slate-800"
                />
              </div>
            </div>

            <div className="flex items-center justify-between gap-4 pt-2">
              {propSuccess && (
                <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-semibold animate-fade-in">
                  <CheckCircle className="h-4 w-4" />
                  Dados da fazenda salvos com sucesso!
                </div>
              )}
              <div className="flex-1"></div>
              <button
                type="submit"
                disabled={savingProperty}
                className="flex items-center gap-2 py-3 px-6 text-white bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 font-bold transition-all shadow-md shadow-emerald-600/10 rounded-2xl text-xs"
              >
                <Save className="h-4 w-4" />
                {savingProperty ? 'Salvando...' : 'Salvar Fazenda'}
              </button>
            </div>
          </form>
        </div>

        {/* Lado Direito - Configurações de Usuário e LGPD */}
        <div className="md:col-span-4 space-y-6">
          
          {/* Card de Configurações de Usuário */}
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-5">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-50">
              <div className="bg-emerald-100 p-2 rounded-xl text-emerald-700">
                <User className="h-4 w-4" />
              </div>
              <h2 className="text-sm font-bold text-slate-800 m-0">Minha Conta</h2>
            </div>

            <form onSubmit={handleSubmitUser(onSaveProfile)} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Nome de Exibição</label>
                <input
                  type="text"
                  required
                  {...registerUser('name')}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all text-slate-800 font-medium"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">E-mail (Não editável)</label>
                <input
                  type="email"
                  disabled
                  value={user?.email || ''}
                  className="w-full bg-slate-100 border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-400 cursor-not-allowed"
                />
              </div>

              <div className="flex items-center justify-between gap-2 pt-1">
                {profileSuccess && (
                  <span className="text-[10px] text-emerald-600 font-semibold">Atualizado!</span>
                )}
                <div className="flex-1"></div>
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="py-2 px-4 text-white bg-slate-800 hover:bg-slate-900 disabled:bg-slate-600 font-bold transition-all rounded-xl text-xs"
                >
                  {savingProfile ? 'Salvando...' : 'Atualizar Nome'}
                </button>
              </div>
            </form>
          </div>

          {/* Card LGPD & Exclusão de Conta */}
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-50 text-red-600">
              <div className="bg-red-50 p-2 rounded-xl text-red-600">
                <Trash2 className="h-4 w-4" />
              </div>
              <h2 className="text-sm font-bold m-0">Zona de Perigo (LGPD)</h2>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Sob a Lei Geral de Proteção de Dados (LGPD), você tem o direito de ser esquecido.
              A exclusão de conta apagará <strong>imediatamente e permanentemente</strong>:
            </p>

            <ul className="text-[11px] text-slate-400 space-y-1.5 list-disc pl-4">
              <li>O cadastro da sua propriedade rural.</li>
              <li>Todas as movimentações financeiras.</li>
              <li>O histórico de relatórios da Inteligência Artificial.</li>
              <li>Sua conta de login no AgroGest IA.</li>
            </ul>

            <button
              onClick={() => setIsDeleteModalOpen(true)}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-red-50 hover:bg-red-600 text-red-600 hover:text-white border border-red-100 hover:border-transparent rounded-xl text-xs font-bold transition-all shadow-sm"
            >
              <Trash2 className="h-4 w-4" />
              Excluir Conta Permanentemente
            </button>
          </div>

        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteAccount}
        title="Deseja mesmo excluir sua conta?"
        message="Esta ação é definitiva, irreversível e apagará todos os seus dados cadastrados, relatórios de IA e transações financeiras em conformidade com a LGPD. Não será possível recuperar suas informações posteriormente."
        confirmText="Sim, Excluir Todos os Meus Dados"
        cancelText="Cancelar e Manter Dados"
        isDestructive={true}
      />

    </div>
  );
};

export default Property;
