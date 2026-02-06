import { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Package } from 'lucide-react';
import api from '../services/api';

// 1. Interface (Define o formato do dado, igual no Angular)
interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  stock_quantity: number;
  brand?: { name: string }; 
  category?: { name: string }
}

export default function Products() {
  // 2. Estados (Variáveis)
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // 3. Busca de Dados (O equivalente ao ngOnInit)
  useEffect(() => {
    fetchProducts();
  }, []); // Array vazio [] garante que rode apenas 1 vez ao iniciar

  const fetchProducts = async () => {
    try {
      const response = await api.get('/products');
      setProducts(response.data.data);
    } catch (err) {
      setError('Erro ao carregar produtos. Verifique se a API está rodando.');
      console.error('Erro ao buscar produtos:', err);
    } finally {
      setLoading(false);
    }
  };

  // Função auxiliar para formatar dinheiro (Substitui o Pipe | currency do Angular)
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      
      {/* Cabeçalho da Página */}
      <div className="flex justify-between items-center mb-6">
        <div>
            <h1 className="text-2xl font-bold text-gray-800">Produtos</h1>
            <p className="text-gray-500">Gerencie seu catálogo de importações</p>
        </div>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors">
          <Plus size={20} />
          Novo Produto
        </button>
      </div>

      {/* Barra de Filtros (Visual) */}
      <div className="bg-white p-4 rounded-lg shadow-sm mb-6 flex gap-4">
        <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input 
                type="text" 
                placeholder="Buscar produto..." 
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
        </div>
      </div>

      {/* Tabela de Listagem */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Produto</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Preço</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Estoque</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                        <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
                            <Package size={24} />
                        </div>
                        <div>
                            <p className="font-medium text-gray-900">{product.name}</p>
                            <p className="text-sm text-gray-500 truncate max-w-xs">{product.description}</p>
                        </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-900">
                    {formatCurrency(product.price)}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium
                        ${product.stock_quantity > 10 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}
                    `}>
                        {product.stock_quantity} unid.
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button className="text-gray-400 hover:text-blue-600 transition-colors p-1">
                        <Edit size={18} />
                    </button>
                    <button className="text-gray-400 hover:text-red-600 transition-colors p-1">
                        <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {/* Mensagem se lista vazia */}
          {products.length === 0 && (
            <div className="p-8 text-center text-gray-500">
                Nenhum produto encontrado.
            </div>
          )}
        </div>
      )}
    </div>
  );
}