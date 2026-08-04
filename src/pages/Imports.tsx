import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Edit, Trash2, Plus, Search, Loader2 } from 'lucide-react';
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

  // PAGINAÇÃO COMPACTA
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 11;

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
    <div className="p-4 sm:p-5 md:p-6 bg-slate-50 h-full flex flex-col justify-between overflow-hidden space-y-3.5">
      
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 flex-none">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Importações & Compras</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">Histórico de aquisições de produtos, custos em USD e cotações</p>
        </div>
        <button 
          onClick={() => navigate('/imports/new')}
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-medium text-sm transition-all shadow-xs active:scale-95"
        >
          <Plus size={18} /> Nova Importação
        </button>
      </div>

      {/* Busca */}
      <div className="bg-white p-3 sm:p-3.5 rounded-2xl border border-slate-200 shadow-xs flex gap-4 flex-none">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
          <input 
            type="text" 
            placeholder="Buscar por produto, loja ou viagem..." 
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
          />
        </div>
      </div>

      {/* Card da Tabela com Scroll isolado apenas no card */}
      {loading ? (
        <div className="flex flex-col justify-center items-center flex-1 gap-3">
          <Loader2 className="animate-spin h-10 w-10 text-blue-600" />
          <p className="text-sm text-slate-500">Carregando importações...</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex-1 flex flex-col min-h-0 justify-between">
          <div className="flex-1 min-h-0 overflow-y-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead className="bg-slate-50/90 backdrop-blur-xs border-b border-slate-100 text-slate-500 font-semibold text-[11px] uppercase tracking-wider sticky top-0 z-10">
                <tr>
                  <th className="px-5 py-3">Data</th>
                  <th className="px-5 py-3">Produto & Loja</th>
                  <th className="px-5 py-3">Viagem</th>
                  <th className="px-5 py-3 text-center">Qtd.</th>
                  <th className="px-5 py-3 text-right">Custo USD</th>
                  <th className="px-5 py-3 text-right">Total R$</th>
                  <th className="px-5 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedImports.map((imp) => (
                  <tr key={imp.id} className="hover:bg-slate-50/60 transition-colors h-[62px]">
                    <td className="px-5 py-2 whitespace-nowrap text-slate-500 font-mono text-xs">
                      {new Date(imp.import_date).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-5 py-2.5">
                      <p className="font-semibold text-slate-800">{imp.product?.name || 'Produto removido'}</p>
                      <p className="text-[11px] text-slate-400">{imp.store_name || 'Sem loja informada'}</p>
                    </td>
                    <td className="px-5 py-2.5 text-xs text-slate-600">
                      {imp.trip?.name || <span className="text-slate-400 italic">Sem viagem</span>}
                    </td>
                    <td className="px-5 py-2.5 text-center font-semibold font-mono text-slate-800">
                      {imp.quantity} un.
                    </td>
                    <td className="px-5 py-2.5 text-right font-mono font-medium text-slate-700 text-xs">
                      {formatUSD(imp.cost_price_usd)}
                    </td>
                    <td className="px-5 py-2.5 text-right font-extrabold text-slate-900 font-mono">
                      {formatBRL(imp.total_cost_brl)}
                    </td>
                    <td className="px-5 py-2.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button 
                          onClick={() => navigate(`/imports/edit/${imp.id}`)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Edit size={16} />
                        </button>
                        <button 
                          onClick={() => handleDelete(imp)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Excluir"
                        >
                          <Trash2 size={16} />
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

          {/* Paginação sempre visível para não quebrar o layout da lista */}
          <div className="p-3 px-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between flex-none text-xs text-slate-500 min-h-[52px]">
            {totalPages > 0 ? (
              <>
                <span>
                  Página {currentPage} de {totalPages} ({filteredImports.length} compras)
                </span>
                <div className="flex gap-2">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    className="px-3 py-1.5 text-xs font-semibold bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 transition-colors"
                  >
                    Anterior
                  </button>
                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    className="px-3 py-1.5 text-xs font-semibold bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 transition-colors"
                  >
                    Próxima
                  </button>
                </div>
              </>
            ) : (
              <span>Nenhum registro encontrado</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}