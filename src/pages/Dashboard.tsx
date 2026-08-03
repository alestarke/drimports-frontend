import { useEffect, useState, ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { 
  LayoutDashboard, 
  Users, 
  Package, 
  Settings, 
  LogOut, 
  Menu,
  Bell,
  Search,
  DollarSign,
  Boxes,
  Target,
  List,
  UserRound,
  Plane
} from 'lucide-react';

interface DashboardProps {
  children?: ReactNode;
}

const SIDEBAR_BREAKPOINT = 1024;

export default function Dashboard({ children }: DashboardProps) {
  const navigate = useNavigate();
  const location = useLocation();
    const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
        if (typeof window === 'undefined') return true;
        return window.innerWidth >= SIDEBAR_BREAKPOINT;
    });

    useEffect(() => {
        const handleResize = () => {
            setIsSidebarOpen(window.innerWidth >= SIDEBAR_BREAKPOINT);
        };

        handleResize();
        window.addEventListener('resize', handleResize);

        return () => window.removeEventListener('resize', handleResize);
    }, []);

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userName');
    navigate('/login');
  };

  const handleNavigation = (path: string) => {
    navigate(path);
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
      
      {/* --- SIDEBAR --- */}
    <aside className={`${isSidebarOpen ? 'w-64' : 'w-20'} h-full flex-none bg-slate-900 text-slate-100 transition-all duration-300 flex flex-col overflow-hidden border-r border-slate-800 shadow-lg`}>
        
        {/* Logo Area */}
        <div className="h-16 flex items-center justify-center border-b border-slate-800 overflow-hidden px-4">
           {isSidebarOpen ? (
             // Logo aberta (Escrita completa)
             <div className="flex items-center cursor-default select-none">
                <span className="text-2xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-600">
                    DR.
                </span>
                <span className="text-xl font-bold tracking-[0.15em] text-white ml-2">
                    IMPORTS
                </span>
             </div>
           ) : (
             // Logo fechada (Ícone/Iniciais)
             <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 shadow-md shadow-blue-500/20 cursor-default select-none transition-all transform hover:scale-105">
                <span className="text-white font-black text-lg italic tracking-tighter">
                    DR
                </span>
             </div>
           )}
        </div>
    
        {/* Menu Items */}
        <nav className="flex-1 min-h-0 py-6 space-y-1.5 px-3 overflow-y-auto overscroll-contain">
            <MenuItem 
                icon={<LayoutDashboard size={20} />} 
                text="Visão Geral" 
                isOpen={isSidebarOpen} 
                active={location.pathname === '/dashboard'} 
                onClick={() => handleNavigation('/dashboard')}
            />
            <MenuItem 
                icon={<DollarSign size={20} />} 
                text="Vendas" 
                isOpen={isSidebarOpen} 
                active={location.pathname === '/sales'}
                onClick={() => handleNavigation('/sales')}
            />
            <MenuItem 
                icon={<Package size={20} />} 
                text="Importações" 
                isOpen={isSidebarOpen} 
                active={location.pathname === '/imports'}
                onClick={() => handleNavigation('/imports')}
            />
            <MenuItem 
                icon={<Plane size={20} />} 
                text="Viagens" 
                isOpen={isSidebarOpen} 
                active={location.pathname === '/trips'}
                onClick={() => handleNavigation('/trips')}
            />
            <MenuItem 
                icon={<Boxes size={20} />} 
                text="Produtos" 
                isOpen={isSidebarOpen} 
                active={location.pathname === '/products'}
                onClick={() => handleNavigation('/products')}
            />
            <MenuItem 
                icon={<Users size={20} />} 
                text="Clientes" 
                isOpen={isSidebarOpen} 
                active={location.pathname === '/clients'}
                onClick={() => handleNavigation('/clients')}
            />
            <MenuItem 
                icon={<UserRound size={20} />} 
                text="Usuários" 
                isOpen={isSidebarOpen} 
                active={location.pathname === '/users'}
                onClick={() => handleNavigation('/users')}
            />
            <MenuItem 
                icon={<Target size={20} />} 
                text="Marcas" 
                isOpen={isSidebarOpen} 
                active={location.pathname === '/brands'}
                onClick={() => handleNavigation('/brands')}
            />
            <MenuItem 
                icon={<List size={20} />} 
                text="Categorias" 
                isOpen={isSidebarOpen} 
                active={location.pathname === '/categories'}
                onClick={() => handleNavigation('/categories')}
            />
            <MenuItem 
                icon={<Settings size={20} />} 
                text="Configurações" 
                isOpen={isSidebarOpen} 
                active={location.pathname === '/settings'}
                onClick={() => handleNavigation('/settings')}
            />
        </nav>

        {/* Footer Sidebar */}
        <div className="p-4 border-t border-slate-800">
            <button 
                onClick={handleLogout}
                className="flex items-center gap-3 w-full p-2.5 rounded-lg hover:bg-rose-500/10 text-rose-400 hover:text-rose-300 transition-colors font-medium text-sm"
            >
                <LogOut size={20} />
                <span className={`${!isSidebarOpen && 'hidden'} transition-all duration-300`}>Sair</span>
            </button>
        </div>
      </aside>

      {/* --- MAIN CONTENT --- */}
    <div className="flex-1 min-w-0 min-h-0 flex flex-col overflow-hidden">
        
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 z-10 shadow-xs">
            <div className="flex items-center gap-4">
                <button 
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors"
                    title="Alternar Menu"
                >
                    <Menu size={20} />
                </button>
            </div>

            <div className="flex items-center gap-4">
                <button className="p-2 hover:bg-slate-100 rounded-full text-slate-600 relative transition-colors">
                    <Bell size={20} />
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white"></span>
                </button>
                <div className="flex items-center gap-3 pl-2 border-l border-slate-200">
                    <div className="h-9 w-9 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-sm">
                        AS
                    </div>
                </div>
            </div>
        </header>

        {/* --- CONTEÚDO DA PÁGINA (CHILDREN) --- */}
        <main className="flex-1 min-w-0 min-h-0 overflow-x-hidden overflow-y-auto bg-slate-50 overscroll-contain">
            {/* Aqui entra o componente da página (Home, Products, etc) */}
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
            className={`flex items-center gap-4 w-full p-3 rounded-lg transition-all duration-200 group
            ${active 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' 
                : 'text-gray-400 hover:bg-gray-800 hover:text-white'
            }
        `}>
            <div>{icon}</div>
            <span className={`${!isOpen && 'hidden'} whitespace-nowrap origin-left transition-all duration-300`}>
                {text}
            </span>
            
            {!isOpen && (
                <div className="absolute left-16 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none z-50">
                    {text}
                </div>
            )}
        </button>
    );
}