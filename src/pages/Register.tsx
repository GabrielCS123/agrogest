import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Sprout, Mail, Lock, User, UserPlus, AlertCircle, CheckCircle, Shield } from 'lucide-react';

export const Register: React.FC = () => {
  const { register: authRegister } = useAuth();
  const navigate = useNavigate();
  const { register: formRegister, handleSubmit, formState: { errors }, watch } = useForm();

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const passwordValue = watch('password');

  const onSubmit = async (data: any) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      await authRegister(data.name, data.email, data.password, data.acceptedTerms);
      navigate('/');
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/email-already-in-use') {
        setErrorMsg("Este endereço de e-mail já está em uso.");
      } else if (err.code === 'auth/weak-password') {
        setErrorMsg("A senha é muito fraca. Escolha uma senha com pelo menos 6 caracteres.");
      } else {
        setErrorMsg("Erro ao cadastrar. Tente novamente mais tarde.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-4xl w-full overflow-hidden grid md:grid-cols-12 animate-in fade-in zoom-in-95 duration-300">
        
        {/* Lado Esquerdo - Painel Decorativo */}
        <div className="md:col-span-5 bg-gradient-to-br from-emerald-800 via-emerald-700 to-teal-800 p-8 text-white flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 h-40 w-40 bg-emerald-500/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 h-40 w-40 bg-teal-500/10 rounded-full blur-3xl"></div>
          
          <div className="flex items-center gap-2 relative z-10">
            <div className="bg-white/10 p-2 rounded-xl backdrop-blur-md">
              <Sprout className="h-6 w-6 text-emerald-300" />
            </div>
            <span className="font-bold text-xl tracking-tight text-white">AgroGest <span className="text-emerald-300 font-extrabold">IA</span></span>
          </div>

          <div className="my-12 relative z-10">
            <h1 className="text-3xl font-extrabold font-sans leading-tight text-white tracking-tight">Crie sua Conta</h1>
            <p className="text-emerald-100 text-sm mt-3 leading-relaxed">
              Junte-se a centenas de produtores rurais que já digitalizaram e otimizaram o controle financeiro de suas propriedades com inteligência artificial.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-emerald-200/80 bg-emerald-900/40 p-3 rounded-xl border border-emerald-500/20 relative z-10">
            <Shield className="h-5 w-5 text-emerald-300 shrink-0" />
            <span>Seus dados financeiros estão totalmente protegidos sob as diretrizes da LGPD.</span>
          </div>
        </div>

        {/* Lado Direito - Formulário */}
        <div className="md:col-span-7 p-8 sm:p-12 flex flex-col justify-center">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-slate-800">Comece agora!</h2>
            <p className="text-sm text-slate-400 mt-1">Insira seus dados para criar sua propriedade virtual.</p>
          </div>

          {errorMsg && (
            <div className="mb-5 p-4 bg-red-50 border border-red-100 rounded-2xl flex gap-2.5 text-sm text-red-700 items-start">
              <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Nome Completo */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Nome Completo</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Seu nome completo"
                  {...formRegister('name', { required: "Nome completo é obrigatório" })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 pl-12 pr-4 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all text-slate-800"
                />
              </div>
              {errors.name && (
                <p className="text-xs text-red-500 mt-1 font-medium">{errors.name.message as string}</p>
              )}
            </div>

            {/* E-mail */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">E-mail</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input
                  type="email"
                  placeholder="seuemail@exemplo.com"
                  {...formRegister('email', { 
                    required: "E-mail é obrigatório",
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: "Endereço de e-mail inválido"
                    }
                  })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 pl-12 pr-4 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all text-slate-800"
                />
              </div>
              {errors.email && (
                <p className="text-xs text-red-500 mt-1 font-medium">{errors.email.message as string}</p>
              )}
            </div>

            {/* Senha */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Senha</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input
                  type="password"
                  placeholder="No mínimo 6 caracteres"
                  {...formRegister('password', { 
                    required: "Senha é obrigatória",
                    minLength: {
                      value: 6,
                      message: "A senha deve ter pelo menos 6 caracteres"
                    }
                  })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 pl-12 pr-4 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all text-slate-800"
                />
              </div>
              {errors.password && (
                <p className="text-xs text-red-500 mt-1 font-medium">{errors.password.message as string}</p>
              )}
            </div>

            {/* Confirmar Senha */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Confirmar Senha</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input
                  type="password"
                  placeholder="Repita a senha cadastrada"
                  {...formRegister('confirmPassword', { 
                    required: "Confirmação de senha é obrigatória",
                    validate: (val) => val === passwordValue || "As senhas não coincidem"
                  })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 pl-12 pr-4 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all text-slate-800"
                />
              </div>
              {errors.confirmPassword && (
                <p className="text-xs text-red-500 mt-1 font-medium">{errors.confirmPassword.message as string}</p>
              )}
            </div>

            {/* Checkbox LGPD */}
            <div className="pt-2">
              <label className="flex items-start gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  {...formRegister('acceptedTerms', { required: "Você deve aceitar a Política de Privacidade para continuar" })}
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                />
                <span className="text-xs text-slate-500 leading-snug">
                  Estou ciente e aceito os termos descritos na 
                  <a 
                    href="/privacy-policy" 
                    target="_blank" 
                    rel="noreferrer" 
                    className="text-emerald-600 font-bold hover:underline mx-1"
                  >
                    Política de Privacidade
                  </a> e autorizo o tratamento de meus dados cadastrais sob a LGPD.
                </span>
              </label>
              {errors.acceptedTerms && (
                <p className="text-xs text-red-500 mt-1 font-medium">{errors.acceptedTerms.message as string}</p>
              )}
            </div>

            {/* Botão de Cadastro */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 rounded-2xl text-white bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 font-semibold transition-all shadow-lg shadow-emerald-600/15 flex items-center justify-center gap-2 text-sm mt-3"
            >
              {loading ? 'Criando Conta...' : 'Finalizar Cadastro'}
              {!loading && <UserPlus className="h-4 w-4" />}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-slate-500">
            <span>Já tem uma conta? </span>
            <Link to="/login" className="text-emerald-600 hover:text-emerald-700 hover:underline font-bold">
              Fazer Login
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Register;
