import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './OrderInfoUser.css';
import PaymentPlanSection from './PaymentPlanSection';

const OrderInfoUser = () => {
  const { orderToken } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [negotiations, setNegotiations] = useState([]);
  const [newCounterOffer, setNewCounterOffer] = useState('');
  const [counterOfferNote, setCounterOfferNote] = useState('');

  // Handler pre aktualizáciu objednávky po platbe
  const handleOrderUpdate = (updatedOrder) => {
    setOrder(updatedOrder);
    // Reload order details zo serveru aby bol state synchronizovaný
    const reloadOrderDetails = async () => {
      try {
        const response = await fetch(`/app/src/php/get-order-details.php?token=${orderToken}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        });

        const result = await response.json();
        if (result.success) {
          setOrder(result.order);
        }
      } catch (error) {
        console.error('Error reloading order details:', error);
      }
    };
    
    // Reload po 500ms aby backend stihol updatovať
    setTimeout(reloadOrderDetails, 500);
  };

  // Načítanie detailov objednávky
  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        const response = await fetch(`/app/src/php/get-order-details.php?token=${orderToken}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        });

        const result = await response.json();
        
        if (result.success) {
          setOrder(result.order);
          setNegotiations(result.negotiations || []);
          // Nastavenie novej ponuky ak existuje pending ponuka od admina
          const pendingAdminOffer = (result.negotiations || []).find(n => n.offered_by === 'admin' && n.status === 'pending');
          if (pendingAdminOffer) {
            setNewCounterOffer(pendingAdminOffer.price);
          }
        } else {
          setError(result.message || 'Objednávka nebola nájdená');
        }
      } catch (error) {
        console.error('Error fetching order details:', error);
        setError('Chyba pri načítaní objednávky');
      } finally {
        setLoading(false);
      }
    };

    if (orderToken) {
      fetchOrderDetails();
    } else {
      setError('Neplatný token objednávky');
      setLoading(false);
    }
  }, [orderToken]);

  // Funkcia pre prijatie cenovej ponuky od admina
  const handleAcceptPrice = async () => {
    setActionLoading(true);
    setMessage('');

    try {
      const response = await fetch('/app/src/php/accept-counter-offer.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          order_token: orderToken
        })
      });

      const result = await response.json();
      
      if (result.success) {
        setMessage('Cenová ponuka bola úspešne prijatá!');
        setOrder(prev => ({ ...prev, status: 'in_progress', price_status: 'agreed', agreed_price: result.agreed_price }));
        // Aktualizácia vyjednávania
        const updatedNegotiations = negotiations.map(n => 
          n.offered_by === 'admin' && n.status === 'pending' ? { ...n, status: 'accepted' } : n
        );
        setNegotiations(updatedNegotiations);
      } else {
        setMessage(result.message || 'Chyba pri spracovaní požiadavky');
      }
    } catch (error) {
      console.error('Error accepting price:', error);
      setMessage('Chyba pri komunikácii so serverom');
    } finally {
      setActionLoading(false);
    }
  };

  // Funkcia pre odoslanie protinávrhov od klienta
  const handleSubmitCounterOffer = async () => {
    if (!newCounterOffer || parseFloat(newCounterOffer) <= 0) {
      setMessage('Zadajte platnú cenu');
      return;
    }

    setActionLoading(true);
    setMessage('');

    try {
      const response = await fetch('/app/src/php/submit-counter-offer.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          order_id: order.id,
          counter_price: parseFloat(newCounterOffer),
          note: counterOfferNote,
          offered_by: 'customer'
        })
      });

      const result = await response.json();
      
      if (result.success) {
        setMessage('Váš protinávrh bol úspešne odoslaný správcovi!');
        setNewCounterOffer('');
        setCounterOfferNote('');
        // Reload data
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        setMessage(result.message || 'Chyba pri odosielaní protinávrhov');
      }
    } catch (error) {
      console.error('Error submitting counter offer:', error);
      setMessage('Chyba pri komunikácii so serverom');
    } finally {
      setActionLoading(false);
    }
  };

  // Funkcia pre stiahnutie súboru
  const handleDownloadFile = (filename) => {
    const downloadUrl = `/app/uploads/completed/${filename}`;
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Funkcia pre určenie farby stavu
  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#f9b400';
      case 'in_progress': return '#08d8c0';
      case 'completed': return '#4CAF50';
      case 'cancelled': return '#e55f42';
      case 'price_negotiation': return '#ff9800';
      case 'accepted': return '#4CAF50';
      case 'rejected': return '#e55f42';
      default: return '#666';
    }
  };

  // Funkcia pre preklad stavu
  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return 'Čaká na spracovanie';
      case 'in_progress': return 'V spracovaní';
      case 'completed': return 'Dokončená';
      case 'cancelled': return 'Zrušená';
      case 'price_negotiation': return 'Cenové vyjednávanie';
      case 'accepted': return 'Prijatá';
      case 'rejected': return 'Odmietnutá';
      default: return 'Neznámy stav';
    }
  };

  if (loading) {
    return (
      <div className="order-info-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Načítavam detail objednávky...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="order-info-page">
        <div className="error-container">
          <div className="error-icon"></div>
          <h2>Chyba</h2>
          <p>{error}</p>
          <button onClick={() => navigate('/login')} className="back-btn">
            Späť na prihlásenie
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="order-info-page">
      <div className="order-info-container">
        
        {/* Header Section */}
        <div className="order-header">
          <div className="order-title">
            <h1>Detail objednávky</h1>
            <span className="order-code">#{order.order_token}</span>
          </div>
          <div className="order-date">
            Vytvorené: {new Date(order.datum_vytvorenia).toLocaleDateString('sk-SK')}
          </div>
        </div>

        {/* Status Progress */}
        <div className="status-section">
          <h2>Stav objednávky</h2>
          <div className="status-progress">
            <div className="status-item">
              <div className={`status-circle ${['pending', 'in_progress', 'completed', 'accepted'].includes(order.status) ? 'active' : ''}`}>
                <div className="status-icon pending-icon"></div>
              </div>
              <span>Prijatá</span>
            </div>
            
            <div className="status-line"></div>
            
            <div className="status-item">
              <div className={`status-circle ${['in_progress', 'completed', 'accepted'].includes(order.status) ? 'active' : ''}`}>
                <div className="status-icon progress-icon"></div>
              </div>
              <span>V spracovaní</span>
            </div>
            
            <div className="status-line"></div>
            
            <div className="status-item">
              <div className={`status-circle ${['completed', 'accepted'].includes(order.status) ? 'active' : ''}`}>
                <div className="status-icon completed-icon"></div>
              </div>
              <span>Dokončená</span>
            </div>
          </div>
          
          <div className="current-status">
            <div 
              className="status-badge" 
              style={{ backgroundColor: getStatusColor(order.status) }}
            >
              {getStatusText(order.status)}
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div className="order-summary">
          <h2>Súhrn objednávky</h2>
          <div className="summary-grid">
            <div className="summary-item">
              <label>Meno a priezvisko</label>
              <span>{order.meno}</span>
            </div>
            <div className="summary-item">
              <label>Email</label>
              <span>{order.email}</span>
            </div>
            <div className="summary-item full-width">
              <label>Popis práce</label>
              <span>{order.popis_prace}</span>
            </div>
            <div className="summary-item">
              <label>Termín dokončenia</label>
              <span>{new Date(order.deadline).toLocaleDateString('sk-SK')}</span>
            </div>
            <div className="summary-item">
              <label>Odhadovaná cena</label>
              <span>{order.odhadovana_cena}€</span>
            </div>
            {order.referencne_subory && order.referencne_subory.length > 0 && (
              <div className="summary-item full-width">
                <label>Referenčné súbory</label>
                <div className="files-list">
                  {order.referencne_subory.map((file, index) => (
                    <span key={index} className="file-tag">
                      {typeof file === 'string' ? file : file.original_name || file.filename || 'Súbor'}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Price Negotiation Section */}
        {(order.price_status !== 'pending' || negotiations.length > 0 || order.admin_price) && (
          <div className="price-negotiation">
            <h2>Cenové vyjednávanie</h2>
            
            <div className="price-history">
              <div className="price-item client-price">
                <label>Pôvodný váš návrh</label>
                <span className="price">{order.odhadovana_cena}€</span>
              </div>
            </div>

            {negotiations.length > 0 && (
              <div className="negotiations-list">
                {negotiations.map((neg, index) => (
                  <div key={index} className={`negotiation-item ${neg.offered_by}`}>
                    <div className="neg-left">
                      <div className="neg-header">
                        <span className="neg-by">
                          {neg.offered_by === 'admin' ? 'Ponuka od správcu' : 'Váš protinávrh'}
                        </span>
                        <span className="neg-date">
                          {new Date(neg.created_at).toLocaleDateString('sk-SK')}
                        </span>
                      </div>
                      {neg.note && <div className="neg-note">{neg.note}</div>}
                    </div>
                    <div className="neg-right">
                      <div className="neg-price">{neg.price}€</div>
                      <div className={`neg-status ${neg.status}`}>
                        {neg.status === 'pending' ? 'Čaká' : 
                         neg.status === 'accepted' ? '✓ Prijatý' : '✕ Odmietnutý'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {order.price_status === 'agreed' && (
              <div className="price-agreed">
                <div className="agreed-icon">✓</div>
                <span>Cena bola odsúhlasená</span>
                <div className="final-price">{order.agreed_price}€</div>
              </div>
            )}

            {/* Actions for pending admin offer */}
            {negotiations.find(n => n.offered_by === 'admin' && n.status === 'pending') && order.price_status !== 'agreed' && (
              <div className="price-actions">
                <button 
                  onClick={handleAcceptPrice}
                  disabled={actionLoading}
                  className="accept-btn"
                >
                  {actionLoading ? 'Spracováva sa...' : 'Prijať ponuku'}
                </button>
              </div>
            )}

            {/* Counter offer form if not agreed */}
            {order.price_status !== 'agreed' && order.status !== 'completed' && order.status !== 'cancelled' && (
              <div className="counter-offer-form">
                <h3>Váš protinávrh</h3>
                <div className="form-group">
                  <label>Navrhovaná cena (€)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={newCounterOffer}
                    onChange={(e) => setNewCounterOffer(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
                <div className="form-group">
                  <label>Poznámka (voliteľné)</label>
                  <textarea
                    value={counterOfferNote}
                    onChange={(e) => setCounterOfferNote(e.target.value)}
                    placeholder="Dôvod úpravy ceny, vysvetlenie..."
                    rows="3"
                  />
                </div>
                <button 
                  onClick={handleSubmitCounterOffer}
                  disabled={actionLoading}
                  className="submit-offer-btn"
                >
                  {actionLoading ? 'Odosielam...' : 'Odoslať protinávrh'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Payment Plan Section */}
        {order && order.agreed_price && (
          <PaymentPlanSection order={order} onOrderUpdate={handleOrderUpdate} />
        )}

        {/* Download Section */}
        {order.status === 'completed' && order.final_files && order.final_files.length > 0 && (
          <div className="download-section">
            <h2>Stiahnutie finálneho produktu</h2>
            <p>Váš projekt je dokončený! Môžete si stiahnuť finálne súbory:</p>
            <div className="download-files">
              {order.final_files.map((file, index) => (
                <div key={index} className="download-item">
                  <div className="file-info">
                    <div className="file-icon"></div>
                    <div className="file-details">
                      <span className="file-name">
                        {typeof file === 'string' ? file : file.original_name || file.filename || 'Súbor'}
                      </span>
                      <span className="file-size">
                        {typeof file === 'object' && file.size 
                          ? `${(file.size / 1024).toFixed(1)} KB` 
                          : 'Neznáma veľkosť'
                        }
                      </span>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleDownloadFile(
                      typeof file === 'string' ? file : file.filename || file.original_name
                    )}
                    className="download-btn"
                  >
                    <div className="download-icon"></div>
                    Stiahnuť
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        {message && (
          <div className={`message-container ${message.includes('úspešne') ? 'success' : 'error'}`}>
            <div className="message-icon"></div>
            <div className="message-text">{message}</div>
          </div>
        )}

        {/* Back Button */}
        <div className="order-actions">
          <button onClick={() => navigate('/login')} className="back-btn">
            Späť na prihlásenie
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderInfoUser;