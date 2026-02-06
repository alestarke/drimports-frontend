import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/login';
import DashboardLayout from './pages/dashboard'; // O arquivo Dashboard agora é o Layout
import Home from './pages/home'; // O conteúdo da home
import Products from './pages/products'; // A lista de produtos

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rota Padrão */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        
        {/* ROTAS ANINHADAS (Nested Routes) */}
        {/* O DashboardLayout envolve todas as rotas filhas */}
        <Route path="/dashboard" element={<DashboardLayout />}>
            
            {/* index: Significa que essa é a rota padrão quando acessa /dashboard */}
            <Route index element={<Home />} /> 
            
            {/* Acessível em /dashboard/products */}
            <Route path="products" element={<Products />} />
            
            {/* Exemplo futuro */}
            {/* <Route path="clients" element={<Clients />} /> */}
            
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;