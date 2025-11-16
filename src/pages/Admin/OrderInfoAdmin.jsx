import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './OrderInfoAdmin.css';

const OrderInfoAdmin = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [negotiations, setNegotiations] = useState([]);
  
  // State pre nový protinávrh
  const [newCounterOffer, setNewCounterOffer] = useState('');
  const [counterOfferNote, setCounterOfferNote] = useState('');

  // Načítanie detailov objednávky a vyjednávania
  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        const response = await fetch(`/app/src/php/get-admin-order-details.php?id=${orderId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        });

        const result = await response.json();
        
        if (result.success) {
          setOrder(result.order);
          setNegotiations(result.negotiations || []);
          setNewCounterOffer(result.order.admin_price || result.order.odhadovana_cena || '');
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

    if (orderId) {
      fetchOrderDetails();
    } else {
      setError('Neplatné ID objednávky');
      setLoading(false);
    }

    // Automatické reloadovanie dát každých 5 sekúnd
    const interval = setInterval(() => {
      if (orderId) {
        fetchOrderDetails();
      }
    }, 5000);

    // Reloadovanie dát keď sa okno vráti do focusu
    const handleFocus = () => {
      if (orderId) {
        fetchOrderDetails();
      }
    };

    window.addEventListener('focus', handleFocus);

    // Cleanup
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, [orderId]);

  // Funkcia pre odoslanie protinávrhov
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
          order_id: orderId,
          counter_price: parseFloat(newCounterOffer),
          note: counterOfferNote,
          offered_by: 'admin'
        })
      });

      const result = await response.json();
      
      if (result.success) {
        setMessage('Protinávrh bol úspešne odoslaný!');
        // Reload data
        window.location.reload();
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

  // Funkcia pre prijatie posledného návrhu od klienta
  const handleAcceptClientOffer = async () => {
    setActionLoading(true);
    setMessage('');

    try {
      const response = await fetch('/app/src/php/accept-final-price.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          order_id: orderId,
          action: 'accept_by_admin'
        })
      });

      const result = await response.json();
      
      if (result.success) {
        setMessage('Cenová ponuka bola prijatá! Objednávka môže pokračovať do výroby.');
        setOrder(prev => ({ ...prev, status: 'in_progress', price_status: 'agreed' }));
      } else {
        setMessage(result.message || 'Chyba pri prijímaní ponuky');
      }
    } catch (error) {
      console.error('Error accepting offer:', error);
      setMessage('Chyba pri komunikácii so serverom');
    } finally {
      setActionLoading(false);
    }
  };

  // Funkcia pre zrušenie objednávky
  const handleCancelOrder = async () => {
    if (!window.confirm('Naozaj chcete zrušiť túto objednávku? Táto akcia sa nedá vrátiť späť.')) {
      return;
    }

    setActionLoading(true);
    setMessage('');

    try {
      const response = await fetch('/app/src/php/cancel-order.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          order_id: orderId,
          reason: 'Nedohoda o cene'
        })
      });

      const result = await response.json();
      
      if (result.success) {
        setMessage('Objednávka bola zrušená.');
        setTimeout(() => {
          navigate('/admin');
        }, 2000);
      } else {
        setMessage(result.message || 'Chyba pri rušení objednávky');
      }
    } catch (error) {
      console.error('Error cancelling order:', error);
      setMessage('Chyba pri komunikácii so serverom');
    } finally {
      setActionLoading(false);
    }
  };

  // Funkcia pre upload finálnych súborov
  const handleFileUpload = async (event) => {
    const files = event.target.files;
    if (!files.length) return;

    setActionLoading(true);
    setMessage('');

    const formData = new FormData();
    formData.append('order_id', orderId);
    
    for (let i = 0; i < files.length; i++) {
      formData.append('files[]', files[i]);
    }

    try {
      const response = await fetch('/app/src/php/upload-final-files.php', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();
      
      if (result.success) {
        setMessage('Súbory boli úspešne nahrané!');
        // Reload data
        window.location.reload();
      } else {
        setMessage(result.message || 'Chyba pri nahrávaní súborov');
      }
    } catch (error) {
      console.error('Error uploading files:', error);
      setMessage('Chyba pri nahrávaní súborov');
    } finally {
      setActionLoading(false);
    }
  };

  // Funkcia pre označenie ako dokončené
  const handleMarkCompleted = async () => {
    setActionLoading(true);
    setMessage('');

    try {
      const response = await fetch('/app/src/php/mark-order-completed.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          order_id: orderId
        })
      });

      const result = await response.json();
      
      if (result.success) {
        setMessage('Objednávka bola úspešne označená ako dokončená!');
        setOrder(prev => ({ ...prev, status: 'completed' }));
      } else {
        setMessage(result.message || 'Chyba pri označovaní ako dokončená');
      }
    } catch (error) {
      console.error('Error marking completed:', error);
      setMessage('Chyba pri komunikácii so serverom');
    } finally {
      setActionLoading(false);
    }
  };

  // Helper funkcie
  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#f9b400';
      case 'price_negotiation': return '#ff9800';
      case 'in_progress': return '#08d8c0';
      case 'completed': return '#4CAF50';
      case 'cancelled': return '#e55f42';
      default: return '#666';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return 'Čaká na spracovanie';
      case 'price_negotiation': return 'Cenové vyjednávanie';
      case 'in_progress': return 'V spracovaní';
      case 'completed': return 'Dokončená';
      case 'cancelled': return 'Zrušená';
      default: return 'Neznámy stav';
    }
  };

  if (loading) {
    return (
      <div className="order-admin-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Načítavam detail objednávky...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="order-admin-page">
        <div className="error-container">
          <div className="error-icon"></div>
          <h2>Chyba</h2>
          <p>{error}</p>
          <button onClick={() => navigate('/admin')} className="back-btn">
            Späť na dashboard
          </button>
        </div>
      </div>
    );
  }

  const lastNegotiation = negotiations[negotiations.length - 1];
  const canMakeCounterOffer = order.price_status !== 'agreed' && order.status !== 'completed' && order.status !== 'cancelled';
  const priceAgreed = order.price_status === 'agreed';
  


  return (
    <div className="order-admin-page">
      <div className="order-admin-container">
        
        {/* Header */}
        <div className="order-header">
          <div className="order-title">
            <h1>Správa objednávky</h1>
            <span className="order-code">#{order.order_token}</span>
          </div>
          <div className="order-status">
            <div 
              className="status-badge" 
              style={{ backgroundColor: getStatusColor(order.status) }}
            >
              {getStatusText(order.status)}
            </div>
          </div>
        </div>

        {/* Customer Info */}
        <div className="customer-section">
          <h2>Informácie o zákazníkovi</h2>
          <div className="customer-grid">
            <div className="info-item">
              <label>Meno</label>
              <span>{order.meno}</span>
            </div>
            <div className="info-item">
              <label>Email</label>
              <span>{order.email}</span>
            </div>
            <div className="info-item">
              <label>Dátum objednávky</label>
              <span>{new Date(order.datum_vytvorenia).toLocaleDateString('sk-SK')}</span>
            </div>
            <div className="info-item">
              <label>Termín dokončenia</label>
              <span>{new Date(order.deadline).toLocaleDateString('sk-SK')}</span>
            </div>
          </div>
        </div>

        {/* Order Details */}
        <div className="order-details">
          <h2>Detail objednávky</h2>
          <div className="details-content">
            <div className="description">
              <label>Popis práce</label>
              <p>{order.popis_prace}</p>
            </div>
            {order.referencne_subory && order.referencne_subory.length > 0 && (
              <div className="files">
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

        {/* Price Negotiation */}
        <div className="price-negotiation">
          <h2>Cenové vyjednávanie</h2>
          
          <div className="price-history">
            <div className="price-item client-price">
              <label>Pôvodný návrh klienta</label>
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
                        {neg.offered_by === 'admin' ? 'Váš protinávrh' : 'Protinávrh zákazníka'}
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

          {canMakeCounterOffer && !priceAgreed && (
            <div className="counter-offer-form">
              <h3>Nový protinávrh</h3>
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
              <div className="offer-actions">
                <button 
                  onClick={handleSubmitCounterOffer}
                  disabled={actionLoading}
                  className="submit-offer-btn"
                >
                  {actionLoading ? 'Odosielam...' : 'Odoslať protinávrh'}
                </button>
                
                {lastNegotiation && lastNegotiation.offered_by === 'customer' && (
                  <button 
                    onClick={handleAcceptClientOffer}
                    disabled={actionLoading}
                    className="accept-offer-btn"
                  >
                    Prijať návrh klienta ({lastNegotiation.price}€)
                  </button>
                )}
              </div>
            </div>
          )}

          {priceAgreed && (
            <div className="price-agreed">
              <div className="agreed-icon">✓</div>
              <span>Cena bola odsúhlasená oboma stranami</span>
              <div className="final-price">{order.agreed_price || lastNegotiation?.price}€</div>
            </div>
          )}
        </div>

        {/* File Upload for Completed Orders */}
        {(order.status === 'in_progress' || order.status === 'completed') && priceAgreed && (
          <div className="file-upload-section">
            <h2>Finálne súbory</h2>
            {!order.deposit_paid_at && (
              <div className="warning-message">
                <div className="warning-icon">⚠️</div>
                <div className="warning-text">
                  <strong>Nemôžete začať pracovať!</strong> Klient ešte nezaplatil zálohu. Čakajte na potvrdenie platby zálohy.
                </div>
              </div>
            )}
            {order.status === 'in_progress' && order.deposit_paid_at && (
              <div className="upload-area">
                <label className="upload-label">
                  <input
                    type="file"
                    multiple
                    onChange={handleFileUpload}
                    disabled={actionLoading}
                    accept=".stl,.zip,.pdf,.jpg,.png"
                  />
                  <div className="upload-content">
                    <div className="upload-icon"></div>
                    <span>Kliknite pre výber súborov alebo presuňte sem</span>
                    <small>STL, ZIP súbory</small>
                  </div>
                </label>
              </div>
            )}
            
            {order.final_files && order.final_files.length > 0 && (
              <div className="uploaded-files">
                <h3>Nahrané súbory</h3>
                {order.final_files.map((file, index) => (
                  <div key={index} className="file-item">
                    <div className="file-icon"></div>
                    <div className="file-info">
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
                ))}
              </div>
            )}

            {order.status === 'in_progress' && order.final_files && order.final_files.length > 0 && (
              <button 
                onClick={handleMarkCompleted}
                disabled={actionLoading}
                className="complete-btn"
              >
                Označiť ako dokončené
              </button>
            )}
          </div>
        )}

        {/* Order Actions */}
        <div className="order-actions">
          {canMakeCounterOffer && !priceAgreed && (
            <button 
              onClick={handleCancelOrder}
              disabled={actionLoading}
              className="cancel-btn"
            >
              Zrušiť objednávku
            </button>
          )}
          
          <button onClick={() => navigate('/admin')} className="back-btn">
            Späť na dashboard
          </button>
        </div>

        {/* Messages */}
        {message && (
          <div className={`message-container ${message.includes('úspešne') ? 'success' : 'error'}`}>
            <div className="message-icon"></div>
            <div className="message-text">{message}</div>
          </div>
        )}


      </div>
    </div>
  );
};

export default OrderInfoAdmin;