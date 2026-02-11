import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard'; // Layout
import Home from './pages/Home';
import Products from './pages/Products';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        
        {/* Rota /dashboard -> Carrega Layout + Home */}
        <Route path="/dashboard" element={
            <Dashboard>
                <Home />
            </Dashboard>
        } />

        {/* Rota /products -> Carrega Layout + Products */}
        <Route path="/products" element={
            <Dashboard>
                <Products />
            </Dashboard>
        } />
        
        {/* Futuras rotas ficam limpas assim também: */}
        {/* <Route path="/clients" element={<Dashboard><Clients /></Dashboard>} /> */}

      </Routes>
    </BrowserRouter>
  );
}

export default App;