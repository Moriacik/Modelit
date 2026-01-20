import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import OrdersTable from './components/OrdersTable';
import './AdminDashboard.css';

function AdminDashboard() {
  const [adminInfo, setAdminInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Overenie, či je admin prihlásený
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/login');
      return;
    }

    // Simulácia načítania admin info (v budúcnosti z API)
    setAdminInfo({
      username: 'admin',
      loginTime: new Date().toLocaleString()
    });
    setLoading(false);
  }, [navigate]);

  // Automatické odhlásenie pri opustení /admin stránky
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Odhlásenie pri zatvorení okna/tabu
      localStorage.removeItem('adminToken');
    };

    const handleLocationChange = () => {
      // Odhlásenie pri navigácii preč z admin stránky
      if (!location.pathname.startsWith('/admin')) {
        localStorage.removeItem('adminToken');
      }
    };

    // Listener pre zatvorenie okna
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    // Cleanup funkcia
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      // Odhlásenie pri unmount komponenta (navigácia preč)
      if (!location.pathname.startsWith('/admin')) {
        localStorage.removeItem('adminToken');
      }
    };
  }, [location.pathname]);

  // Cleanup pri unmount (navigácia preč z admin)
  useEffect(() => {
    return () => {
      const currentPath = window.location.pathname;
      if (!currentPath.startsWith('/admin')) {
        localStorage.removeItem('adminToken');
      }
    };
  }, []);

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="loading-spinner"></div>
        <p>Načítava sa admin panel...</p>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      {/* Admin Header */}
      <header className="admin-header">
        <div className="admin-header-content">
          <div className="admin-logo">
            <h1>Admin Panel</h1>
            <span className="admin-subtitle">Správa objednávok</span>
          </div>
          
          <div className="admin-user-info">
            <div className="user-details">
              <span className="username">Prihlásený: {adminInfo?.username}</span>
              <span className="login-time">Prihlásený od: {adminInfo?.loginTime}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="admin-main">
        <OrdersTable />
      </main>
    </div>
  );
}

export default AdminDashboard;