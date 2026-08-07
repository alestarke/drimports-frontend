import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Home from './pages/Home';
import Products from './pages/Products';
import ProductForm from './pages/ProductForm';
import Brands from './pages/Brands';
import BrandForm from './pages/BrandForm';
import Categories from './pages/Categories';
import CategoryForm from './pages/CategoryForm';
import Imports from './pages/Imports';
import ImportForm from './pages/ImportForm';
import Trips from './pages/Trips';
import TripForm from './pages/TripForm';
import Clients from './pages/Clients';
import ClientForm from './pages/ClientForm';
import Sales from './pages/Sales';
import SaleForm from './pages/SaleForm';
import Users from './pages/Users';
import UserForm from './pages/UserForm';
import Settings from './pages/Settings';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

// Módulo Financeiro
import FinancialLayout from './components/FinancialLayout';
import FinancialDashboard from './pages/financial/FinancialDashboard';
import FinancialAccounts from './pages/financial/FinancialAccounts';
import FinancialModalities from './pages/financial/FinancialModalities';
import FinancialTransactions from './pages/financial/FinancialTransactions';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rota raiz redireciona para login ou dashboard dependendo do guard */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        
        {/* Rotas públicas */}
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Rotas Protegidas - Visão Geral / Dashboard ERP */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Dashboard><Home /></Dashboard>
          </ProtectedRoute>
        } />
        
        {/* PRODUTOS */}
        <Route path="/products" element={
          <ProtectedRoute>
            <Dashboard><Products /></Dashboard>
          </ProtectedRoute>
        } />
        <Route path="/products/new" element={
          <ProtectedRoute>
            <Dashboard><ProductForm /></Dashboard>
          </ProtectedRoute>
        } />
        <Route path="/products/edit/:id" element={
          <ProtectedRoute>
            <Dashboard><ProductForm /></Dashboard>
          </ProtectedRoute>
        } />
        
        {/* MARCAS */}
        <Route path="/brands" element={
          <ProtectedRoute>
            <Dashboard><Brands /></Dashboard>
          </ProtectedRoute>
        } />
        <Route path="/brands/new" element={
          <ProtectedRoute>
            <Dashboard><BrandForm /></Dashboard>
          </ProtectedRoute>
        } />
        <Route path="/brands/edit/:id" element={
          <ProtectedRoute>
            <Dashboard><BrandForm /></Dashboard>
          </ProtectedRoute>
        } />
        
        {/* CATEGORIAS */}
        <Route path="/categories" element={
          <ProtectedRoute>
            <Dashboard><Categories /></Dashboard>
          </ProtectedRoute>
        } />
        <Route path="/categories/new" element={
          <ProtectedRoute>
            <Dashboard><CategoryForm /></Dashboard>
          </ProtectedRoute>
        } />
        <Route path="/categories/edit/:id" element={
          <ProtectedRoute>
            <Dashboard><CategoryForm /></Dashboard>
          </ProtectedRoute>
        } />
        
        {/* IMPORTAÇÕES */}
        <Route path="/imports" element={
          <ProtectedRoute>
            <Dashboard><Imports /></Dashboard>
          </ProtectedRoute>
        } />
        <Route path="/imports/new" element={
          <ProtectedRoute>
            <Dashboard><ImportForm /></Dashboard>
          </ProtectedRoute>
        } />
        <Route path="/imports/edit/:id" element={
          <ProtectedRoute>
            <Dashboard><ImportForm /></Dashboard>
          </ProtectedRoute>
        } />
        
        {/* VIAGENS */}
        <Route path="/trips" element={
          <ProtectedRoute>
            <Dashboard><Trips /></Dashboard>
          </ProtectedRoute>
        } />
        <Route path="/trips/new" element={
          <ProtectedRoute>
            <Dashboard><TripForm /></Dashboard>
          </ProtectedRoute>
        } />
        <Route path="/trips/edit/:id" element={
          <ProtectedRoute>
            <Dashboard><TripForm /></Dashboard>
          </ProtectedRoute>
        } />
        
        {/* CLIENTES */}
        <Route path="/clients" element={
          <ProtectedRoute>
            <Dashboard><Clients /></Dashboard>
          </ProtectedRoute>
        } />
        <Route path="/clients/new" element={
          <ProtectedRoute>
            <Dashboard><ClientForm /></Dashboard>
          </ProtectedRoute>
        } />
        <Route path="/clients/edit/:id" element={
          <ProtectedRoute>
            <Dashboard><ClientForm /></Dashboard>
          </ProtectedRoute>
        } />

        {/* USUÁRIOS */}
        <Route path="/users" element={
          <ProtectedRoute>
            <Dashboard><Users /></Dashboard>
          </ProtectedRoute>
        } />
        <Route path="/users/new" element={
          <ProtectedRoute>
            <Dashboard><UserForm /></Dashboard>
          </ProtectedRoute>
        } />
        <Route path="/users/edit/:id" element={
          <ProtectedRoute>
            <Dashboard><UserForm /></Dashboard>
          </ProtectedRoute>
        } />
        
        {/* VENDAS / OPERAÇÕES */}
        <Route path="/sales" element={
          <ProtectedRoute>
            <Dashboard><Sales /></Dashboard>
          </ProtectedRoute>
        } />
        <Route path="/sales/new" element={
          <ProtectedRoute>
            <Dashboard><SaleForm /></Dashboard>
          </ProtectedRoute>
        } />
        <Route path="/sales/edit/:id" element={
          <ProtectedRoute>
            <Dashboard><SaleForm /></Dashboard>
          </ProtectedRoute>
        } />

        {/* CONFIGURAÇÕES */}
        <Route path="/settings" element={
          <ProtectedRoute>
            <Dashboard><Settings /></Dashboard>
          </ProtectedRoute>
        } />

        {/* MÓDULO FINANCEIRO & GASTOS PESSOAIS (FINANCIAL HUB) */}
        <Route path="/financeiro" element={<Navigate to="/financeiro/dashboard" replace />} />
        <Route path="/financeiro/dashboard" element={
          <ProtectedRoute>
            <FinancialLayout><FinancialDashboard /></FinancialLayout>
          </ProtectedRoute>
        } />
        <Route path="/financeiro/contas" element={
          <ProtectedRoute>
            <FinancialLayout><FinancialAccounts /></FinancialLayout>
          </ProtectedRoute>
        } />
        <Route path="/financeiro/modalidades" element={
          <ProtectedRoute>
            <FinancialLayout><FinancialModalities /></FinancialLayout>
          </ProtectedRoute>
        } />
        <Route path="/financeiro/transacoes" element={
          <ProtectedRoute>
            <FinancialLayout><FinancialTransactions /></FinancialLayout>
          </ProtectedRoute>
        } />
        <Route path="/financeiro/relatorios" element={
          <ProtectedRoute>
            <FinancialLayout><FinancialDashboard /></FinancialLayout>
          </ProtectedRoute>
        } />

        {/* Catch-all: qualquer rota não existente manda para o dashboard */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;