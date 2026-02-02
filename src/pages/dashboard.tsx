import { useState } from 'react';
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
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Função de Logout Mockada
  const handleLogout = () => {
    // Aqui você limparia o token/sessionStorage futuramente
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-gray-100">
      
      {/* --- SIDEBAR (Lateral) --- */}
      {/* A largura muda dependendo se está aberto ou fechado (hidden em mobile) */}
      <aside className={`${isSidebarOpen ? 'w-64' : 'w-20'} bg-gray-900 text-white transition-all duration-300 flex flex-col`}>
        
        {/* Logo Area */}
        <div className="h-16 flex items-center justify-center border-b border-gray-800">
           {isSidebarOpen ? (
             <h1 className="text-xl font-bold tracking-wider">DR. IMPORTS</h1>
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
            <MenuItem icon={<LayoutDashboard size={20} />} text="Visão Geral" isOpen={isSidebarOpen} active />
            <MenuItem icon={<DollarSign size={20} />} text="Vendas" isOpen={isSidebarOpen} />
            <MenuItem icon={<Package size={20} />} text="Importações" isOpen={isSidebarOpen} />
            <MenuItem icon={<Boxes size={20} />} text="Produtos" isOpen={isSidebarOpen} />
            <MenuItem icon={<Users size={20} />} text="Clientes" isOpen={isSidebarOpen} />
            <MenuItem icon={<UserRound size={20} />} text="Usuários" isOpen={isSidebarOpen} />
            <MenuItem icon={<Target size={20} />} text="Marcas" isOpen={isSidebarOpen} />
            <MenuItem icon={<List size={20} />} text="Categorias" isOpen={isSidebarOpen} />
            <MenuItem icon={<Settings size={20} />} text="Configurações" isOpen={isSidebarOpen} />
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
        
        {/* Header */}
        <header className="h-16 bg-white shadow-sm flex items-center justify-between px-6">
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

        {/* Conteúdo Dinâmico (Onde suas tabelas e gráficos entrarão) */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-6">
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Painel de Controle</h2>
                <p className="text-gray-500">Bem-vindo de volta, André.</p>
            </div>

            {/* Exemplo de Cards de Resumo */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <SummaryCard title="Total Importado" value="R$ 145.200" color="blue" />
                <SummaryCard title="Processos Ativos" value="12" color="yellow" />
                <SummaryCard title="Aguardando Pagamento" value="4" color="green" />
            </div>

            {/* Espaço para conteúdo futuro */}
            <div className="bg-white rounded-lg shadow-sm p-6 h-96 border border-gray-200">
                <p className="text-gray-400 text-center mt-40">Conteúdo do sistema será carregado aqui...</p>
            </div>
        </main>
      </div>
    </div>
  );
}

// --- Subcomponentes para organizar o código ---

// Item do Menu
function MenuItem({ icon, text, isOpen, active = false }: any) {
    return (
        <button className={`flex items-center gap-4 w-full p-3 rounded-lg transition-all duration-200 group
            ${active 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' 
                : 'text-gray-400 hover:bg-gray-800 hover:text-white'
            }
        `}>
            <div>{icon}</div>
            <span className={`${!isOpen && 'hidden'} whitespace-nowrap origin-left transition-all duration-300`}>
                {text}
            </span>
            {/* Tooltip simples quando fechado */}
            {!isOpen && (
                <div className="absolute left-16 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none z-50">
                    {text}
                </div>
            )}
        </button>
    );
}

// Card de Resumo
function SummaryCard({ title, value, color }: any) {
    const colors: any = {
        blue: 'border-l-4 border-blue-500',
        yellow: 'border-l-4 border-yellow-500',
        green: 'border-l-4 border-green-500',
    };

    return (
        <div className={`bg-white rounded-lg shadow-sm p-6 ${colors[color]}`}>
            <h3 className="text-gray-500 text-sm font-medium uppercase tracking-wider">{title}</h3>
            <p className="text-2xl font-bold text-gray-800 mt-2">{value}</p>
        </div>
    );
}