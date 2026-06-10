import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Sprout, Mail, Lock, LogIn, AlertCircle, CheckCircle } from 'lucide-react';

export const Login: React.FC = () => {
  const { login, resetPassword } = useAuth();
  const navigate = useNavigate();
  const { register: formRegister, handleSubmit, formState: { errors }, watch } = useForm();
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);
  const [showForgot, setShowForgot] = useState(false);

  const emailValue = watch('email');

  const onSubmit = async (data: any) => {
    setLoading(true);
    setErrorMsg(null);
    setInfoMsg(null);
    try {
      await login(data.email, data.password);
      navigate('/');
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setErrorMsg("E-mail ou senha incorretos.");
      } else if (err.code === 'auth/invalid-email') {
        setErrorMsg("Formato de e-mail inválido.");
      } else {
        setErrorMsg("Erro ao entrar. Tente novamente mais tarde.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!emailValue) {
      setErrorMsg("Preencha o campo de e-mail acima para solicitar a recuperação de senha.");
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setInfoMsg(null);
    try {
      await resetPassword(emailValue);
      setInfoMsg("E-mail de recuperação de senha enviado com sucesso! Verifique sua caixa de entrada.");
      setShowForgot(false);
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/user-not-found') {
        setErrorMsg("Não foi encontrado nenhum usuário com este e-mail.");
      } else {
        setErrorMsg("Erro ao enviar e-mail de recuperação. Verifique o endereço e tente novamente.");
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
            <h1 className="text-3xl font-extrabold font-sans leading-tight text-white tracking-tight">Gestão Rural Inteligente</h1>
            <p className="text-emerald-100 text-sm mt-3 leading-relaxed">
              Monitore despesas, registre lucros, consulte nosso assistente inteligente e aumente a produtividade da sua lavoura em um só lugar.
            </p>
          </div>

          <div className="text-xs text-emerald-200/70 relative z-10">
            <span>© AgroGest IA - Conectando tecnologia ao campo.</span>
          </div>
        </div>

        {/* Lado Direito - Formulário */}
        <div className="md:col-span-7 p-8 sm:p-12 flex flex-col justify-center">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-800">Bem-vindo de volta!</h2>
            <p className="text-sm text-slate-400 mt-1">Acesse sua conta para gerenciar sua propriedade.</p>
          </div>

          {errorMsg && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex gap-2.5 text-sm text-red-700 items-start">
              <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {infoMsg && (
            <div className="mb-6 p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex gap-2.5 text-sm text-emerald-700 items-start">
              <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
              <span>{infoMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">E-mail</label>
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
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 pl-12 pr-4 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all text-slate-800"
                />
              </div>
              {errors.email && (
                <p className="text-xs text-red-500 mt-1.5 font-medium">{errors.email.message as string}</p>
              )}
            </div>

            {!showForgot && (
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Senha</label>
                  <button
                    type="button"
                    onClick={() => setShowForgot(true)}
                    className="text-xs text-emerald-600 hover:text-emerald-700 hover:underline font-semibold"
                  >
                    Esqueceu a senha?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <input
                    type="password"
                    placeholder="••••••••"
                    {...formRegister('password', { required: "Senha é obrigatória" })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 pl-12 pr-4 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all text-slate-800"
                  />
                </div>
                {errors.password && (
                  <p className="text-xs text-red-500 mt-1.5 font-medium">{errors.password.message as string}</p>
                )}
              </div>
            )}

            {showForgot ? (
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForgot(false)}
                  className="w-1/2 py-3 px-4 rounded-2xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition-colors text-sm"
                >
                  Voltar ao Login
                </button>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  disabled={loading}
                  className="w-1/2 py-3 px-4 rounded-2xl text-white bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 transition-colors font-semibold text-sm shadow-lg shadow-emerald-600/10"
                >
                  Recuperar Senha
                </button>
              </div>
            ) : (
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 rounded-2xl text-white bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 font-semibold transition-all shadow-lg shadow-emerald-600/15 flex items-center justify-center gap-2 text-sm mt-2"
              >
                {loading ? 'Acessando...' : 'Entrar no Painel'}
                {!loading && <LogIn className="h-4 w-4" />}
              </button>
            )}
          </form>

          <div className="mt-8 text-center text-sm text-slate-500">
            <span>Novo por aqui? </span>
            <Link to="/register" className="text-emerald-600 hover:text-emerald-700 hover:underline font-bold">
              Criar Conta Gratuita
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Login;
