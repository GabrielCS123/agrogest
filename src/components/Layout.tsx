import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  Sprout, 
  LayoutDashboard, 
  ArrowUpDown, 
  BarChart3, 
  Sparkles, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  User
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { userProfile, logout } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const menuItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Movimentações', path: '/transactions', icon: ArrowUpDown },
    { name: 'Relatórios', path: '/reports', icon: BarChart3 },
    { name: 'Assistente IA', path: '/ia', icon: Sparkles },
    { name: 'Perfil da Fazenda', path: '/property', icon: Settings },
  ];

  const handleLinkClick = () => {
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      
      {/* Mobile Top Bar */}
      <header className="md:hidden bg-white border-b border-slate-100 px-4 py-3 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="bg-emerald-100 p-1.5 rounded-lg text-emerald-700">
            <Sprout className="h-5 w-5" />
          </div>
          <span className="font-sans font-bold text-lg text-slate-800 tracking-tight">AgroGest <span className="text-emerald-600 font-extrabold">IA</span></span>
        </div>
        <button 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="text-slate-600 hover:text-slate-800 focus:outline-none p-1"
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </header>

      {/* Sidebar Navigation */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-slate-100 flex flex-col transition-transform duration-300 ease-in-out md:sticky md:translate-x-0
        ${mobileMenuOpen ? 'translate-x-0 top-[53px] md:top-0 h-[calc(100vh-53px)] md:h-screen' : '-translate-x-full md:translate-x-0 h-screen'}
      `}>
        {/* Sidebar Header (Hidden on Mobile) */}
        <div className="hidden md:flex items-center gap-2.5 px-6 py-6 border-b border-slate-50">
          <div className="bg-emerald-100 p-2 rounded-xl text-emerald-700 shadow-sm">
            <Sprout className="h-6 w-6" />
          </div>
          <span className="font-sans font-bold text-xl text-slate-800 tracking-tight">
            AgroGest <span className="text-emerald-600 font-extrabold">IA</span>
          </span>
        </div>

        {/* Sidebar Navigation Links */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={handleLinkClick}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200
                  ${isActive 
                    ? 'bg-emerald-50 text-emerald-700 shadow-sm shadow-emerald-700/5' 
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950'
                  }
                `}
              >
                <Icon className={`h-5 w-5 ${isActive ? 'text-emerald-600' : 'text-slate-400 group-hover:text-slate-600'}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer with User Profile */}
        <div className="p-4 border-t border-slate-50 bg-slate-50/50">
          {userProfile && (
            <div className="flex items-center gap-3 px-2 py-2 mb-3">
              <div className="h-9 w-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shadow-md shadow-emerald-600/10">
                {userProfile.name ? userProfile.name.charAt(0).toUpperCase() : <User className="h-4 w-4" />}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-bold text-slate-800 truncate leading-snug">{userProfile.name}</p>
                <p className="text-[10px] text-slate-400 truncate leading-none mt-0.5">{userProfile.email}</p>
              </div>
            </div>
          )}
          <button
            onClick={() => {
              handleLinkClick();
              logout();
            }}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-red-50 text-slate-600 hover:text-red-600 text-xs font-bold transition-all shadow-sm"
          >
            <LogOut className="h-4 w-4" />
            Sair da Conta
          </button>
        </div>
      </aside>

      {/* Overlay for mobile drawer */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-30 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        <div className="flex-1 p-4 sm:p-6 md:p-8 max-w-7xl w-full mx-auto space-y-6 animate-in fade-in duration-300">
          {children}
        </div>
        
        {/* Footer */}
        <footer className="mt-auto py-6 text-center text-xs text-slate-400 border-t border-slate-100 bg-white">
          <p>© {new Date().getFullYear()} AgroGest IA. Desenvolvido para o agronegócio inteligente brasileiro.</p>
          <p className="mt-1 flex items-center justify-center gap-1.5">
            <span>Em conformidade com a LGPD</span>
            <span className="text-slate-300">|</span>
            <Link to="/privacy-policy" className="text-emerald-600 hover:underline">Política de Privacidade</Link>
          </p>
        </footer>
      </main>

    </div>
  );
};

export default Layout;
