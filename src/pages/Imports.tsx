import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Edit, Trash2, Plus, Search, Loader2, Store, Calendar, Package, ArrowRight } from 'lucide-react';
import { supabase } from '../supabaseClient';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';
import { formatBRL, formatUSD } from '../utils/formatters';

interface ImportRecord {
  id: number;
  product?: { name: string; price: number };
  trip?: { name: string };
  product_id: number;
  trip_id: number | null;
  quantity: number;
  cost_price_usd: number;
  exchange_rate: number;
  extra_fees_brl: number;
  total_cost_brl: number;
  store_name: string;
  import_date: string;
}

export default function Imports() {
  const navigate = useNavigate();
  const [imports, setImports] = useState<ImportRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // PAGINAÇÃO
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    fetchImports();
  }, []);

  const fetchImports = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('imports')
        .select(`
          *,
          product:product_id ( name, price ),
          trip:trip_id ( name )
        `)
        .is('deleted_at', null)
        .order('import_date', { ascending: false });

      if (error) throw error;
      setImports(data || []);
    } catch (error: any) {
      toast.error('Erro ao buscar importações: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (importRecord: ImportRecord) => {
    const result = await Swal.fire({
      title: 'Tem certeza?',
      text: "O registro da compra será excluído.",
      icon: 'warning',
      showCancelButton: true,
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#d33',
      confirmButtonText: 'Sim, excluir'
    });

    if (result.isConfirmed) {
      try {
        const { error } = await supabase
          .from('imports')
          .update({ deleted_at: new Date().toISOString() })
          .eq('id', importRecord.id);

        if (error) throw error;
        setImports(prev => prev.filter(i => i.id !== importRecord.id));
        toast.success('Importação excluída!');
      } catch (error: any) {
        toast.error('Erro ao excluir: ' + error.message);
      }
    }
  };

  const filteredImports = imports.filter(imp => 
    imp.product?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    imp.store_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    imp.trip?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredImports.length / ITEMS_PER_PAGE);
  const paginatedImports = filteredImports.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <div className="p-6 md:p-8 bg-slate-50 min-h-screen">
      
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Importações & Compras</h1>
          <p className="text-sm text-slate-500 mt-0.5">Histórico de aquisições de produtos, custos em USD e cotações</p>
        </div>
        <button 
          onClick={() => navigate('/imports/new')}
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-medium text-sm transition-all shadow-xs active:scale-95"
        >
          <Plus size={18} /> Nova Importação
        </button>
      </div>

      {/* Busca */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm mb-6 flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
          <input 
            type="text" 
            placeholder="Buscar por produto, loja ou viagem..." 
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
          />
        </div>
      </div>

      {/* Tabela */}
      {loading ? (
        <div className="flex flex-col justify-center items-center h-64 gap-3">
          <Loader2 className="animate-spin h-10 w-10 text-blue-600" />
          <p className="text-sm text-slate-500">Carregando importações...</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between min-h-[400px]">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead className="bg-slate-50/70 border-b border-slate-100 text-slate-500 font-semibold text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">Data</th>
                  <th className="px-6 py-4">Produto & Loja</th>
                  <th className="px-6 py-4">Viagem</th>
                  <th className="px-6 py-4 text-center">Qtd.</th>
                  <th className="px-6 py-4 text-right">Custo USD</th>
                  <th className="px-6 py-4 text-right">Total R$</th>
                  <th className="px-6 py-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedImports.map((imp) => (
                  <tr key={imp.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-slate-500 font-mono text-xs">
                      {new Date(imp.import_date).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-slate-800">{imp.product?.name || 'Produto removido'}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{imp.store_name || 'Sem loja informada'}</p>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-600">
                      {imp.trip?.name || <span className="text-slate-400 italic">Sem viagem</span>}
                    </td>
                    <td className="px-6 py-4 text-center font-semibold font-mono text-slate-800">
                      {imp.quantity} un.
                    </td>
                    <td className="px-6 py-4 text-right font-mono font-medium text-slate-700 text-xs">
                      {formatUSD(imp.cost_price_usd)}
                    </td>
                    <td className="px-6 py-4 text-right font-extrabold text-slate-900 font-mono">
                      {formatBRL(imp.total_cost_brl)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => navigate(`/imports/edit/${imp.id}`)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Edit size={18} />
                        </button>
                        <button 
                          onClick={() => handleDelete(imp)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Excluir"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {paginatedImports.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-500 italic">
                      Nenhuma importação encontrada.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Paginação */}
          {totalPages > 1 && (
            <div className="p-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Página {currentPage} de {totalPages}
              </span>
              <div className="flex gap-2">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  className="px-3 py-1.5 text-xs font-semibold bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40"
                >
                  Anterior
                </button>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  className="px-3 py-1.5 text-xs font-semibold bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40"
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