import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';

function Login() {
  const navigate = useNavigate();
  const [loginType, setLoginType] = useState('admin');
  const [adminData, setAdminData] = useState({
    username: '',
    password: ''
  });
  const [userData, setUserData] = useState({
    orderCode: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('/app/src/php/admin-login.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(adminData)
      });

      const result = await response.json();
      
      if (result.success) {
        setMessage('Prihlásenie úspešné!');
        // Presmerovanie na admin panel
        localStorage.setItem('adminToken', result.token);
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

  const handleUserLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('/app/src/php/user-login.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData)
      });

      const result = await response.json();
      
      if (result.success) {
        setMessage('Prihlásenie úspešné!');
        // Presmerovanie na užívateľský panel alebo detail objednávky
        localStorage.setItem('userToken', result.token);
        localStorage.setItem('orderToken', result.orderToken);
        setTimeout(() => {
          navigate(`/order-detail/${result.orderToken}`);
        }, 1000);
      } else {
        setMessage(result.message || 'Neplatný kód objednávky');
      }
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
            className={`login-card ${loginType === 'admin' ? 'active' : ''}`}
            onClick={() => setLoginType('admin')}
          >
            <div className="card-icon">
              <div className="icon-admin"></div>
            </div>
            <h3>Administrátor</h3>
          </div>
          
          <div 
            className={`login-card ${loginType === 'user' ? 'active' : ''}`}
            onClick={() => setLoginType('user')}
          >
            <div className="card-icon">
              <div className="icon-user"></div>
            </div>
            <h3>Zákazník</h3>
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
                <label htmlFor="orderCode">Kód objednávky</label>
                <div className="input-wrapper">
                  <input
                    type="text"
                    id="orderCode"
                    value={userData.orderCode}
                    onChange={(e) => setUserData({...userData, orderCode: e.target.value})}
                    required
                    placeholder="ORD-2025-ABC12345"
                  />
                </div>
              </div>
              
              <div className="order-help">
                <p>Váš kód objednávky nájdete v potvrdzujúcom e-maile</p>
              </div>
              
              <button type="submit" disabled={loading} className="login-btn user-btn">
                <span>{loading ? 'Overovanie...' : 'Pokračovať'}</span>
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