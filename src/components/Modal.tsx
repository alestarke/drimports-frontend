import { X } from 'lucide-react';

interface ModalProps {
  title: string;
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode; 
  maxWidth?: string;
}

export default function Modal({ title, isOpen, onClose, children, maxWidth = "max-w-3xl" }: ModalProps) {
  if (!isOpen) return null;

  return (
    // Overlay escuro (Fundo)
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fadeIn">
      
      {/* O Card Branco (Container) */}
      <div className={`bg-white rounded-lg shadow-xl w-full ${maxWidth} overflow-hidden transform transition-all`}>
        
        {/* Header Reutilizável */}
        <div className="flex justify-between items-center p-4 border-b border-gray-200 bg-gray-50">
          <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-200"
          >
            <X size={20} />
          </button>
        </div>

        {/* Conteúdo Dinâmico (Aqui entra seu formulário) */}
        <div className="p-6">
            {children}
        </div>
      </div>
    </div>
  );
}
