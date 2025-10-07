import { useState } from 'react';
import './OrderForm.css';

function OrderForm() {
  const [formData, setFormData] = useState({
    meno: '',
    email: '',
    popis_prace: '',
    odhadovana_cena: '',
    deadline: '',
    referencne_subory: []
  });
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [orderNumber, setOrderNumber] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setFormData(prev => ({
      ...prev,
      referencne_subory: files
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      // Vytvorenie FormData pre súbory
      const submitData = new FormData();
      
      // Pridanie textových polí
      Object.keys(formData).forEach(key => {
        if (key !== 'referencne_subory') {
          submitData.append(key, formData[key]);
        }
      });

      // Pridanie súborov
      formData.referencne_subory.forEach((file, index) => {
        submitData.append(`referencne_subory[${index}]`, file);
      });

      const response = await fetch('/app/src/php/create-order.php', {
        method: 'POST',
        body: submitData
      });

      const result = await response.json();

      if (result.success) {
        setMessage('Objednávka bola úspešne vytvorená!');
        setOrderNumber(result.order_number);
        
        // Reset formulára
        setFormData({
          meno: '',
          email: '',
          popis_prace: '',
          odhadovana_cena: '',
          deadline: '',
          referencne_subory: []
        });
        
        // Reset file input
        const fileInput = document.querySelector('input[type="file"]');
        if (fileInput) fileInput.value = '';
        
      } else {
        setMessage(result.message || 'Chyba pri vytváraní objednávky');
      }

    } catch (error) {
      setMessage('Chyba pri odosielaní objednávky');
      console.error('Order creation error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="order-form-page">
      <div className="order-form-container">
        <h1>Vytvorenie objednávky</h1>
        <p className="form-description">
          Vyplňte formulár below a my sa vám čoskoro ozveme s cenovou ponukou a detailmi projektu.
        </p>

        <form onSubmit={handleSubmit} className="order-form">
          {/* Základné informácie */}
          <div className="form-section">
            <h3>Kontaktné údaje</h3>
            
            <div className="form-group">
              <label htmlFor="meno">Meno a priezvisko *</label>
              <input
                type="text"
                id="meno"
                name="meno"
                value={formData.meno}
                onChange={handleInputChange}
                required
                placeholder="Zadajte vaše meno a priezvisko"
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
                required
                placeholder="váš@email.com"
              />
            </div>
          </div>

          {/* Detaily projektu */}
          <div className="form-section">
            <h3>Detaily projektu</h3>
            
            <div className="form-group">
              <label htmlFor="popis_prace">Popis práce *</label>
              <textarea
                id="popis_prace"
                name="popis_prace"
                value={formData.popis_prace}
                onChange={handleInputChange}
                required
                rows="6"
                placeholder="Opíšte čo presne potrebujete... (napr. vytvorenie webstránky, redesign, e-shop, atď.)"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="odhadovana_cena">Odhadovaná cena (€)</label>
                <input
                  type="number"
                  id="odhadovana_cena"
                  name="odhadovana_cena"
                  value={formData.odhadovana_cena}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  placeholder="Váš rozpočet"
                />
              </div>

              <div className="form-group">
                <label htmlFor="deadline">Deadline</label>
                <input
                  type="date"
                  id="deadline"
                  name="deadline"
                  value={formData.deadline}
                  onChange={handleInputChange}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>
          </div>

          {/* Súbory */}
          <div className="form-section">
            <h3>Referenčné súbory</h3>
            <div className="form-group">
              <label htmlFor="referencne_subory">Nahrajte súbory (voliteľné)</label>
              <input
                type="file"
                id="referencne_subory"
                name="referencne_subory"
                multiple
                onChange={handleFileChange}
                accept=".jpg,.jpeg,.png,.gif,.pdf,.doc,.docx,.txt"
              />
              <small className="file-info">
                Podporované formáty: JPG, PNG, GIF, PDF, DOC, DOCX, TXT. Max 5MB na súbor.
              </small>
              
              {formData.referencne_subory.length > 0 && (
                <div className="selected-files">
                  <p>Vybrané súbory:</p>
                  <ul>
                    {formData.referencne_subory.map((file, index) => (
                      <li key={index}>{file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Tlačidlo odoslania */}
          <button 
            type="submit" 
            disabled={loading}
            className="submit-btn"
          >
            {loading ? 'Odosielanie...' : 'Vytvoriť objednávku'}
          </button>
        </form>

        {/* Správy */}
        {message && (
          <div className={`message ${message.includes('úspešne') ? 'success' : 'error'}`}>
            {message}
            {orderNumber && (
              <div className="order-number">
                <strong>Číslo objednávky: {orderNumber}</strong>
                <p>Zapíšte si toto číslo - budete ho potrebovať na prihlásenie.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default OrderForm;