import { useState, useEffect } from 'react';
import { Package, TrendingUp, AlertTriangle, Loader2, DollarSign } from 'lucide-react';
import { supabase } from '../supabaseClient';

export default function Home() {
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalCosts: 0,
    lowStockCount: 0
  });
  const [lowStockProducts, setLowStockProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const { data: salesData, error: salesError } = await supabase
        .from('sales')
        .select('total_price')
        .eq('type', 'venda')
        .is('deleted_at', null);

      if (salesError) throw salesError;
      const revenue = salesData?.reduce((acc, curr) => acc + Number(curr.total_price), 0) || 0;

      const { data: importsData, error: importsError } = await supabase
        .from('imports')
        .select('total_cost_brl');

      if (importsError) throw importsError;
      const costs = importsData?.reduce((acc, curr) => acc + Number(curr.total_cost_brl), 0) || 0;

      const { data: lowStockData, error: stockError } = await supabase
        .from('products')
        .select('name, stock_quantity, brand:brand_id (name)')
        .is('deleted_at', null)
        .lte('stock_quantity', 5)
        .order('stock_quantity', { ascending: true })
        .limit(6);

      if (stockError) throw stockError;

      setStats({
        totalRevenue: revenue,
        totalCosts: costs,
        lowStockCount: lowStockData?.length || 0
      });
      setLowStockProducts(lowStockData || []);

    } catch (error) {
      console.error("Erro ao carregar dados do dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatBRL = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[80vh]">
        <Loader2 className="animate-spin h-12 w-12 text-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
        <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Painel de Controle</h2>
            <p className="text-gray-500">Resumo financeiro e operacional da loja.</p>
        </div>

        {/* Cards de Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <SummaryCard 
              title="Faturamento Bruto" 
              value={formatBRL(stats.totalRevenue)} 
              color="green" 
              icon={<TrendingUp size={24} />} 
            />
            <SummaryCard 
              title="Custo Importações" 
              value={formatBRL(stats.totalCosts)} 
              color="blue" 
              icon={<DollarSign size={24} />} 
            />
            <SummaryCard 
              title="Estoque Crítico (<= 5)" 
              value={`${stats.lowStockCount} produtos`} 
              color={stats.lowStockCount > 0 ? "red" : "yellow"} 
              icon={<AlertTriangle size={24} />} 
            />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 lg:col-span-2 overflow-hidden">
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center gap-2">
                <Package className="text-gray-500" size={20} />
                <h3 className="font-bold text-gray-700">Atenção ao Estoque</h3>
              </div>
              
              <div className="p-0">
                {lowStockProducts.length > 0 ? (
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-white border-b border-gray-100">
                      <tr>
                        <th className="px-6 py-3 text-xs font-semibold text-gray-400 uppercase">Produto</th>
                        <th className="px-6 py-3 text-xs font-semibold text-gray-400 uppercase text-right">Qtd. Atual</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {lowStockProducts.map((product, idx) => (
                        <tr key={idx} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4">
                            <p className="font-medium text-gray-800">{product.name}</p>
                            <p className="text-xs text-gray-500">{product.brand?.name || 'Sem marca'}</p>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                              product.stock_quantity === 0 ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
                            }`}>
                              {product.stock_quantity} un.
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="p-8 text-center text-gray-500 flex flex-col items-center">
                    <Package size={48} className="text-green-200 mb-3" />
                    <p>Todo o estoque está em níveis saudáveis!</p>
                  </div>
                )}
              </div>
          </div>

          {/* Card de Lucro Bruto Estimado */}
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-lg shadow-lg border border-gray-700 p-6 flex flex-col justify-between">
            <div>
              <h3 className="text-gray-400 text-sm font-medium uppercase tracking-wider mb-1">Lucro Bruto Estimado</h3>
              <p className="text-xs text-gray-500 mb-6">Faturamento (-) Custos de Importação</p>
              
              <div className="text-4xl font-black text-white">
                {formatBRL(stats.totalRevenue - stats.totalCosts)}
              </div>
            </div>
            
            <div className="mt-8 bg-white/10 p-4 rounded-lg border border-white/5">
              <p className="text-sm text-gray-300">
                A margem de lucro real depende de outros fatores operacionais (frete local, impostos de venda, taxas de cartão, etc).
              </p>
            </div>
          </div>
        </div>
    </div>
  );
}

function SummaryCard({ title, value, color, icon }: any) {
    const colorStyles: any = {
        blue: 'border-l-4 border-blue-500 text-blue-600 bg-blue-50',
        yellow: 'border-l-4 border-yellow-500 text-yellow-600 bg-yellow-50',
        green: 'border-l-4 border-green-500 text-green-600 bg-green-50',
        red: 'border-l-4 border-red-500 text-red-600 bg-red-50',
    };

    return (
        <div className={`bg-white rounded-xl shadow-sm p-6 ${colorStyles[color].split(' ')[0]} ${colorStyles[color].split(' ')[1]}`}>
            <div className="flex justify-between items-start">
                <div>
                    <h3 className="text-gray-500 text-xs font-bold uppercase tracking-wider">{title}</h3>
                    <p className={`text-2xl font-black mt-2 ${colorStyles[color].split(' ')[2]}`}>{value}</p>
                </div>
                <div className={`p-3 rounded-xl bg-opacity-20 ${colorStyles[color].split(' ')[3]}`}>
                    {icon}
                </div>
            </div>
        </div>
    );
}