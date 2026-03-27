import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Home from './pages/Home';
import Products from './pages/Products';
import Brands from './pages/Brands';
import Categories from './pages/Categories';
import Imports from './pages/Imports';
import Clients from './pages/Clients';
import Sales from './pages/Sales';
import Users from './pages/Users';
import Settings from './pages/Settings';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rota raiz redireciona para login ou dashboard dependendo do guard */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        
        {/* Rota pública */}
        <Route path="/login" element={<Login />} />

        {/* Rotas Protegidas - Todas envolvidas pelo ProtectedRoute */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Dashboard><Home /></Dashboard>
          </ProtectedRoute>
        } />
        
        <Route path="/products" element={
          <ProtectedRoute>
            <Dashboard><Products /></Dashboard>
          </ProtectedRoute>
        } />
        
        <Route path="/brands" element={
          <ProtectedRoute>
            <Dashboard><Brands /></Dashboard>
          </ProtectedRoute>
        } />
        
        <Route path="/categories" element={
          <ProtectedRoute>
            <Dashboard><Categories /></Dashboard>
          </ProtectedRoute>
        } />
        
        <Route path="/imports" element={
          <ProtectedRoute>
            <Dashboard><Imports /></Dashboard>
          </ProtectedRoute>
        } />
        
        <Route path="/clients" element={
          <ProtectedRoute>
            <Dashboard><Clients /></Dashboard>
          </ProtectedRoute>
        } />

        <Route path="/users" element={
          <ProtectedRoute>
            <Dashboard><Users /></Dashboard>
          </ProtectedRoute>
        } />
        
        <Route path="/sales" element={
          <ProtectedRoute>
            <Dashboard><Sales /></Dashboard>
          </ProtectedRoute>
        } />

        <Route path="/settings" element={
          <ProtectedRoute>
            <Dashboard><Settings /></Dashboard>
          </ProtectedRoute>
        } />

        {/* Catch-all: qualquer rota não existente manda para o dashboard */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;