import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Package, 
  TrendingUp, 
  AlertTriangle, 
  Loader2, 
  DollarSign, 
  Plane,
  ArrowRight,
  PieChart as PieChartIcon,
  Utensils,
  Fuel,
  Ticket,
  Receipt,
  Sparkles,
  ShoppingBag,
  ExternalLink,
  ChevronRight,
  Boxes
} from 'lucide-react';
import { supabase } from '../supabaseClient';
import { formatBRL } from "../utils/formatters";

interface StockProduct {
  id?: string;
  name: string;
  stock_quantity: number;
  brand?: { name?: string } | { name?: string }[] | null | any;
}

const getBrandName = (brand: StockProduct['brand']): string => {
  if (!brand) return 'Sem marca definida';
  if (Array.isArray(brand)) return brand[0]?.name || 'Sem marca definida';
  return brand.name || 'Sem marca definida';
};

export default function Home() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalCosts: 0,
    tripsExpenses: 0,
    foodExpenses: 0,
    fuelExpenses: 0,
    tollExpenses: 0,
    otherExpenses: 0,
    lowStockCount: 0
  });
  const [lowStockProducts, setLowStockProducts] = useState<StockProduct[]>([]);
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
        .select('total_cost_brl')
        .is('deleted_at', null);

      if (importsError) throw importsError;
      const costs = importsData?.reduce((acc, curr) => acc + Number(curr.total_cost_brl), 0) || 0;

      const { data: tripsData, error: tripsError } = await supabase
        .from('trips')
        .select('food_expenses_brl, fuel_expenses_brl, toll_expenses_brl, other_expenses_brl')
        .is('deleted_at', null);
      if (tripsError) throw tripsError;

      const foodTotal = tripsData?.reduce((acc, curr) => acc + Number(curr.food_expenses_brl || 0), 0) || 0;
      const fuelTotal = tripsData?.reduce((acc, curr) => acc + Number(curr.fuel_expenses_brl || 0), 0) || 0;
      const tollTotal = tripsData?.reduce((acc, curr) => acc + Number(curr.toll_expenses_brl || 0), 0) || 0;
      const otherTotal = tripsData?.reduce((acc, curr) => acc + Number(curr.other_expenses_brl || 0), 0) || 0;
      const tripsExpenses = foodTotal + fuelTotal + tollTotal + otherTotal;

      const { data: lowStockData, error: stockError } = await supabase
        .from('products')
        .select('id, name, stock_quantity, brand:brand_id (name)')
        .is('deleted_at', null)
        .lte('stock_quantity', 5)
        .order('stock_quantity', { ascending: true })
        .limit(5);

      if (stockError) throw stockError;

      setStats({
        totalRevenue: revenue,
        totalCosts: costs,
        tripsExpenses: tripsExpenses,
        foodExpenses: foodTotal,
        fuelExpenses: fuelTotal,
        tollExpenses: tollTotal,
        otherExpenses: otherTotal,
        lowStockCount: lowStockData?.length || 0
      });
      setLowStockProducts((lowStockData as unknown as StockProduct[]) || []);

    } catch (error) {
      console.error("Erro ao carregar dados do dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const grossProfit = stats.totalRevenue - stats.totalCosts - stats.tripsExpenses;

  const rawCategories = [
    { 
      name: 'Alimentação', 
      value: stats.foodExpenses, 
      color: '#0284c7', 
      bgClass: 'bg-sky-500', 
      badgeClass: 'bg-sky-50 text-sky-700 border-sky-200',
      icon: Utensils 
    },
    { 
      name: 'Combustível', 
      value: stats.fuelExpenses, 
      color: '#f59e0b', 
      bgClass: 'bg-amber-500', 
      badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
      icon: Fuel 
    },
    { 
      name: 'Pedágio', 
      value: stats.tollExpenses, 
      color: '#6366f1', 
      bgClass: 'bg-indigo-500', 
      badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      icon: Ticket 
    },
    { 
      name: 'Outros', 
      value: stats.otherExpenses, 
      color: '#f43f5e', 
      bgClass: 'bg-rose-500', 
      badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
      icon: Receipt 
    },
  ];

  const activeCategories = rawCategories.filter(cat => cat.value > 0);

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-[75vh] gap-3">
        <Loader2 className="animate-spin h-10 w-10 text-blue-600" />
        <p className="text-sm font-medium text-slate-500">Carregando painel de controle...</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-5 md:p-6 bg-slate-50 min-h-full space-y-4 md:space-y-5 flex flex-col justify-between">
      
      {/* Top Header Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Painel de Controle</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Visão geral financeira e controle simplificado de estoque do ERP.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => navigate('/sales/new')}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 sm:py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs sm:text-sm rounded-xl shadow-xs transition-all duration-150 active:scale-95"
          >
            <ShoppingBag size={15} />
            <span>Nova Venda</span>
          </button>
          <button
            onClick={() => navigate('/imports/new')}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 sm:py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-medium text-xs sm:text-sm rounded-xl shadow-xs transition-all duration-150"
          >
            <Boxes size={15} />
            <span>Nova Importação</span>
          </button>
        </div>
      </div>

      {/* KPI CARDS (TOPO) - Enquadramento compacto de 5 colunas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        
        {/* CARD 1: LUCRO BRUTO ESTIMADO (Destaque Principal) */}
        <KpiCard 
          title="Lucro Bruto Estimado"
          subtext="Faturamento (-) Custos (-) Despesas"
          value={formatBRL(grossProfit)}
          icon={<Sparkles size={18} />}
          badgeText="Indicador Principal"
          badgeVariant="emerald"
          isHighlighted={true}
        />

        {/* CARD 2: FATURAMENTO BRUTO */}
        <KpiCard 
          title="Faturamento Bruto"
          subtext="Total em vendas efetuadas"
          value={formatBRL(stats.totalRevenue)}
          icon={<TrendingUp size={18} />}
          badgeText="Receita"
          badgeVariant="blue"
        />

        {/* CARD 3: CUSTO IMPORTAÇÕES */}
        <KpiCard 
          title="Custo Importações"
          subtext="Custo total de aquisição"
          value={formatBRL(stats.totalCosts)}
          icon={<DollarSign size={18} />}
          badgeText="Estoque"
          badgeVariant="indigo"
        />

        {/* CARD 4: DESPESAS DE VIAGEM */}
        <KpiCard 
          title="Despesas de Viagem"
          subtext="Gastos logísticos totais"
          value={formatBRL(stats.tripsExpenses)}
          icon={<Plane size={18} />}
          badgeText="Operacional"
          badgeVariant="amber"
        />

        {/* CARD 5: ESTOQUE CRÍTICO */}
        <KpiCard 
          title="Estoque Crítico"
          subtext="Produtos com <= 5 un. em estoque"
          value={`${stats.lowStockCount} ${stats.lowStockCount === 1 ? 'item' : 'itens'}`}
          icon={<AlertTriangle size={18} />}
          badgeText={stats.lowStockCount > 0 ? "Atenção" : "Saudável"}
          badgeVariant={stats.lowStockCount > 0 ? "rose" : "slate"}
        />
      </div>

      {/* PAINÉIS PRINCIPAIS (GRID 2 COLUNAS COMPACTAS) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-5 flex-1">
        
        {/* COLUNA ESQUERDA: LISTA "ATENÇÃO AO ESTOQUE" (7/12 Colunas) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between">
          <div>
            {/* Header da Tabela */}
            <div className="p-3.5 px-4 border-b border-slate-100 flex items-center justify-between bg-white">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-rose-50 text-rose-600 border border-rose-100">
                  <AlertTriangle size={17} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-bold text-slate-900 text-sm">Atenção ao Estoque</h2>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700">
                      {lowStockProducts.length} críticos
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Produtos com quantidade igual ou inferior a 5 unidades
                  </p>
                </div>
              </div>

              <button
                onClick={() => navigate('/products')}
                className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline px-2 py-1 rounded-lg hover:bg-blue-50 transition-colors"
              >
                <span>Ver todos</span>
                <ArrowRight size={13} />
              </button>
            </div>

            {/* Conteúdo da Tabela / Lista */}
            <div className="overflow-x-auto">
              {lowStockProducts.length > 0 ? (
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50/70 border-b border-slate-100 text-slate-500 font-semibold text-[10px] uppercase tracking-wider">
                      <th className="px-4 py-2.5">Produto & Marca</th>
                      <th className="px-3 py-2.5">Status</th>
                      <th className="px-3 py-2.5 text-right">Qtd. Atual</th>
                      <th className="px-4 py-2.5 text-right">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {lowStockProducts.map((product, idx) => {
                      const isZero = product.stock_quantity === 0;
                      return (
                        <tr key={product.id || idx} className="hover:bg-slate-50/60 transition-colors group">
                          {/* Nome e Marca */}
                          <td className="px-4 py-2.5">
                            <p className="font-semibold text-slate-800 group-hover:text-blue-600 transition-colors">
                              {product.name}
                            </p>
                            <p className="text-[11px] text-slate-400 font-normal">
                              {getBrandName(product.brand)}
                            </p>
                          </td>

                          {/* Badge de Status */}
                          <td className="px-3 py-2.5">
                            {isZero ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-rose-50 text-rose-700 border border-rose-200/80">
                                <span className="relative flex h-1.5 w-1.5">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-rose-500"></span>
                                </span>
                                Esgotado
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-200/80">
                                <span className="h-1.5 w-1.5 rounded-full bg-amber-500"></span>
                                Nível Baixo
                              </span>
                            )}
                          </td>

                          {/* Qtd. Atual com Pill alinhada à direita */}
                          <td className="px-3 py-2.5 text-right whitespace-nowrap">
                            <span className={`inline-flex items-center justify-center font-semibold text-[11px] px-2.5 py-0.5 rounded-full font-mono border ${
                              isZero 
                                ? 'bg-rose-100/70 text-rose-800 border-rose-200' 
                                : 'bg-amber-100/70 text-amber-800 border-amber-200'
                            }`}>
                              {product.stock_quantity} un.
                            </span>
                          </td>

                          {/* Botão de Ação Rápida */}
                          <td className="px-4 py-2.5 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => navigate('/imports/new')}
                                className="px-2.5 py-1 text-[11px] font-medium bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white border border-blue-200/80 hover:border-blue-600 rounded-lg transition-all duration-150"
                                title="Repor via importação"
                              >
                                Repor
                              </button>
                              <button
                                onClick={() => navigate('/products')}
                                className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                                title="Ver detalhes"
                              >
                                <ExternalLink size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <div className="p-8 text-center flex flex-col items-center justify-center">
                  <div className="p-3 rounded-full bg-emerald-50 text-emerald-600 mb-2 border border-emerald-100">
                    <Package size={28} />
                  </div>
                  <h3 className="font-semibold text-slate-800 text-sm">Estoque Totalmente Saudável!</h3>
                  <p className="text-slate-500 text-xs mt-0.5 max-w-xs">
                    Nenhum produto em nível crítico de estoque.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Footer da tabela */}
          <div className="p-3 px-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Prioridade de reposição</span>
            <button 
              onClick={() => navigate('/products')}
              className="text-slate-600 hover:text-slate-900 font-medium flex items-center gap-1 hover:underline"
            >
              Gerenciar Produtos <ChevronRight size={13} />
            </button>
          </div>
        </div>

        {/* COLUNA DIREITA: DESPESAS POR CATEGORIA (5/12 Colunas) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-sm p-4 md:p-5 flex flex-col justify-between space-y-4">
          <div>
            {/* Header do Painel */}
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100">
                  <PieChartIcon size={17} />
                </div>
                <div>
                  <h2 className="font-bold text-slate-900 text-sm">Despesas por Categoria</h2>
                  <p className="text-[11px] text-slate-500">Distribuição visual dos custos de viagem</p>
                </div>
              </div>

              <span className="text-xs font-semibold px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 border border-slate-200 font-mono">
                {formatBRL(stats.tripsExpenses)}
              </span>
            </div>

            {/* Conteúdo Visual (Gráfico Donut + Progresso por Categoria) */}
            {stats.tripsExpenses > 0 && activeCategories.length > 0 ? (
              <div className="mt-3 space-y-3">
                
                {/* Visual Donut Chart SVG Component */}
                <div className="flex items-center justify-center py-1">
                  <DonutChart 
                    categories={activeCategories} 
                    total={stats.tripsExpenses} 
                  />
                </div>

                {/* Lista de Barras de Progresso por Categoria */}
                <div className="space-y-2.5 pt-1">
                  {activeCategories.map((cat, idx) => {
                    const percentage = Math.round((cat.value / stats.tripsExpenses) * 100);
                    const Icon = cat.icon;
                    return (
                      <div key={idx} className="space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <div className="flex items-center gap-1.5 font-medium text-slate-700">
                            <span className={`p-0.5 rounded ${cat.badgeClass} border`}>
                              <Icon size={12} />
                            </span>
                            <span>{cat.name}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-slate-400 font-mono text-[10px]">{percentage}%</span>
                            <span className="font-semibold text-slate-900 font-mono">{formatBRL(cat.value)}</span>
                          </div>
                        </div>

                        {/* Barra de Progresso Horizontal Estilizada */}
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden p-0.5 border border-slate-100">
                          <div 
                            className={`h-full rounded-full ${cat.bgClass} transition-all duration-500 ease-out`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="py-10 text-center flex flex-col items-center justify-center">
                <div className="p-3 rounded-full bg-slate-100 text-slate-400 mb-2 border border-slate-200/60">
                  <PieChartIcon size={28} />
                </div>
                <h3 className="font-semibold text-slate-800 text-xs">Sem Despesas de Viagem</h3>
                <p className="text-slate-500 text-[11px] mt-0.5 max-w-xs">
                  Nenhuma despesa registrada até o momento.
                </p>
              </div>
            )}
          </div>

          {/* Footer do Card de Despesas */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-[11px] text-slate-500">Categorias zeradas omitidas</span>
            <button
              onClick={() => navigate('/trips')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 hover:underline flex items-center gap-1"
            >
              Ver Viagens <ArrowRight size={12} />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

// ==========================================
// SUBCOMPONENTE: CARD DE KPI COMPACTO
// ==========================================

interface KpiCardProps {
  title: string;
  subtext: string;
  value: string;
  icon: React.ReactNode;
  badgeText: string;
  badgeVariant: 'emerald' | 'blue' | 'indigo' | 'amber' | 'rose' | 'slate';
  isHighlighted?: boolean;
}

function KpiCard({ 
  title, 
  subtext, 
  value, 
  icon, 
  badgeText, 
  badgeVariant,
  isHighlighted = false 
}: KpiCardProps) {

  const badgeStyles = {
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
    blue: 'bg-blue-50 text-blue-700 border-blue-200/80',
    indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200/80',
    amber: 'bg-amber-50 text-amber-700 border-amber-200/80',
    rose: 'bg-rose-50 text-rose-700 border-rose-200/80',
    slate: 'bg-slate-100 text-slate-700 border-slate-200',
  };

  const iconStyles = {
    emerald: 'bg-emerald-100/80 text-emerald-700 border-emerald-200/60',
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    rose: 'bg-rose-50 text-rose-600 border-rose-100',
    slate: 'bg-slate-100 text-slate-600 border-slate-200',
  };

  return (
    <div 
      className={`rounded-xl p-3.5 transition-all duration-200 flex flex-col justify-between relative overflow-hidden ${
        isHighlighted
          ? 'bg-gradient-to-br from-emerald-50/80 via-white to-white border-2 border-emerald-300 shadow-xs shadow-emerald-500/10 ring-1 ring-emerald-500/10 hover:border-emerald-400'
          : 'bg-white border border-slate-200 shadow-xs hover:border-slate-300'
      }`}
    >
      {/* Top Header inside Card */}
      <div className="flex items-start justify-between gap-1.5">
        <div className="space-y-0.5">
          <span className={`text-[10px] font-bold uppercase tracking-wider block ${
            isHighlighted ? 'text-emerald-800 font-extrabold' : 'text-slate-500'
          }`}>
            {title}
          </span>
          <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-semibold border ${badgeStyles[badgeVariant]}`}>
            {badgeText}
          </span>
        </div>

        <div className={`p-1.5 rounded-lg border ${iconStyles[badgeVariant]}`}>
          {icon}
        </div>
      </div>

      {/* Main Numeric Value */}
      <div className="mt-2.5">
        <div className="text-lg xl:text-xl font-extrabold text-slate-900 tracking-tight font-mono truncate">
          {value}
        </div>
        <p className="text-[10px] text-slate-400 mt-0.5 font-normal leading-tight truncate">
          {subtext}
        </p>
      </div>
    </div>
  );
}

// ==========================================
// SUBCOMPONENTE: DONUT CHART COMPACTO (SVG)
// ==========================================

interface CategoryItem {
  name: string;
  value: number;
  color: string;
  bgClass: string;
}

function DonutChart({ categories, total }: { categories: CategoryItem[]; total: number }) {
  const radius = 35;
  const circumference = 2 * Math.PI * radius; // ≈ 219.91

  let accumulatedPercent = 0;

  return (
    <div className="relative flex items-center justify-center">
      <svg width="128" height="128" viewBox="0 0 100 100" className="transform -rotate-90">
        {/* Circle background ring */}
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="transparent"
          stroke="#f1f5f9"
          strokeWidth="11"
        />

        {/* Dynamic Category Slices */}
        {categories.map((cat, idx) => {
          const percent = cat.value / total;
          const strokeDasharray = `${percent * circumference} ${circumference}`;
          const strokeDashoffset = -(accumulatedPercent * circumference);
          accumulatedPercent += percent;

          return (
            <circle
              key={idx}
              cx="50"
              cy="50"
              r={radius}
              fill="transparent"
              stroke={cat.color}
              strokeWidth="11"
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
              className="transition-all duration-700 ease-in-out hover:opacity-85"
            />
          );
        })}
      </svg>

      {/* Legend inside Donut Ring */}
      <div className="absolute flex flex-col items-center justify-center text-center">
        <span className="text-[9px] font-semibold uppercase tracking-wider text-slate-400">Total</span>
        <span className="text-xs font-extrabold text-slate-900 font-mono">
          {formatBRL(total)}
        </span>
      </div>
    </div>
  );
}