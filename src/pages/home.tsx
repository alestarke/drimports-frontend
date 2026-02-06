// src/pages/Home.tsx
import { Package, TrendingUp, AlertCircle } from 'lucide-react';

export default function Home() {
  return (
    <div>
        <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Painel de Controle</h2>
            <p className="text-gray-500">Bem-vindo de volta, André.</p>
        </div>

        {/* Cards de Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <SummaryCard title="Total Importado" value="R$ 145.200" color="blue" icon={<TrendingUp />} />
            <SummaryCard title="Processos Ativos" value="12" color="yellow" icon={<Package />} />
            <SummaryCard title="Aguardando Pagamento" value="4" color="green" icon={<AlertCircle />} />
        </div>

        {/* Espaço para conteúdo futuro */}
        <div className="bg-white rounded-lg shadow-sm p-6 h-96 border border-gray-200 flex items-center justify-center">
            <p className="text-gray-400">Gráficos de desempenho virão aqui...</p>
        </div>
    </div>
  );
}

// Pequeno componente local para os cards
function SummaryCard({ title, value, color, icon }: any) {
    const colors: any = {
        blue: 'border-l-4 border-blue-500 text-blue-600',
        yellow: 'border-l-4 border-yellow-500 text-yellow-600',
        green: 'border-l-4 border-green-500 text-green-600',
    };

    return (
        <div className={`bg-white rounded-lg shadow-sm p-6 ${colors[color].split(' ')[0]}`}>
            <div className="flex justify-between items-start">
                <div>
                    <h3 className="text-gray-500 text-sm font-medium uppercase tracking-wider">{title}</h3>
                    <p className="text-2xl font-bold text-gray-800 mt-2">{value}</p>
                </div>
                <div className={`p-2 rounded-lg bg-opacity-10 ${colors[color].replace('border-l-4', 'bg')}`}>
                    {icon}
                </div>
            </div>
        </div>
    );
}