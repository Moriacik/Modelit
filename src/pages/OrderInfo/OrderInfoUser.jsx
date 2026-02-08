import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getOrder, getUploadedFiles, downloadFile } from '@/services/api';
import ReviewForm from './ReviewForm';
import './OrderInfoUser.css';

const API_BASE = '/index.php';

const OrderInfoUser = () => {
  const { orderToken } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [filesLoading, setFilesLoading] = useState(false);

  // Načítanie detailov objednávky
  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        const result = await getOrder(orderToken);
        if (result.success) {
          setOrder(result.data);
          
          // Načítať súbory ak je objednávka dokončená
          if (result.data.status === 'completed' && result.data.final_ready) {
            await fetchUploadedFiles();
          }
        } else {
          setError(result.message || 'Objednávka nebola nájdená');
        }
      } catch (err) {
        console.error('Error fetching order:', err);
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

  const fetchUploadedFiles = async () => {
    try {
      setFilesLoading(true);
      const result = await getUploadedFiles(orderToken);
      if (result.success) {
        setUploadedFiles(result.data.files || []);
      } else {
        console.error('Failed to fetch files:', result.message);
      }
    } catch (err) {
      console.error('Error fetching files:', err);
    } finally {
      setFilesLoading(false);
    }
  };

  const getStatusText = (status) => {
    const statusMap = {
      'new': 'Nová',
      'in_progress': 'V procese',
      'completed': 'Dokončená',
      'canceled': 'Zrušená'
    };
    return statusMap[status] || 'Neznámy stav';
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
          <h2>Chyba</h2>
          <p>{error}</p>
          <button onClick={() => navigate('/login')} className="back-btn">
            Späť na prihlásenie
          </button>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="order-info-page">
        <div className="error-container">
          <p>Objednávka nenájdená</p>
          <button onClick={() => navigate('/login')} className="back-btn">
            Späť na prihlásenie
          </button>
        </div>
      </div>
    );
  }

  const getStatusColor = (status) => {
    const colorMap = {
      'new': '#f39c12',
      'in_progress': '#3498db',
      'completed': '#27ae60',
      'canceled': '#e74c3c'
    };
    return colorMap[status] || '#95a5a6';
  };

  const getStatusIcon = (status) => {
    const iconMap = {
      'new': '📋',
      'in_progress': '⚙️',
      'completed': '✅',
      'canceled': '❌'
    };
    return iconMap[status] || '📋';
  };

  const handleAcceptPrice = async () => {
    try {
      const response = await fetch(`${API_BASE}?path=/orders/${orderToken}/accept-price`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();
      
      if (result.success) {
        setSuccessMessage('Cena bola akceptovaná! Dodávateľ začne pracovať na vašej objednávke.');
        setTimeout(() => {
          setOrder({...order, status: 'in_progress'});
          setSuccessMessage('');
        }, 2000);
      } else {
        setError(result.message || 'Chyba pri akceptácii ceny');
      }
    } catch (err) {
      setError('Chyba pri komunikácii so serverom');
      console.error('Accept price error:', err);
    }
  };

  const handleRejectPrice = async () => {
    if (window.confirm('Chceš odmietnuť túto cenu? Objednávka bude zrušená.')) {
      try {
        const response = await fetch(`${API_BASE}?path=/orders/${orderToken}/reject-price`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          }
        });

        const result = await response.json();
        
        if (result.success) {
          setSuccessMessage('Cena bola odmietnutá. Objednávka bola zrušená.');
          setTimeout(() => {
            setOrder({...order, status: 'canceled', price: null});
            setSuccessMessage('');
          }, 2000);
        } else {
          setError(result.message || 'Chyba pri odmietnutí ceny');
        }
      } catch (err) {
        setError('Chyba pri komunikácii so serverom');
        console.error('Reject price error:', err);
      }
    }
  };

  return (
    <div className="order-info-page">
      <div className="order-info-container">
        {/* Header */}
        <div className="order-header">
          <h1>📋 Detail objednávky</h1>
          <p className="subtitle">Sleduj progres svojej objednávky v reálnom čase</p>
        </div>

        {/* Status Card - Prominent */}
        <div className="status-card-large" style={{ borderLeftColor: getStatusColor(order.status) }}>
          <div className="status-icon-large" style={{ color: getStatusColor(order.status) }}>
            {getStatusIcon(order.status)}
          </div>
          <div className="status-info-large">
            <span className="status-label">Stav objednávky</span>
            <span className="status-text-large" style={{ color: getStatusColor(order.status) }}>
              {getStatusText(order.status)}
            </span>
          </div>
        </div>

        {/* Info Grid - 2 columns */}
        <div className="info-grid">
          {/* Basic Info Card */}
          <div className="info-card">
            <h3>📌 Základné informácie</h3>
            <div className="info-row">
              <span className="label">Meno:</span>
              <span className="value">{order.customer_name}</span>
            </div>
            <div className="info-row">
              <span className="label">Email:</span>
              <span className="value">{order.customer_email}</span>
            </div>
            <div className="info-row">
              <span className="label">Kód objednávky:</span>
              <span className="value code">{order.order_token}</span>
            </div>
          </div>

          {/* Timeline Card */}
          <div className="info-card">
            <h3>⏰ Časový plán</h3>
            <div className="info-row">
              <span className="label">Vytvorená:</span>
              <span className="value">
                {new Date(order.created_at).toLocaleDateString('sk-SK', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </span>
            </div>
            <div className="info-row">
              <span className="label">Deadline:</span>
              <span className="value deadline">
                {new Date(order.deadline).toLocaleDateString('sk-SK', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </span>
            </div>
          </div>
        </div>

        {/* Description Card */}
        <div className="info-card full-width">
          <h3>📝 Popis projektu</h3>
          <p className="description">{order.description}</p>
        </div>

        {/* Price Section */}
        {order.status === 'new' && order.price > 0 && (
          <div className="info-card full-width price-card price-proposal">
            <h3>💰 Návrh ceny od dodávateľa</h3>
            <div className="price-display">{order.price}€</div>
            <div className="price-actions">
              <button onClick={handleAcceptPrice} className="btn btn-success">
                ✓ Prijať ponuku
              </button>
              <button onClick={handleRejectPrice} className="btn btn-danger">
                ✗ Odmietnuť
              </button>
            </div>
          </div>
        )}

        {order.status === 'in_progress' && order.price > 0 && (
          <div className="info-card full-width price-card price-accepted">
            <h3>✔️ Dohodnutá cena</h3>
            <div className="price-display agreed">{order.price}€</div>
          </div>
        )}

        {order.status === 'new' && (!order.price || order.price === 0) && (
          <div className="info-card full-width price-card price-waiting">
            <h3>⏳ Čakanie na ponuku</h3>
            <p>Dodávateľ čoskoro odošle svoju ponuku ceny. Buď trpezlivý 😊</p>
          </div>
        )}

        {order.status === 'canceled' && (
          <div className="info-card full-width price-card price-canceled">
            <h3>❌ Objednávka zrušená</h3>
            <p>Objednávka bola odmietnutá. Ak máš záujem, vytvoriť novú, vráť sa na úvodný formulár.</p>
          </div>
        )}

        {/* Files Section */}
        {order.status === 'completed' && order.final_ready && (
          <>
            <div className="info-card full-width">
              <h3>📁 Hotové súbory</h3>
              {filesLoading ? (
                <p style={{ color: '#999' }}>Načítavam súbory...</p>
              ) : uploadedFiles.length > 0 ? (
                <div className="files-list">
                  {uploadedFiles.map((file, index) => (
                    <div key={index} className="file-item">
                      <div className="file-info">
                        <span className="file-icon">📄</span>
                        <div className="file-details">
                          <p className="file-name">{file.originalName}</p>
                          <p className="file-size">{file.displaySize}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => downloadFile(orderToken, file.name)}
                        className="btn btn-small"
                      >
                        Stiahnuť
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: '#999' }}>Žiadne súbory na stahnutie</p>
              )}
            </div>

            <ReviewForm 
              orderId={order.id} 
              onSuccess={() => {
                setSuccessMessage('Ďakujeme za vašu recenziu! 🙏');
                setTimeout(() => setSuccessMessage(''), 3000);
              }}
            />
          </>
        )}

        {/* Completion Banner */}
        {order.status === 'completed' && (
          <div className="success-banner">
            <span className="banner-icon">🎉</span>
            <div>
              <h3>Objednávka je hotová!</h3>
              <p>Ďakujeme za vašu dôveru. Sme radi, že sme ti mohli pomôcť!</p>
            </div>
          </div>
        )}

        {/* Messages */}
        {successMessage && (
          <div className="alert alert-success">
            <span>✅</span> {successMessage}
          </div>
        )}

        {error && (
          <div className="alert alert-error">
            <span>⚠️</span> {error}
          </div>
        )}

        {/* Back Button */}
        <div className="action-footer">
          <button onClick={() => navigate('/login')} className="btn btn-outline">
            ← Späť na prihlásenie
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderInfoUser;
