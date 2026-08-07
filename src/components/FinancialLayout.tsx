import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Receipt, 
  Wallet, 
  Tag, 
  Menu, 
  LogOut, 
  Settings,
  Bell,
  ArrowLeftRight,
  TrendingUp,
  BarChart3
} from 'lucide-react';
import { supabase } from '../supabaseClient';
import toast, { Toaster } from 'react-hot-toast';

export default function FinancialLayout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/login');
      }
    };
    checkAuth();
  }, [navigate]);

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      toast.success('Logout realizado com sucesso!');
      navigate('/login');
    } catch (error: any) {
      toast.error('Erro ao sair: ' + error.message);
    }
  };

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  const isActive = (path: string) => {
    if (path === '/financeiro/dashboard') {
      return location.pathname === '/financeiro' || location.pathname === '/financeiro/dashboard';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="flex h-screen bg-slate-900/5 bg-emerald-950/5 text-slate-800 overflow-hidden font-sans">
      <Toaster 
        position="bottom-left" 
        containerStyle={{
          left: isSidebarOpen ? 280 : 100,
          bottom: 20,
        }}
        toastOptions={{
          style: { background: '#064e3b', color: '#fff', border: '1px solid #059669' }
        }}
      />
      
      {/* --- SIDEBAR (TEMA DISTINTO: ESMERALDA / DARK TEAL) --- */}
      <aside className={`${isSidebarOpen ? 'w-64' : 'w-20'} h-full flex-none bg-slate-950 text-slate-100 transition-all duration-300 flex flex-col overflow-hidden border-r border-emerald-900/30 shadow-xl z-20`}>
        
        {/* Logo Area (Centralizada, idêntica ao ERP com cores Esmeralda) */}
        <div className="h-14 flex items-center justify-center border-b border-emerald-900/40 overflow-hidden px-4 bg-slate-950">
           {isSidebarOpen ? (
             // Logo aberta (Centralizada, exatamente como no ERP)
             <div className="flex items-center justify-center cursor-pointer select-none" onClick={() => handleNavigation('/financeiro/dashboard')}>
                <span className="text-2xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-emerald-600">
                    DR.
                </span>
                <span className="text-xl font-bold tracking-[0.15em] text-white ml-2">
                    FINANCE
                </span>
             </div>
           ) : (
             // Logo fechada (Iniciais DR)
             <div 
               onClick={() => handleNavigation('/financeiro/dashboard')}
               className="w-9 h-9 flex items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 shadow-md cursor-pointer select-none transition-all transform hover:scale-105"
               title="DR. FINANCE"
             >
                <span className="text-white font-black text-base italic tracking-tighter">
                    DR
                </span>
             </div>
           )}
        </div>

        {/* --- APP SWITCHER BUTTON (TROCAR DE MÓDULO) --- */}
        <div className="p-3 border-b border-emerald-900/30 bg-emerald-950/20">
          <button 
            onClick={() => handleNavigation('/dashboard')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-emerald-400 hover:text-emerald-300 border border-emerald-700/40 transition-all shadow-sm group ${!isSidebarOpen && 'justify-center px-0'}`}
            title="Alternar para o Mini ERP"
          >
            <ArrowLeftRight size={16} className="text-emerald-400 group-hover:rotate-180 transition-transform duration-300" />
            {isSidebarOpen && (
              <span className="truncate">Alternar p/ 📦 <b>Mini ERP</b></span>
            )}
          </button>
        </div>
    
        {/* Menu Items */}
        <nav className="flex-1 min-h-0 py-4 space-y-1.5 px-3 overflow-y-auto overscroll-contain">
            <FinancialMenuItem 
                icon={<LayoutDashboard size={19} />} 
                text="Visão Geral" 
                isOpen={isSidebarOpen} 
                active={isActive('/financeiro/dashboard')} 
                onClick={() => handleNavigation('/financeiro/dashboard')}
            />
            <FinancialMenuItem 
                icon={<Receipt size={19} />} 
                text="Transações & Gastos" 
                isOpen={isSidebarOpen} 
                active={isActive('/financeiro/transacoes')}
                onClick={() => handleNavigation('/financeiro/transacoes')}
            />
            <FinancialMenuItem 
                icon={<Wallet size={19} />} 
                text="Contas & Bancos" 
                isOpen={isSidebarOpen} 
                active={isActive('/financeiro/contas')}
                onClick={() => handleNavigation('/financeiro/contas')}
            />
            <FinancialMenuItem 
                icon={<Tag size={19} />} 
                text="Modalidades / Categorias" 
                isOpen={isSidebarOpen} 
                active={isActive('/financeiro/modalidades')}
                onClick={() => handleNavigation('/financeiro/modalidades')}
            />
            <FinancialMenuItem 
                icon={<BarChart3 size={19} />} 
                text="Relatórios Gráficos" 
                isOpen={isSidebarOpen} 
                active={isActive('/financeiro/relatorios')}
                onClick={() => handleNavigation('/financeiro/relatorios')}
            />
            <FinancialMenuItem 
                icon={<Settings size={19} />} 
                text="Configurações ERP" 
                isOpen={isSidebarOpen} 
                active={isActive('/settings')}
                onClick={() => handleNavigation('/settings')}
            />
        </nav>

        {/* Footer Sidebar */}
        <div className="p-3 border-t border-emerald-900/30 bg-slate-950">
            <button 
                onClick={handleLogout}
                className="flex items-center gap-3 w-full p-2.5 rounded-xl hover:bg-rose-500/10 text-rose-400 hover:text-rose-300 transition-colors font-medium text-sm group"
            >
                <LogOut size={19} className="text-rose-400 group-hover:text-rose-300" />
                <span className={`${!isSidebarOpen && 'hidden'} transition-all duration-300`}>Sair</span>
            </button>
        </div>
      </aside>

      {/* --- MAIN CONTENT AREA --- */}
      <div className="flex-1 min-w-0 min-h-0 flex flex-col overflow-hidden">
        
        {/* Header Superior */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 z-10 shadow-2xs">
            <div className="flex items-center gap-4">
                <button 
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    className="p-2 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 rounded-lg transition-colors"
                    title="Alternar Menu"
                >
                    <Menu size={20} />
                </button>
                <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-emerald-50 border border-emerald-200 rounded-full text-xs font-semibold text-emerald-800">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  Módulo Financeiro Ativo
                </div>
            </div>

            <div className="flex items-center gap-4">
                <button className="p-2 hover:bg-slate-100 rounded-full text-slate-600 relative transition-colors">
                    <Bell size={19} />
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-emerald-500 rounded-full ring-2 ring-white"></span>
                </button>
                <div className="flex items-center gap-3 pl-3 border-l border-slate-200">
                    <div className="h-9 w-9 bg-gradient-to-tr from-emerald-600 to-teal-600 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-md">
                        AS
                    </div>
                </div>
            </div>
        </header>

        {/* Conteúdo Dinâmico */}
        <main className="flex-1 min-w-0 min-h-0 overflow-x-hidden overflow-y-auto bg-slate-50 p-6 overscroll-contain">
            {children}
        </main>
      </div>
    </div>
  );
}

function FinancialMenuItem({ icon, text, isOpen, active = false, onClick }: any) {
    return (
        <button 
            onClick={onClick}
            className={`flex items-center gap-3.5 w-full px-3 py-2.5 rounded-xl font-medium text-sm transition-all duration-150 relative group ${
                active 
                    ? 'bg-emerald-600 text-white font-semibold shadow-md shadow-emerald-900/30' 
                    : 'text-slate-400 hover:bg-emerald-950/50 hover:text-emerald-200'
            }`}
        >
            <div className={active ? 'text-white' : 'text-slate-400 group-hover:text-emerald-400'}>
                {icon}
            </div>
            <span className={`${!isOpen && 'hidden'} whitespace-nowrap origin-left transition-all duration-200`}>
                {text}
            </span>
            
            {!isOpen && (
                <div className="absolute left-16 bg-slate-900 text-emerald-200 text-xs px-2.5 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none z-50 shadow-md font-medium whitespace-nowrap border border-emerald-800">
                    {text}
                </div>
            )}
        </button>
    );
}
