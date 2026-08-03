import { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, Package, Check, Plus } from 'lucide-react';
import { formatBRL } from '../utils/formatters';

interface Product {
  id: number;
  name: string;
  price: string | number;
  stock_quantity: number;
  brand?: { name?: string } | { name?: string }[] | any;
}

interface ProductLookupProps {
  products: Product[];
  selectedId?: number;
  selectedProductId?: number;
  onSelect: (product: Product) => void;
  onAddNew?: (searchTerm: string) => void;
}

const getBrandName = (brand: any): string => {
  if (!brand) return 'Sem marca';
  if (Array.isArray(brand)) return brand[0]?.name || 'Sem marca';
  return brand.name || 'Sem marca';
};

export default function ProductLookup({ 
  products, 
  selectedId, 
  selectedProductId, 
  onSelect, 
  onAddNew 
}: ProductLookupProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);

  const currentSelectedId = selectedId || selectedProductId || 0;
  const selectedProduct = products.find(p => p.id === currentSelectedId);

  const filteredProducts = products.filter(product => {
    const brandName = getBrandName(product.brand);
    return (
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      brandName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={wrapperRef} className="relative w-full">
      
      {/* INPUT TRIGGER FALSO QUE ABRE O DROPDOWN */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl bg-white flex items-center justify-between cursor-pointer focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-colors shadow-2xs"
      >
        <div className="flex items-center gap-2.5 overflow-hidden min-w-0">
          {selectedProduct ? (
            <>
              <div className="p-1 rounded-md bg-blue-50 text-blue-600 flex-shrink-0">
                <Package size={16} />
              </div>
              <span className="truncate font-semibold text-slate-800 text-sm">{selectedProduct.name}</span>
            </>
          ) : (
            <span className="text-slate-400 text-sm">Pesquisar produto pelo nome ou marca...</span>
          )}
        </div>
        <ChevronDown size={17} className="text-slate-400 flex-shrink-0 ml-2" />
      </div>

      {/* DROPDOWN DE SELEÇÃO */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden">
          
          {/* Barra de Pesquisa */}
          <div className="p-2.5 border-b border-slate-100 bg-slate-50">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                autoFocus
                placeholder="Digite o nome ou marca..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl bg-white outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          {/* Cabeçalho das Colunas */}
          <div className="grid grid-cols-12 gap-2 px-4 py-2 bg-slate-100/70 border-b border-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
             <div className="col-span-6">Produto / Marca</div>
             <div className="col-span-3 text-right">Estoque</div>
             <div className="col-span-3 text-right">Preço</div>
          </div>

          {/* Lista de Produtos Filtrados */}
          <div className="max-h-60 overflow-y-auto divide-y divide-slate-50">
            {filteredProducts.length > 0 ? (
              filteredProducts.map((product) => {
                const isSelected = currentSelectedId === product.id;
                return (
                  <div
                    key={product.id}
                    onClick={() => {
                      onSelect(product);
                      setIsOpen(false);
                      setSearchTerm('');
                    }}
                    className={`grid grid-cols-12 gap-2 px-4 py-2.5 cursor-pointer hover:bg-blue-50/60 transition-colors items-center ${
                      isSelected ? 'bg-blue-50/50' : ''
                    }`}
                  >
                    <div className="col-span-6 flex items-center gap-2 min-w-0">
                      {isSelected ? <Check size={16} className="text-blue-600 flex-shrink-0" /> : <div className="w-4 flex-shrink-0" />}
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-slate-800 truncate" title={product.name}>
                          {product.name}
                        </p>
                        <p className="text-[11px] text-slate-400 truncate">
                          {getBrandName(product.brand)}
                        </p>
                      </div>
                    </div>
                    <div className="col-span-3 text-right">
                      <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold font-mono border ${
                        product.stock_quantity > 0 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                          : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}>
                        {product.stock_quantity} un.
                      </span>
                    </div>
                    <div className="col-span-3 text-right text-xs font-bold text-slate-900 font-mono">
                      {formatBRL(product.price)}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-6 text-center text-xs text-slate-400 italic">
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
              className="p-3 bg-slate-50 border-t border-slate-100 text-xs font-semibold text-blue-600 hover:bg-blue-50 cursor-pointer flex items-center justify-center gap-2 transition-colors"
            >
              <Plus size={16} />
              {searchTerm ? `Cadastrar "${searchTerm}"` : 'Cadastrar Novo Produto'}
            </div>
          )}
        </div>
      )}
    </div>
  );
}