import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom'; // <--- Importações essenciais
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
  UserRound
} from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation(); // Hook para saber a URL atual
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Função de Logout
  const handleLogout = () => {
    navigate('/login');
  };

  // Função para navegar
  const handleNavigation = (path: string) => {
    navigate(path);
  };

  return (
    <div className="flex h-screen bg-gray-100">
      
      {/* --- SIDEBAR (Lateral) --- */}
      <aside className={`${isSidebarOpen ? 'w-64' : 'w-20'} bg-gray-900 text-white transition-all duration-300 flex flex-col`}>
        
        {/* Logo Area */}
        <div className="h-16 flex items-center justify-center border-b border-gray-800">
           {isSidebarOpen ? (
             <img 
               src="/escrita-logo-dr.png" 
               alt="Dr. Imports Logo" 
               className="h-14 object-contain"
             />
           ) : (
             <img 
               src="/logo-dr.png" 
               alt="Dr. Imports Logo" 
               className="w-14 h-14 rounded-full object-cover"
             />
           )}
        </div>
    
        {/* Menu Items */}
        <nav className="flex-1 py-6 space-y-2 px-3">
            <MenuItem 
                icon={<LayoutDashboard size={20} />} 
                text="Visão Geral" 
                isOpen={isSidebarOpen} 
                active={location.pathname === '/dashboard'} // Ativo se a URL for exata
                onClick={() => handleNavigation('/dashboard')}
            />
            <MenuItem 
                icon={<DollarSign size={20} />} 
                text="Vendas" 
                isOpen={isSidebarOpen} 
                active={location.pathname === '/dashboard/sales'}
                onClick={() => handleNavigation('/dashboard/sales')}
            />
            <MenuItem 
                icon={<Package size={20} />} 
                text="Importações" 
                isOpen={isSidebarOpen} 
                active={location.pathname === '/dashboard/imports'}
                onClick={() => handleNavigation('/dashboard/imports')}
            />
            <MenuItem 
                icon={<Boxes size={20} />} 
                text="Produtos" 
                isOpen={isSidebarOpen} 
                active={location.pathname === '/dashboard/products'} // Ativo se for Produtos
                onClick={() => handleNavigation('/dashboard/products')}
            />
            <MenuItem 
                icon={<Users size={20} />} 
                text="Clientes" 
                isOpen={isSidebarOpen} 
                active={location.pathname === '/dashboard/clients'}
                onClick={() => handleNavigation('/dashboard/clients')}
            />
            <MenuItem 
                icon={<UserRound size={20} />} 
                text="Usuários" 
                isOpen={isSidebarOpen} 
                active={location.pathname === '/dashboard/users'}
                onClick={() => handleNavigation('/dashboard/users')}
            />
            <MenuItem 
                icon={<Target size={20} />} 
                text="Marcas" 
                isOpen={isSidebarOpen} 
                active={location.pathname === '/dashboard/brands'}
                onClick={() => handleNavigation('/dashboard/brands')}
            />
            <MenuItem 
                icon={<List size={20} />} 
                text="Categorias" 
                isOpen={isSidebarOpen} 
                active={location.pathname === '/dashboard/categories'}
                onClick={() => handleNavigation('/dashboard/categories')}
            />
            <MenuItem 
                icon={<Settings size={20} />} 
                text="Configurações" 
                isOpen={isSidebarOpen} 
                active={location.pathname === '/dashboard/settings'}
                onClick={() => handleNavigation('/dashboard/settings')}
            />
        </nav>

        {/* Footer Sidebar */}
        <div className="p-4 border-t border-gray-800">
            <button 
                onClick={handleLogout}
                className="flex items-center gap-3 w-full p-2 rounded-lg hover:bg-red-600/20 text-red-400 hover:text-red-300 transition-colors"
            >
                <LogOut size={20} />
                <span className={`${!isSidebarOpen && 'hidden'} transition-all duration-300`}>Sair</span>
            </button>
        </div>
      </aside>

      {/* --- MAIN CONTENT (Direita) --- */}
      <div className="flex-1 flex flex-col overflow-hidden">
        
        {/* Header (Mantido igual) */}
        <header className="h-16 bg-white shadow-sm flex items-center justify-between px-6 z-10">
            <div className="flex items-center gap-4">
                <button 
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    className="p-2 hover:bg-gray-100 rounded-lg text-gray-600"
                >
                    <Menu size={20} />
                </button>
                <div className="relative hidden md:block">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <input 
                        type="text" 
                        placeholder="Buscar..." 
                        className="pl-10 pr-4 py-2 bg-gray-50 border-none rounded-lg focus:ring-2 focus:ring-blue-500 w-64 text-sm"
                    />
                </div>
            </div>

            <div className="flex items-center gap-4">
                <button className="p-2 hover:bg-gray-100 rounded-full text-gray-600 relative">
                    <Bell size={20} />
                    <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
                </button>
                <div className="h-8 w-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    AS
                </div>
            </div>
        </header>

        {/* --- ÁREA DINÂMICA (Onde a mágica acontece) --- */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100">
            {/* O Outlet renderiza o componente filho da rota (Home ou Products) */}
            <Outlet />
        </main>
      </div>
    </div>
  );
}

// --- Subcomponentes ---

// Item do Menu (Atualizado com onClick)
function MenuItem({ icon, text, isOpen, active = false, onClick }: any) {
    return (
        <button 
            onClick={onClick} // Adicionado evento de clique
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