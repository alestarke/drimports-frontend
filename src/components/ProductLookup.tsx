import { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, Package, Check, Plus } from 'lucide-react';

// Ajuste a interface com os campos que sua API retorna
interface Product {
  id: number;
  name: string;
  price: string | number;
  stock_quantity: number;
  brand?: { name: string };
}

interface ProductLookupProps {
  products: Product[];
  selectedId: number;
  onSelect: (id: number) => void;
  onAddNew?: (searchTerm: string) => void;
}

export default function ProductLookup({ products, selectedId, onSelect, onAddNew }: ProductLookupProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Encontra o produto selecionado para exibir no input quando fechado
  const selectedProduct = products.find(p => p.id === selectedId);

  // Filtra os produtos com base no que o usuário digitou
  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.brand?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Fecha o dropdown se o usuário clicar fora dele
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Formatador de moeda
  const formatBRL = (val: string | number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(val));

  return (
    <div ref={wrapperRef} className="relative w-full">
      
      {/* O INPUT "FALSO" QUE ABRE O DROPDOWN */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white flex items-center justify-between cursor-pointer focus-within:ring-2 focus-within:ring-blue-500"
      >
        <div className="flex items-center gap-2 overflow-hidden">
          {selectedProduct ? (
            <>
              <Package size={18} className="text-blue-600 flex-shrink-0" />
              <span className="truncate font-medium text-gray-800">{selectedProduct.name}</span>
            </>
          ) : (
            <span className="text-gray-400">Pesquisar produto...</span>
          )}
        </div>
        <ChevronDown size={18} className="text-gray-400 flex-shrink-0" />
      </div>

      {/* O DROPDOWN (A MÁGICA ACONTECE AQUI) */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl overflow-hidden">
          
          {/* Barra de Pesquisa */}
          <div className="p-2 border-b border-gray-100 bg-gray-50">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
              <input
                type="text"
                autoFocus
                placeholder="Digite o nome ou marca..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-300 rounded outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Cabeçalho das Colunas */}
          <div className="grid grid-cols-12 gap-2 px-4 py-2 bg-gray-100 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase">
             <div className="col-span-6">Produto / Marca</div>
             <div className="col-span-3 text-right">Estoque</div>
             <div className="col-span-3 text-right">Preço</div>
          </div>

          {/* Lista de Produtos Filtrados */}
          <div className="max-h-60 overflow-y-auto">
            {filteredProducts.length > 0 ? (
              filteredProducts.map((product) => (
                <div
                  key={product.id}
                  onClick={() => {
                    onSelect(product.id);
                    setIsOpen(false);
                    setSearchTerm('');
                  }}
                  className={`grid grid-cols-12 gap-2 px-4 py-3 cursor-pointer border-b border-gray-50 hover:bg-blue-50 transition-colors items-center ${
                    selectedId === product.id ? 'bg-blue-50/50' : ''
                  }`}
                >
                      <div className="col-span-6 flex items-center gap-2">
                          {selectedId === product.id ? <Check size={16} className="text-blue-600 flex-shrink-0" /> : <div className="w-4 flex-shrink-0" />}

                          {/* O SEGREDO ESTÁ AQUI: min-w-0 flex-1 */}
                          <div className="min-w-0 flex-1">
                              <p
                                  className="text-sm font-medium text-gray-800 truncate block"
                                  title={product.name}
                              >
                                  {product.name}
                              </p>
                              <p className="text-xs text-gray-500 truncate block">
                                  {product.brand?.name || 'Sem marca'}
                              </p>
                          </div>
                      </div>
                  <div className="col-span-3 text-right">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${product.stock_quantity > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {product.stock_quantity} un.
                    </span>
                  </div>
                  <div className="col-span-3 text-right text-sm font-medium text-gray-700">
                    {formatBRL(product.price)}
                  </div>
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-sm text-gray-500">
                Nenhum produto encontrado.
              </div>
            )}
          </div>
          {/* BOTÃO DE CADASTRO RÁPIDO */}
          {onAddNew && (
            <div
              onClick={() => {
                onAddNew(searchTerm);
                setIsOpen(false);
              }}
              className="p-3 bg-gray-50 border-t border-gray-200 text-sm font-medium text-blue-600 hover:bg-blue-100 hover:text-blue-700 cursor-pointer flex items-center justify-center gap-2 transition-colors"
            >
              <Plus size={18} />
              {searchTerm ? `Cadastrar "${searchTerm}"` : 'Cadastrar Novo Produto'}
            </div>
          )}
        </div>
      )}
    </div>
  );
}