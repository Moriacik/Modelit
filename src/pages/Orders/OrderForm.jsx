import { useState } from 'react';
import { createOrder } from '@/services/api';
import './OrderForm.css';

function OrderForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    description: '',
    deadline: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [orderToken, setOrderToken] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    const name = formData.name.trim();
    const email = formData.email.trim();
    const description = formData.description.trim();
    const deadline = formData.deadline;

    // Name validation
    if (!name) {
      setMessage('Meno je povinné');
      return false;
    }

    if (name.length < 2) {
      setMessage('Meno musí mať aspoň 2 znaky');
      return false;
    }

    if (name.length > 100) {
      setMessage('Meno môže mať maximálne 100 znakov');
      return false;
    }

    if (!/^[a-zA-Z0-9\s\-áäčéíóôšťúýžÁÄČÉÍÓÔŠŤÚÝŽ]+$/.test(name)) {
      setMessage('Meno obsahuje nepovolené znaky');
      return false;
    }

    // Email validation
    if (!email) {
      setMessage('Email je povinný');
      return false;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setMessage('Neplatný formát emailu');
      return false;
    }

    if (email.length > 100) {
      setMessage('Email je príliš dlhý');
      return false;
    }

    // Description validation
    if (!description) {
      setMessage('Popis práce je povinný');
      return false;
    }

    if (description.length < 10) {
      setMessage('Popis musí mať aspoň 10 znakov');
      return false;
    }

    if (description.length > 5000) {
      setMessage('Popis môže mať maximálne 5000 znakov');
      return false;
    }

    // Deadline validation
    if (!deadline) {
      setMessage('Deadline je povinný');
      return false;
    }

    const deadlineDate = new Date(deadline);
    const now = new Date();
    const minDeadline = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000); // 2 days from now

    if (deadlineDate <= now) {
      setMessage('Deadline musí byť v budúcnosti');
      return false;
    }

    if (deadlineDate < minDeadline) {
      setMessage('Deadline musí byť aspoň za 2 dni');
      return false;
    }

    if (deadlineDate > new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000)) {
      setMessage('Deadline nemôže byť viac ako 1 rok v budúcnosti');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setOrderToken('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const result = await createOrder(formData);

      if (result.success) {
        setMessage('✓ Objednávka bola úspešne vytvorená!');
        setOrderToken(result.data.order_token);
        
        // Reset formulára
        setFormData({
          name: '',
          email: '',
          description: '',
          deadline: ''
        });
      } else {
        setMessage(result.message || 'Chyba pri vytváraní objednávky');
      }
    } catch (error) {
      setMessage('Chyba pri komunikácii so serverom');
      console.error('Order creation error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="order-form-page">
      {/* Success Modal Overlay */}
      {orderToken && (
        <div className="modal-overlay">
          <div className="modal-content success-modal">
            <div className="modal-icon">🎉</div>
            <h2>Objednávka vytvorená!</h2>
            <p className="modal-text">Vaša objednávka bola úspešne vytvorená. Skopírujte si kód objednávky:</p>
            
            <div className="order-token-box">
              <input 
                type="text" 
                value={orderToken} 
                readOnly 
                className="order-token-input"
              />
              <button 
                className="copy-btn"
                onClick={() => {
                  navigator.clipboard.writeText(orderToken);
                  alert('Kód skopírovaný!');
                }}
              >
                Kopírovať
              </button>
            </div>

            <p className="modal-note">
              Tento kód budete potrebovať na <strong>prihlásenie a sledovanie</strong> vašej objednávky.
            </p>

            <div className="modal-actions">
              <a href="/login" className="modal-btn primary">
                Prihlásiť sa
              </a>
            </div>
          </div>
        </div>
      )}

      <div className="order-form-container">
        <div className="order-header">
          <h1>Vytvorenie objednávky</h1>
          <p>Vyplňte formulár a zadajte podrobnosti svojej objednávky</p>
        </div>

        <form onSubmit={handleSubmit} className="order-form">
          {/* Kontaktné údaje */}
          <div className="form-section">
            <h3>Kontaktné údaje</h3>
            
            <div className="form-group">
              <label htmlFor="name">Meno a priezvisko *</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                disabled={loading}
                placeholder="Jozef Horváth"
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email *</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                disabled={loading}
                placeholder="vaspost@example.com"
              />
            </div>
          </div>

          {/* Detaily projektu */}
          <div className="form-section">
            <h3>Detaily projektu</h3>
            
            <div className="form-group">
              <label htmlFor="description">Popis práce *</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                disabled={loading}
                rows="6"
                placeholder="Opíšte čo presne potrebujete... (napr. 3D model časti, technická dokumentácia, vizualizácia, atď.)"
              />
            </div>

            <div className="form-group">
              <label htmlFor="deadline">Deadline *</label>
              <input
                type="date"
                id="deadline"
                name="deadline"
                value={formData.deadline}
                onChange={handleInputChange}
                disabled={loading}
              />
            </div>
          </div>

          {/* Správy */}
          {message && (
            <div className={`message-box ${message.includes('✓') || message.includes('úspešne') ? 'success' : 'error'}`}>
              {message}
            </div>
          )}

          {/* Tlačidlá */}
          <div className="form-actions">
            <button 
              type="submit" 
              className="submit-btn" 
              disabled={loading || orderToken}
            >
              {loading ? 'Vytváram objednávku...' : 'Poslať objednávku'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default OrderForm;
