import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Trash2, Filter, Loader2, Plus, Edit } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { formatBRL } from "../utils/formatters";
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';

interface Sale {
  id: number;
  client?: { name: string };
  product?: { name: string };
  product_id: number;
  client_id: number | null;
  quantity: number;
  unit_price: number;
  total_price: number;
  sale_date: string;
  type: 'venda' | 'doacao' | 'brinde' | 'perda';
}

export default function Sales() {
  const navigate = useNavigate();
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);

  // --- FILTRO E PAGINAÇÃO ---
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('todos');
  const [currentPage, setCurrentPage] = useState(1);
  const itensPerPage = 12;

  useEffect(() => { 
    fetchSales(); 
  }, []);

  const fetchSales = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('sales')
        .select(`*, client:client_id ( name ), product:product_id ( name )`)
        .is('deleted_at', null)
        .order('sale_date', { ascending: false });

      if (error) throw error;
      setSales(data || []);
    } catch (error: any) { 
      toast.error('Erro ao buscar vendas: ' + error.message); 
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    const saleToDelete = sales.find(s => s.id === id);
    const result = await Swal.fire({
      title: 'Cancelar Operação?',
      text: "O estoque será devolvido ao produto.",
      icon: 'warning',
      showCancelButton: true,
      cancelButtonColor: '#3085d6',
      cancelButtonText: 'Não, manter',
      confirmButtonColor: '#d33',
      confirmButtonText: 'Sim, cancelar'
    });

    if (result.isConfirmed) {
      try {
        if (saleToDelete) {
          const { data: prod } = await supabase.from('products').select('stock_quantity').eq('id', saleToDelete.product_id).single();
          if (prod) {
            await supabase.from('products').update({ stock_quantity: prod.stock_quantity + saleToDelete.quantity }).eq('id', saleToDelete.product_id);
          }
        }
        await supabase.from('sales').update({ deleted_at: new Date().toISOString() }).eq('id', id);
        setSales(prev => prev.filter(s => s.id !== id));
        toast.success('Operação cancelada e estoque estornado!');
      } catch (error: any) { 
        toast.error(error.message); 
      }
    }
  };

  // FILTRAGEM
  const filteredSales = sales.filter(sale => {
    const matchesSearch = 
      sale.product?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.client?.name?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = typeFilter === 'todos' || sale.type === typeFilter;

    return matchesSearch && matchesType;
  });

  // PAGINAÇÃO
  const totalPages = Math.ceil(filteredSales.length / itensPerPage);
  const paginatedSales = filteredSales.slice(
    (currentPage - 1) * itensPerPage,
    currentPage * itensPerPage
  );

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'venda': return <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full text-xs font-semibold">🟢 Venda</span>;
      case 'doacao': return <span className="bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full text-xs font-semibold">🤝 Doação</span>;
      case 'brinde': return <span className="bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded-full text-xs font-semibold">🎁 Brinde</span>;
      case 'perda': return <span className="bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded-full text-xs font-semibold">🔴 Perda</span>;
      default: return null;
    }
  };

  return (
    <div className="p-4 sm:p-5 md:p-6 bg-slate-50 h-full flex flex-col justify-between overflow-hidden space-y-3.5">

      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 flex-none">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Vendas & Operações</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">Histórico de vendas efetuadas e movimentações de saída</p>
        </div>
        <button
          onClick={() => navigate('/sales/new')}
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-medium text-sm transition-all shadow-xs active:scale-95"
        >
          <Plus size={18} /> Nova Operação
        </button>
      </div>

      {/* Busca e Filtros */}
      <div className="bg-white p-3 sm:p-3.5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 flex-none">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
          <input
            type="text"
            placeholder="Buscar por produto ou cliente..."
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="text-slate-400 h-4 w-4" />
          <select
            value={typeFilter}
            onChange={(e) => { setTypeFilter(e.target.value); setCurrentPage(1); }}
            className="px-3.5 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white font-medium text-slate-700"
          >
            <option value="todos">Todos os Tipos</option>
            <option value="venda">Apenas Vendas</option>
            <option value="brinde">Brindes</option>
            <option value="doacao">Doações</option>
            <option value="perda">Perdas / Avarias</option>
          </select>
        </div>
      </div>

      {/* Tabela com Scroll isolado apenas no card */}
      {loading ? (
        <div className="flex flex-col justify-center items-center flex-1 gap-3">
          <Loader2 className="animate-spin h-10 w-10 text-blue-600" />
          <p className="text-sm text-slate-500">Carregando vendas...</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex-1 flex flex-col min-h-0 justify-between">
          <div className="flex-1 min-h-0 overflow-y-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead className="bg-slate-50/90 backdrop-blur-xs border-b border-slate-100 text-slate-500 font-semibold text-[11px] uppercase tracking-wider sticky top-0 z-10">
                <tr>
                  <th className="px-5 py-3">Data</th>
                  <th className="px-5 py-3">Produto</th>
                  <th className="px-5 py-3">Cliente</th>
                  <th className="px-5 py-3">Tipo</th>
                  <th className="px-5 py-3 text-center">Qtd.</th>
                  <th className="px-5 py-3 text-right">Total</th>
                  <th className="px-5 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedSales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-5 py-2.5 whitespace-nowrap text-slate-500 font-mono text-xs">
                      {new Date(sale.sale_date).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-5 py-2.5 font-semibold text-slate-800">
                      {sale.product?.name || 'Produto removido'}
                    </td>
                    <td className="px-5 py-2.5 text-slate-600 text-xs">
                      {sale.client?.name || <span className="text-slate-400 italic">Sem cliente</span>}
                    </td>
                    <td className="px-5 py-2.5">
                      {getTypeBadge(sale.type)}
                    </td>
                    <td className="px-5 py-2.5 text-center font-semibold font-mono text-slate-800">
                      {sale.quantity} un.
                    </td>
                    <td className="px-5 py-2.5 text-right font-extrabold text-slate-900 font-mono">
                      {formatBRL(sale.total_price)}
                    </td>
                    <td className="px-5 py-2.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => navigate(`/sales/edit/${sale.id}`)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(sale.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Cancelar e devolver estoque"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {paginatedSales.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-500 italic">
                      Nenhuma operação encontrada.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Paginação */}
          {totalPages > 1 && (
            <div className="p-3 px-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between flex-none text-xs text-slate-500">
              <span>
                Página {currentPage} de {totalPages} ({filteredSales.length} operações)
              </span>
              <div className="flex gap-2">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  className="px-3 py-1 text-xs font-semibold bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40"
                >
                  Anterior
                </button>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  className="px-3 py-1 text-xs font-semibold bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40"
                >
                  Próxima
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}