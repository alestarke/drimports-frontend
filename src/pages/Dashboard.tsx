import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  Users, 
  DollarSign, 
  Menu, 
  LogOut, 
  UserRound, 
  Target, 
  List, 
  Boxes,
  Plane,
  Settings,
  Bell,
  ArrowLeftRight
} from 'lucide-react';
import { supabase } from '../supabaseClient';
import toast, { Toaster } from 'react-hot-toast';

export default function Dashboard({ children }: { children: React.ReactNode }) {
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
    if (path === '/dashboard') {
      return location.pathname === '/' || location.pathname === '/dashboard';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden text-slate-800">
      <Toaster 
         position="bottom-left" 
         containerStyle={{
            left: isSidebarOpen ? 280 : 100,
            bottom: 20,
        }}
        toastOptions={{
            style: { background: '#0f172a', color: '#fff', border: '1px solid #334155' }
        }}
      />
      
      {/* --- SIDEBAR (TEMA ESCURO SLATE-950) --- */}
      <aside className={`${isSidebarOpen ? 'w-64' : 'w-20'} h-full flex-none bg-slate-950 text-slate-100 transition-all duration-300 flex flex-col overflow-hidden border-r border-slate-800/80 shadow-lg z-20`}>
        
        {/* Logo Area */}
        <div className="h-14 flex items-center justify-center border-b border-slate-800/80 overflow-hidden px-4 bg-slate-950">
           {isSidebarOpen ? (
             // Logo aberta (Escrita completa)
             <div className="flex items-center cursor-pointer select-none" onClick={() => handleNavigation('/dashboard')}>
                <span className="text-2xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-600">
                    DR.
                </span>
                <span className="text-xl font-bold tracking-[0.15em] text-white ml-2">
                    IMPORTS
                </span>
             </div>
           ) : (
             // Logo fechada (Ícone/Iniciais)
             <div 
               onClick={() => handleNavigation('/dashboard')}
               className="w-9 h-9 flex items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 shadow-md cursor-pointer select-none transition-all transform hover:scale-105"
             >
                <span className="text-white font-black text-base italic tracking-tighter">
                    DR
                </span>
             </div>
           )}
        </div>

        {/* --- APP SWITCHER BUTTON (TROCAR DE MÓDULO P/ FINANCEIRO) --- */}
        <div className="p-3 border-b border-slate-800/80 bg-slate-950">
          <button 
            onClick={() => handleNavigation('/financeiro/dashboard')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-700/40 transition-all shadow-xs group ${!isSidebarOpen && 'justify-center px-0'}`}
            title="Alternar para Controle Financeiro"
          >
            <ArrowLeftRight size={16} className="text-emerald-400 group-hover:rotate-180 transition-transform duration-300" />
            {isSidebarOpen && (
              <span className="truncate">Alternar p/ 💳 <b>Financial Hub</b></span>
            )}
          </button>
        </div>
    
        {/* Menu Items */}
        <nav className="flex-1 min-h-0 py-4 space-y-1 px-3 overflow-y-auto overscroll-contain">
            <MenuItem 
                icon={<LayoutDashboard size={19} />} 
                text="Visão Geral" 
                isOpen={isSidebarOpen} 
                active={isActive('/dashboard')} 
                onClick={() => handleNavigation('/dashboard')}
            />
            <MenuItem 
                icon={<DollarSign size={19} />} 
                text="Vendas" 
                isOpen={isSidebarOpen} 
                active={isActive('/sales')}
                onClick={() => handleNavigation('/sales')}
            />
            <MenuItem 
                icon={<Package size={19} />} 
                text="Importações" 
                isOpen={isSidebarOpen} 
                active={isActive('/imports')}
                onClick={() => handleNavigation('/imports')}
            />
            <MenuItem 
                icon={<Plane size={19} />} 
                text="Viagens" 
                isOpen={isSidebarOpen} 
                active={isActive('/trips')}
                onClick={() => handleNavigation('/trips')}
            />
            <MenuItem 
                icon={<Boxes size={19} />} 
                text="Produtos" 
                isOpen={isSidebarOpen} 
                active={isActive('/products')}
                onClick={() => handleNavigation('/products')}
            />
            <MenuItem 
                icon={<Users size={19} />} 
                text="Clientes" 
                isOpen={isSidebarOpen} 
                active={isActive('/clients')}
                onClick={() => handleNavigation('/clients')}
            />
            <MenuItem 
                icon={<UserRound size={19} />} 
                text="Usuários" 
                isOpen={isSidebarOpen} 
                active={isActive('/users')}
                onClick={() => handleNavigation('/users')}
            />
            <MenuItem 
                icon={<Target size={19} />} 
                text="Marcas" 
                isOpen={isSidebarOpen} 
                active={isActive('/brands')}
                onClick={() => handleNavigation('/brands')}
            />
            <MenuItem 
                icon={<List size={19} />} 
                text="Categorias" 
                isOpen={isSidebarOpen} 
                active={isActive('/categories')}
                onClick={() => handleNavigation('/categories')}
            />
            <MenuItem 
                icon={<Settings size={19} />} 
                text="Configurações" 
                isOpen={isSidebarOpen} 
                active={isActive('/settings')}
                onClick={() => handleNavigation('/settings')}
            />
        </nav>

        {/* Footer Sidebar */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-950">
            <button 
                onClick={handleLogout}
                className="flex items-center gap-3 w-full p-2.5 rounded-xl hover:bg-rose-500/10 text-rose-400 hover:text-rose-300 transition-colors font-medium text-sm group"
            >
                <LogOut size={19} className="text-rose-400 group-hover:text-rose-300" />
                <span className={`${!isSidebarOpen && 'hidden'} transition-all duration-300`}>Sair</span>
            </button>
        </div>
      </aside>

      {/* --- MAIN CONTENT --- */}
      <div className="flex-1 min-w-0 min-h-0 flex flex-col overflow-hidden">
        
        {/* Header */}
        <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-6 z-10 shadow-2xs">
            <div className="flex items-center gap-4">
                <button 
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors"
                    title="Alternar Menu"
                >
                    <Menu size={20} />
                </button>
            </div>

            <div className="flex items-center gap-4">
                <button className="p-1.5 hover:bg-slate-100 rounded-full text-slate-600 relative transition-colors">
                    <Bell size={19} />
                    <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white"></span>
                </button>
                <div className="flex items-center gap-3 pl-2 border-l border-slate-200">
                    <div className="h-8 w-8 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-xs">
                        AS
                    </div>
                </div>
            </div>
        </header>

        {/* --- CONTEÚDO DA PÁGINA (CHILDREN) --- */}
        <main className="flex-1 min-w-0 min-h-0 overflow-x-hidden overflow-y-auto bg-slate-50 overscroll-contain">
            {children}
        </main>
      </div>
    </div>
  );
}

// --- Subcomponentes ---

function MenuItem({ icon, text, isOpen, active = false, onClick }: any) {
    return (
        <button 
            onClick={onClick}
            className={`flex items-center gap-3.5 w-full px-3 py-2.5 rounded-xl font-medium text-sm transition-all duration-150 relative group ${
                active 
                    ? 'bg-blue-600 text-white font-semibold shadow-md shadow-blue-600/30' 
                    : 'text-slate-400 hover:bg-slate-800/80 hover:text-white'
            }`}
        >
            <div className={active ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}>
                {icon}
            </div>
            <span className={`${!isOpen && 'hidden'} whitespace-nowrap origin-left transition-all duration-200`}>
                {text}
            </span>
            
            {!isOpen && (
                <div className="absolute left-16 bg-slate-800 text-white text-xs px-2.5 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none z-50 shadow-md font-medium whitespace-nowrap border border-slate-700">
                    {text}
                </div>
            )}
        </button>
    );
}