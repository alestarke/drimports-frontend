import { useState, useEffect } from 'react';
import { 
  Tag, 
  Plus, 
  Edit, 
  Trash2, 
  RefreshCw, 
  Search, 
  TrendingUp, 
  TrendingDown, 
  Lock 
} from 'lucide-react';
import { financialService, FinancialModality } from '../../services/financialService';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';

export default function FinancialModalities() {
  const [modalities, setModalities] = useState<FinancialModality[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingModality, setEditingModality] = useState<FinancialModality | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [type, setType] = useState<'income' | 'expense' | 'both'>('expense');
  const [color, setColor] = useState('#ef4444');

  const loadModalities = async () => {
    try {
      setLoading(true);
      const data = await financialService.getModalities();
      setModalities(data);
    } catch (error: any) {
      toast.error('Erro ao carregar modalidades: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadModalities();
  }, []);

  const handleOpenModal = (modality?: FinancialModality) => {
    if (modality) {
      setEditingModality(modality);
      setName(modality.name);
      setType(modality.type);
      setColor(modality.color || '#ef4444');
    } else {
      setEditingModality(null);
      setName('');
      setType('expense');
      setColor('#ef4444');
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Informe o nome da modalidade/categoria');
      return;
    }

    try {
      if (editingModality) {
        await financialService.updateModality(editingModality.id, {
          name,
          type,
          color
        });
        toast.success('Modalidade atualizada com sucesso!');
      } else {
        await financialService.createModality({
          name,
          type,
          color,
          icon: 'Tag'
        });
        toast.success('Modalidade criada com sucesso!');
      }
      setIsModalOpen(false);
      loadModalities();
    } catch (error: any) {
      toast.error('Erro ao salvar modalidade: ' + error.message);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    const result = await Swal.fire({
      title: `Excluir "${name}"?`,
      text: "Esta ação é irreversível e removerá esta categoria.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Sim, excluir',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        await financialService.deleteModality(id);
        toast.success('Modalidade excluída com sucesso!');
        loadModalities();
      } catch (error: any) {
        toast.error('Erro ao excluir modalidade: ' + error.message);
      }
    }
  };

  const filteredModalities = modalities.filter(m => {
    const matchesSearch = m.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || m.type === filterType || m.type === 'both';
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Tag className="text-emerald-600" size={28} />
            Modalidades & Categorias de Gastos
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Cadastre modalidades para classificar seus gastos pessoais, custos de importação e receitas
          </p>
        </div>

        <button
          onClick={() => handleOpenModal()}
          className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-semibold transition-all shadow-md hover:shadow-emerald-600/20 text-sm"
        >
          <Plus size={18} />
          Nova Modalidade
        </button>
      </div>

      {/* Busca & Filtros por Tipo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-3 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Buscar por nome da categoria..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${filterType === 'all' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            Todas ({modalities.length})
          </button>
          <button
            onClick={() => setFilterType('expense')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${filterType === 'expense' ? 'bg-rose-600 text-white' : 'bg-rose-50 text-rose-700 hover:bg-rose-100'}`}
          >
            Gastos/Despesas
          </button>
          <button
            onClick={() => setFilterType('income')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${filterType === 'income' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}`}
          >
            Receitas
          </button>
        </div>
      </div>

      {/* Grid de Modalidades */}
      {loading ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
          <RefreshCw className="animate-spin text-emerald-600 mx-auto mb-2" size={32} />
          <p className="text-slate-500 font-medium">Carregando modalidades...</p>
        </div>
      ) : filteredModalities.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 p-6">
          <Tag className="text-slate-300 mx-auto mb-3" size={48} />
          <p className="text-slate-700 font-semibold text-lg">Nenhuma modalidade encontrada</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredModalities.map((modality) => (
            <div 
              key={modality.id}
              className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-xs"
                    style={{ backgroundColor: modality.color || '#64748b' }}
                  >
                    {modality.type === 'income' ? (
                      <TrendingUp size={20} />
                    ) : (
                      <TrendingDown size={20} />
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm">{modality.name}</h3>
                    <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mt-1 ${
                      modality.type === 'income' 
                        ? 'bg-emerald-100 text-emerald-700' 
                        : 'bg-rose-100 text-rose-700'
                    }`}>
                      {modality.type === 'income' ? 'Receita' : 'Despesa/Gasto'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => handleOpenModal(modality)}
                    className="p-1.5 hover:bg-slate-100 text-slate-600 rounded-lg transition-colors"
                    title="Editar"
                  >
                    <Edit size={15} />
                  </button>
                  {!modality.is_system ? (
                    <button 
                      onClick={() => handleDelete(modality.id, modality.name)}
                      className="p-1.5 hover:bg-rose-50 text-rose-600 rounded-lg transition-colors"
                      title="Excluir"
                    >
                      <Trash2 size={15} />
                    </button>
                  ) : (
                    <span className="p-1.5 text-slate-300" title="Modalidade padrão do sistema">
                      <Lock size={14} />
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Criar / Editar */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in duration-200">
            <h2 className="text-xl font-bold text-slate-800 mb-4">
              {editingModality ? 'Editar Modalidade' : 'Nova Modalidade de Gasto ou Receita'}
            </h2>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Nome da Modalidade *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Cartão de Crédito, Aluguel, Mercado, Viagem..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Tipo *
                </label>
                <select
                  value={type}
                  onChange={(e: any) => setType(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                >
                  <option value="expense">Despesa / Gasto</option>
                  <option value="income">Receita / Entrada</option>
                  <option value="both">Ambos</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Cor Visual do Gráfico
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-10 h-10 rounded-lg cursor-pointer border border-slate-200 p-1"
                  />
                  <span className="text-xs text-slate-500 font-mono">{color}</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md transition-all"
                >
                  {editingModality ? 'Atualizar' : 'Salvar Modalidade'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
