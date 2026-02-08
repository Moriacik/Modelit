import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminLogin } from '@/services/api';
import './Login.css';

function Login() {
  const navigate = useNavigate();
  const [loginType, setLoginType] = useState('user');
  const [adminData, setAdminData] = useState({
    username: '',
    password: ''
  });
  const [userData, setUserData] = useState({
    orderToken: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const validateAdminInput = () => {
    const username = adminData.username.trim();
    const password = adminData.password;

    if (!username) {
      setMessage('Meno používateľa je povinné');
      return false;
    }

    if (username.length < 3) {
      setMessage('Meno používateľa musí mať aspoň 3 znaky');
      return false;
    }

    if (username.length > 50) {
      setMessage('Meno používateľa môže mať maximálne 50 znakov');
      return false;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      setMessage('Meno používateľa smie obsahovať iba písmená, čísla a podčiarkovník');
      return false;
    }

    if (!password) {
      setMessage('Heslo je povinné');
      return false;
    }

    if (password.length < 6) {
      setMessage('Heslo musí mať aspoň 6 znakov');
      return false;
    }

    if (password.length > 100) {
      setMessage('Heslo je príliš dlhé');
      return false;
    }

    return true;
  };

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setMessage('');

    if (!validateAdminInput()) {
      return;
    }

    setLoading(true);

    try {
      const result = await adminLogin(adminData.username, adminData.password);
      
      if (result.success) {
        setMessage('Prihlásenie úspešné!');
        localStorage.setItem('adminToken', result.data.token);
        setTimeout(() => {
          navigate('/admin');
        }, 1000);
      } else {
        setMessage(result.message || 'Nesprávne prihlasovacie údaje');
      }
    } catch (error) {
      setMessage('Chyba pri prihlasovaní');
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  const validateUserInput = () => {
    const orderToken = userData.orderToken.trim().toUpperCase();

    if (!orderToken) {
      setMessage('Kód objednávky je povinný');
      return false;
    }

    if (orderToken.length !== 17) {
      setMessage('Kód objednávky musí mať presne 17 znakov (formát: MODELIT-XXXXXXXXX)');
      return false;
    }

    if (!/^[A-Z0-9\-]+$/.test(orderToken)) {
      setMessage('Kód objednávky smie obsahovať iba veľké písmená, čísla a pomlčku');
      return false;
    }

    if (!orderToken.startsWith('MODELIT-')) {
      setMessage('Kód objednávky musí začínať na "MODELIT-"');
      return false;
    }

    // Aktualizovať formát v state (uppercase)
    setUserData({ orderToken });

    return true;
  };

  const handleUserLogin = async (e) => {
    e.preventDefault();
    setMessage('');

    if (!validateUserInput()) {
      return;
    }

    setLoading(true);

    try {
      // Priamo presmerujeme na detail objednávky
      localStorage.setItem('orderToken', userData.orderToken);
      setMessage('Presmerovávam...');
      setTimeout(() => {
        navigate(`/order-detail/${userData.orderToken}`);
      }, 500);
    } catch (error) {
      setMessage('Chyba pri prihlasovaní');
      console.error('User login error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        {/* Header Section */}
        <div className="login-header">
          <h1>Prihlásenie do systému</h1>
          <p>Vyberte si spôsob prihlásenia</p>
        </div>
        
        {/* Login Type Cards */}
        <div className="login-type-cards">
          <div 
            className={`login-card ${loginType === 'user' ? 'active' : ''}`}
            onClick={() => setLoginType('user')}
          >
            <div className="card-icon">
              <div className="icon-user"></div>
            </div>
            <h3>Zákazník</h3>
          </div>
          
          <div 
            className={`login-card ${loginType === 'admin' ? 'active' : ''}`}
            onClick={() => setLoginType('admin')}
          >
            <div className="card-icon">
              <div className="icon-admin"></div>
            </div>
            <h3>Administrátor</h3>
          </div>
        </div>

        {/* Login Forms */}
        <div className="login-forms">
          {/* Admin prihlásenie */}
          {loginType === 'admin' && (
            <form onSubmit={handleAdminLogin} className="login-form admin-form">
              
              <div className="form-group">
                <label htmlFor="username">Používateľské meno</label>
                <div className="input-wrapper">
                  <input
                    type="text"
                    id="username"
                    value={adminData.username}
                    onChange={(e) => setAdminData({...adminData, username: e.target.value})}
                    required
                    placeholder="admin"
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label htmlFor="password">Heslo</label>
                <div className="input-wrapper">
                  <input
                    type="password"
                    id="password"
                    value={adminData.password}
                    onChange={(e) => setAdminData({...adminData, password: e.target.value})}
                    required
                    placeholder="••••••••"
                  />
                </div>
              </div>
              
              <button type="submit" disabled={loading} className="login-btn admin-btn">
                <span>{loading ? 'Prihlasovanie...' : 'Prihlásiť sa'}</span>
                <div className="btn-arrow">→</div>
              </button>
            </form>
          )}

          {/* User prihlásenie */}
          {loginType === 'user' && (
            <form onSubmit={handleUserLogin} className="login-form user-form">
              
              <div className="form-group">
                <label htmlFor="orderToken">Kód objednávky</label>
                <div className="input-wrapper">
                  <input
                    type="text"
                    id="orderToken"
                    value={userData.orderToken}
                    onChange={(e) => setUserData({...userData, orderToken: e.target.value})}
                    required
                    disabled={loading}
                    placeholder="MODELIT-ABC1234567"
                  />
                </div>
              </div>
              
              <div className="order-help">
                <p>Váš kód objednávky nájdete v potvrdzujúcom e-maile alebo správe po vytvorení objednávky</p>
              </div>
              
              <button type="submit" disabled={loading} className="login-btn user-btn">
                <span>{loading ? 'Presmerovávam...' : 'Pokračovať'}</span>
                <div className="btn-arrow">→</div>
              </button>
            </form>
          )}
        </div>

        {/* Messages */}
        {message && (
          <div className={`message-container ${message.includes('úspešné') || message.includes('zaslaný') ? 'success' : 'error'}`}>
            <div className="message-icon"></div>
            <div className="message-text">{message}</div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Login;