import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Home from './pages/Home';
import Products from './pages/Products';
import Brands from './pages/Brands';
import Categories from './pages/Categories';
import Imports from './pages/Imports';
import Clients from './pages/Clients';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard><Home /></Dashboard>} />
        <Route path="/products" element={<Dashboard><Products /></Dashboard>} />
        <Route path="/brands" element={<Dashboard><Brands /></Dashboard>} />
        <Route path="/categories" element={<Dashboard><Categories /></Dashboard>} />
        <Route path="/imports" element={<Dashboard><Imports /></Dashboard>} />
        <Route path="/clients" element={<Dashboard><Clients /></Dashboard>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;