import { useState } from 'react';
import './Login.css';

function Login() {
  const [loginType, setLoginType] = useState('admin');
  const [adminData, setAdminData] = useState({
    username: '',
    password: ''
  });
  const [userData, setUserData] = useState({
    orderNumber: '',
    email: ''
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
        window.location.href = '/admin';
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
      const response = await fetch('http://localhost/app/src/php/user-login.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData)
      });

      const result = await response.json();
      
      if (result.success) {
        setMessage('Link na prihlásenie bol zaslaný na váš email!');
      } else {
        setMessage(result.message || 'Objednávka nebola nájdená');
      }
    } catch (error) {
      setMessage('Chyba pri odosielaní');
      console.error('User login error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <h1>Prihlásenie</h1>
        
        {/* Prepínač typu prihlásenia */}
        <div className="login-type-selector">
          <button 
            className={`type-btn ${loginType === 'admin' ? 'active' : ''}`}
            onClick={() => setLoginType('admin')}
          >
            Administrátor
          </button>
          <button 
            className={`type-btn ${loginType === 'user' ? 'active' : ''}`}
            onClick={() => setLoginType('user')}
            disabled // Zatiaľ vypnuté
          >
            Zákazník (čoskoro)
          </button>
        </div>

        {/* Admin prihlásenie */}
        {loginType === 'admin' && (
          <form onSubmit={handleAdminLogin} className="login-form">
            <h2>Prihlásenie administrátora</h2>
            <div className="form-group">
              <label htmlFor="username">Používateľské meno:</label>
              <input
                type="text"
                id="username"
                value={adminData.username}
                onChange={(e) => setAdminData({...adminData, username: e.target.value})}
                required
                placeholder="Zadajte používateľské meno"
              />
            </div>
            <div className="form-group">
              <label htmlFor="password">Heslo:</label>
              <input
                type="password"
                id="password"
                value={adminData.password}
                onChange={(e) => setAdminData({...adminData, password: e.target.value})}
                required
                placeholder="Zadajte heslo"
              />
            </div>
            <button type="submit" disabled={loading} className="login-btn">
              {loading ? 'Prihlasovanie...' : 'Prihlásiť sa'}
            </button>
          </form>
        )}

        {/* User prihlásenie (zatiaľ neaktívne) */}
        {loginType === 'user' && (
          <form onSubmit={handleUserLogin} className="login-form">
            <h2>Prihlásenie zákazníka</h2>
            <div className="form-group">
              <label htmlFor="orderNumber">Číslo objednávky:</label>
              <input
                type="text"
                id="orderNumber"
                value={userData.orderNumber}
                onChange={(e) => setUserData({...userData, orderNumber: e.target.value})}
                required
                placeholder="Napr. ORD-2024-001"
                disabled
              />
            </div>
            <div className="form-group">
              <label htmlFor="email">Email:</label>
              <input
                type="email"
                id="email"
                value={userData.email}
                onChange={(e) => setUserData({...userData, email: e.target.value})}
                required
                placeholder="Zadajte váš email"
                disabled
              />
            </div>
            <button type="submit" disabled className="login-btn disabled">
              Čoskoro dostupné
            </button>
          </form>
        )}

        {/* Správy */}
        {message && (
          <div className={`message ${message.includes('úspešné') || message.includes('zaslaný') ? 'success' : 'error'}`}>
            {message}
          </div>
        )}
      </div>
    </div>
  );
}

export default Login;