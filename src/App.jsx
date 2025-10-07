import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import Header from './components/Header/Header';
import Footer from './components/Footer/Footer';
import Home from './pages/Home/Home';
import Login from './pages/Login/Login';
import OrderForm from './pages/Orders/OrderForm';
import AdminDashboard from './pages/Admin/AdminDashboard';
import './App.css';

function AppContent() {
  const location = useLocation();

  useEffect(() => {
    // Automatické odhlásenie admina pri navigácii preč z /admin
    if (!location.pathname.startsWith('/admin') && localStorage.getItem('adminToken')) {
      localStorage.removeItem('adminToken');
    }
  }, [location.pathname]);

  return (
    <div className="app">
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/objednavka" element={<OrderForm />} />
        <Route path="/admin" element={<AdminDashboard />} />
      </Routes>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;