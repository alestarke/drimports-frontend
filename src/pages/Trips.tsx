import { useState, useEffect } from 'react';
import { Plane, Plus, Search, Trash2, Loader2, Edit, Save } from 'lucide-react';
import { supabase } from '../supabaseClient';
import Modal from '../components/Modal';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';
import { NumericFormat } from 'react-number-format';
import { formatBRL } from '../utils/formatters';

interface Trip {
  id: number;
  name: string;
  travel_date: string;
  expenses_brl: number;
  food_expenses_brl: number;
  fuel_expenses_brl: number;
  toll_expenses_brl: number;
  other_expenses_brl: number;
  created_at: string;
}

export default function Trips() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const today = new Date().toISOString().split('T')[0];

  const [formData, setFormData] = useState({
    name: '',
    travel_date: today,
    food_expenses_brl: '' as number | string,
    fuel_expenses_brl: '' as number | string,
    toll_expenses_brl: '' as number | string,
    other_expenses_brl: '' as number | string
  });

  // --- PAGINAÇÃO ---
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    fetchTrips();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const fetchTrips = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('trips')
        .select('*')
        .is('deleted_at', null)
        .order('travel_date', { ascending: false });
      
      if (error) throw error;
      setTrips(data || []);
    } catch (error: any) {
      toast.error('Erro ao buscar viagens: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleEdit = (trip: Trip) => {
    setEditingId(trip.id);
    setFormData({
      name: trip.name,
      travel_date: trip.travel_date.substring(0, 10),
      food_expenses_brl: trip.food_expenses_brl || '',
      fuel_expenses_brl: trip.fuel_expenses_brl || '',
      toll_expenses_brl: trip.toll_expenses_brl || '',
      other_expenses_brl: trip.other_expenses_brl || ''
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    const result = await Swal.fire({
      title: 'Tem certeza?',
      text: "Isso não apagará as importações vinculadas, mas a viagem será removida.",
      icon: 'warning',
      showCancelButton: true,
      cancelButtonText: 'Cancelar',
      confirmButtonText: 'Sim, excluir',
      confirmButtonColor: '#d33',
    });

    if (result.isConfirmed) {
      try {
        const { error } = await supabase.from('trips').update({ deleted_at: new Date().toISOString() }).eq('id', id);
        if (error) throw error;
        setTrips(prev => prev.filter(t => t.id !== id));
        toast.success('Viagem excluída!');
      } catch (error: any) {
        toast.error('Erro ao excluir: ' + error.message);
      }
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return toast.error("O nome da viagem é obrigatório!");

    setSaving(true);
    try {
      const food = Number(formData.food_expenses_brl) || 0;
      const fuel = Number(formData.fuel_expenses_brl) || 0;
      const toll = Number(formData.toll_expenses_brl) || 0;
      const other = Number(formData.other_expenses_brl) || 0;
      const totalExpenses = food + fuel + toll + other;

      const payload = {
        name: formData.name.trim(),
        travel_date: formData.travel_date,
        food_expenses_brl: food,
        fuel_expenses_brl: fuel,
        toll_expenses_brl: toll,
        other_expenses_brl: other,
        expenses_brl: totalExpenses
      };

      if (editingId) {
        const { error } = await supabase.from('trips').update(payload).eq('id', editingId);
        if (error) throw error;
        toast.success('Viagem atualizada!');
      } else {
        const { error } = await supabase.from('trips').insert([payload]);
        if (error) throw error;
        toast.success('Viagem registrada!');
      }

      handleCloseModal();
      fetchTrips();
    } catch (error: any) {
      toast.error('Erro ao salvar: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({
      name: '',
      travel_date: today,
      food_expenses_brl: '',
      fuel_expenses_brl: '',
      toll_expenses_brl: '',
      other_expenses_brl: ''
    });
  };

  // Formatadores
  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString('pt-BR', { timeZone: 'UTC' });

  // Lógica de Filtro e Paginação
  const filteredTrips = trips.filter(trip => 
    trip.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredTrips.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentTrips = filteredTrips.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      {/* Cabeçalho */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Viagens</h1>
        <button 
          onClick={() => setIsModalOpen(true)} 
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-lg shadow-blue-600/20 transition-colors"
        >
          <Plus size={20} /> Nova Viagem
        </button>
      </div>

      {/* Filtro */}
      <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input 
            type="text" 
            placeholder="Pesquisar viagem..." 
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Tabela */}
      {loading ? (
        <div className="flex justify-center h-64 items-center"><Loader2 className="animate-spin h-10 w-10 text-blue-600" /></div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Nome / Descrição</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Data da Viagem</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Despesas (R$)</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {currentTrips.map((trip) => (
                <tr key={trip.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900 border-l-4 border-transparent hover:border-blue-500">
                    {trip.name}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {formatDate(trip.travel_date)}
                  </td>
                  <td className="px-6 py-4 font-medium text-red-600">
                    {formatBRL(trip.expenses_brl)}
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button onClick={() => handleEdit(trip)} className="text-gray-400 hover:text-blue-600 p-1 transition-colors"><Edit size={18} /></button>
                    <button onClick={() => handleDelete(trip.id)} className="text-gray-400 hover:text-red-600 p-1 transition-colors"><Trash2 size={18} /></button>
                  </td>
                </tr>
              ))}
              {currentTrips.length === 0 && (
                <tr><td colSpan={4} className="px-6 py-12 text-center text-gray-500 italic">Nenhuma viagem encontrada.</td></tr>
              )}
            </tbody>
          </table>

          {/* Paginação */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between bg-gray-50">
              <span className="text-sm text-gray-700">
                Mostrando <span className="font-medium">{startIndex + 1}</span> até <span className="font-medium">{Math.min(startIndex + ITEMS_PER_PAGE, filteredTrips.length)}</span> de <span className="font-medium">{filteredTrips.length}</span>
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 border border-gray-300 rounded text-sm text-gray-600 hover:bg-gray-100 disabled:opacity-50 transition-colors"
                >
                  Anterior
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`w-8 h-8 rounded text-sm border flex items-center justify-center transition-colors ${currentPage === page ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-300 text-gray-600 hover:bg-gray-100'}`}
                    >
                      {page}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 border border-gray-300 rounded text-sm text-gray-600 hover:bg-gray-100 disabled:opacity-50 transition-colors"
                >
                  Próxima
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODAL Cadastro/Edição de Viagem */}
      <Modal
        title={editingId ? "Editar Viagem" : "Registrar Nova Viagem"}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSave} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome / Descrição da Viagem</label>
            <div className="relative">
              <Plane className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input 
                type="text" 
                name="name" 
                value={formData.name} 
                onChange={handleInputChange} 
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                placeholder="Ex: Paraguai - Maio 2026" 
                required 
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data da Viagem</label>
              <input 
                type="date" 
                name="travel_date" 
                value={formData.travel_date} 
                onChange={handleInputChange} 
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                required 
              />
            </div>
          </div>

          <div className="border-t border-gray-200 py-2">
            <h3 className="text-sm font-bold text-gray-700 mb-3">Categorias de Despesas</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Alimentação (R$)</label>
                <NumericFormat
                  name="food_expenses_brl"
                  value={formData.food_expenses_brl}
                  thousandSeparator="."
                  decimalSeparator=","
                  prefix="R$ "
                  decimalScale={2}
                  allowNegative={false}
                  onValueChange={(values) => setFormData(prev => ({ ...prev, food_expenses_brl: values.floatValue ?? '' }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-red-600 font-medium"
                  placeholder="R$ 0,00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Combustível (R$)</label>
                <NumericFormat
                  name="fuel_expenses_brl"
                  value={formData.fuel_expenses_brl}
                  thousandSeparator="."
                  decimalSeparator=","
                  prefix="R$ "
                  decimalScale={2}
                  allowNegative={false}
                  onValueChange={(values) => setFormData(prev => ({ ...prev, fuel_expenses_brl: values.floatValue ?? '' }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-red-600 font-medium"
                  placeholder="R$ 0,00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pedágio (R$)</label>
                <NumericFormat
                  name="toll_expenses_brl"
                  value={formData.toll_expenses_brl}
                  thousandSeparator="."
                  decimalSeparator=","
                  prefix="R$ "
                  decimalScale={2}
                  allowNegative={false}
                  onValueChange={(values) => setFormData(prev => ({ ...prev, toll_expenses_brl: values.floatValue ?? '' }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-red-600 font-medium"
                  placeholder="R$ 0,00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Outros (R$)</label>
                <NumericFormat
                  name="other_expenses_brl"
                  value={formData.other_expenses_brl}
                  thousandSeparator="."
                  decimalSeparator=","
                  prefix="R$ "
                  decimalScale={2}
                  allowNegative={false}
                  onValueChange={(values) => setFormData(prev => ({ ...prev, other_expenses_brl: values.floatValue ?? '' }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-red-600 font-medium"
                  placeholder="R$ 0,00"
                />
              </div>
            </div>
            
            <div className="mt-4 flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-200">
              <span className="text-sm font-bold text-gray-700">Total de Despesas:</span>
              <span className="text-lg font-bold text-red-600">
                {formatBRL(
                  (Number(formData.food_expenses_brl) || 0) + 
                  (Number(formData.fuel_expenses_brl) || 0) + 
                  (Number(formData.toll_expenses_brl) || 0) + 
                  (Number(formData.other_expenses_brl) || 0)
                )}
              </span>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button type="button" onClick={handleCloseModal} className="px-5 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">Cancelar</button>
            <button type="submit" disabled={saving} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 font-medium shadow-md shadow-blue-600/20 disabled:opacity-70 transition-colors cursor-pointer">
              {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
              {saving ? 'Salvando...' : 'Salvar Viagem'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
