import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { adminGetOrderDetails, adminUpdateOrderStatus, adminUpdatePrice } from '@/services/api';
import './OrderInfoAdmin.css';

function OrderInfoAdmin() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [uploading, setUploading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [orderFiles, setOrderFiles] = useState([]);
  const [editingFileId, setEditingFileId] = useState(null);
  const [editingFileName, setEditingFileName] = useState('');

  useEffect(() => {
    fetchOrderDetails();
  }, [id]);

  // Načítať súbory objednávky
  useEffect(() => {
    if (order?.id) {
      fetchOrderFiles();
    }
  }, [order?.id]);

  const fetchOrderFiles = async () => {
    try {
      const response = await fetch(`/index.php?path=/orders/${id}/files`);
      const result = await response.json();
      if (result.success) {
        setOrderFiles(result.data || []);
      }
    } catch (err) {
      console.error('Error fetching files:', err);
    }
  };

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      const result = await adminGetOrderDetails(id);
      
      if (result.success) {
        setOrder(result.data);
        setNewPrice('');
      } else {
        setError(result.message || 'Chyba pri načítaní objednávky');
      }
    } catch (err) {
      setError('Chyba pri komunikácii so serverom');
      console.error('Fetch order error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePriceUpdate = async () => {
    const price = parseFloat(newPrice);

    // Check if empty
    if (!newPrice || newPrice.trim() === '') {
      setError('Cena je povinná');
      return;
    }

    // Check if valid number
    if (isNaN(price)) {
      setError('Cena musí byť číslo');
      return;
    }

    // Min value
    if (price < 0.01) {
      setError('Cena musí byť aspoň 0.01 €');
      return;
    }

    // Max value
    if (price > 999999.99) {
      setError('Cena je príliš vysoká (max. 999999.99 €)');
      return;
    }

    // Check decimal places
    if (!/^\d+(\.\d{1,2})?$/.test(newPrice)) {
      setError('Cena môže mať maximálne 2 desatinné miesta');
      return;
    }

    try {
      const result = await adminUpdatePrice(id, price);
      
      if (result.success) {
        setSuccessMessage('Cena bola navrhnutá zákazníkovi. Čakáme na jeho akceptáciu.');
        setTimeout(() => setSuccessMessage(''), 3000);
        setNewPrice('');
        // Obnoviť detaily
        fetchOrderDetails();
      } else {
        setError(result.message || 'Chyba pri zmene ceny');
      }
    } catch (err) {
      setError('Chyba pri zmene ceny');
    }
  };

  const handleFileUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const formData = new FormData();
      for (let i = 0; i < files.length; i++) {
        formData.append('files[]', files[i]);
      }
      formData.append('order_id', id);

      // Nahrať súbory na server
      const response = await fetch('/index.php?path=/orders/' + id + '/upload', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (result.success) {
        setSuccessMessage(`${files.length} súbor(y) bol(i) nahraný(é). Objednávka je dokončená.`);
        
        // Resetovať input
        e.target.value = '';
        
        // Reloadovať detaily - status sa už zmenil na backend
        setTimeout(() => {
          fetchOrderDetails();
          setSuccessMessage('');
        }, 2000);
      } else {
        setError(result.message || 'Chyba pri nahrávání súborov');
      }
    } catch (err) {
      setError('Chyba pri nahrávání súborov');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteOrder = async () => {
    if (!window.confirm('Naozaj chceš zmazať túto objednávku? Táto akcia sa nedá vrátiť!')) {
      return;
    }

    try {
      const response = await fetch('/index.php?path=/orders/' + id, {
        method: 'DELETE'
      });

      const result = await response.json();

      if (result.success) {
        setSuccessMessage('Objednávka bola vymazaná.');
        setTimeout(() => {
          navigate('/admin');
        }, 1500);
      } else {
        setError(result.message || 'Chyba pri mazaní objednávky');
      }
    } catch (err) {
      setError('Chyba pri mazaní objednávky');
    }
  };

  // Pomocná funkcia na odstránenie prefixu (order_id_)
  const stripFilePrefix = (fileName) => {
    // Formát: "5_model.zip" -> "model.zip"
    const parts = fileName.split('_');
    if (parts.length > 1 && /^\d+$/.test(parts[0])) {
      return fileName.substring(parts[0].length + 1);
    }
    return fileName;
  };

  // Pomocná funkcia na pridanie prefixu (model.zip -> 5_model.zip)
  const addFilePrefix = (fileName, orderId) => {
    // Ak už má prefix, neprida znova
    const parts = fileName.split('_');
    if (parts.length > 1 && /^\d+$/.test(parts[0]) && parts[0] === String(orderId)) {
      return fileName;
    }
    return `${orderId}_${fileName}`;
  };

  // UPDATE operácia na order_files (zmena názvu súboru)
  const handleEditFileName = (fileId, currentFileName) => {
    setEditingFileId(fileId);
    // Zobraziť názov BEZ prefixu
    setEditingFileName(stripFilePrefix(currentFileName));
  };

  const handleSaveFileName = async (fileId) => {
    if (!editingFileName.trim()) {
      setError('Názov súboru nemôže byť prázdny');
      return;
    }

    try {
      // Pridať prefix späť pred odoslaním na backend
      const fileNameWithPrefix = addFilePrefix(editingFileName, order.id);
      
      const response = await fetch(`/index.php?path=/files/${fileId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ file_name: fileNameWithPrefix })
      });

      const result = await response.json();

      if (result.success) {
        setSuccessMessage('Názov súboru bol zmenený');
        setEditingFileId(null);
        fetchOrderFiles();
        setTimeout(() => setSuccessMessage(''), 2000);
      } else {
        setError(result.message || 'Chyba pri zmene názvu súboru');
      }
    } catch (err) {
      setError('Chyba pri zmene názvu súboru');
      console.error('Error updating file name:', err);
    }
  };

  const handleDeleteFile = async (fileId) => {
    if (!window.confirm('Naozaj chceš odstrániť tento súbor?')) {
      return;
    }

    try {
      const response = await fetch(`/index.php?path=/files/${fileId}`, {
        method: 'DELETE'
      });

      const result = await response.json();

      if (result.success) {
        setSuccessMessage('Súbor bol vymazaný');
        fetchOrderFiles();
        setTimeout(() => setSuccessMessage(''), 2000);
      } else {
        setError(result.message || 'Chyba pri mazaní súboru');
      }
    } catch (err) {
      setError('Chyba pri mazaní súboru');
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'new': return 'Nová';
      case 'in_progress': return 'V procese';
      case 'completed': return 'Dokončená';
      case 'canceled': return 'Zrušená';
      default: return status;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'new': return '#f39c12';
      case 'in_progress': return '#3498db';
      case 'completed': return '#27ae60';
      case 'canceled': return '#e74c3c';
      default: return '#95a5a6';
    }
  };

  const formatPrice = (price) => {
    return price ? `${parseFloat(price).toFixed(2)} €` : '-';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('sk-SK');
  };

  if (loading) {
    return (
      <div className="order-info-admin-loading">
        <div className="loading-spinner"></div>
        <p>Načítava sa objednávka...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="order-info-admin-error">
        <p>Objednávka nebola nájdená</p>
        <button onClick={() => navigate('/admin')} className="back-btn">
          Späť na dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="order-info-admin">
      {/* Main Content */}
      <main className="order-info-main">
        
        {/* Info Card */}
        <section className="order-info-card">
          <h2>Informácie o objednávke</h2>
          <div className="info-grid">
            <div className="info-item">
              <label>Zákazník</label>
              <p className="info-value">{order.customer_name}</p>
            </div>
            <div className="info-item">
              <label>Email</label>
              <p className="info-value">
                <a href={`mailto:${order.customer_email}`}>{order.customer_email}</a>
              </p>
            </div>
            <div className="info-item">
              <label>Popis práce</label>
              <p className="info-value">{order.description}</p>
            </div>
            <div className="info-item">
              <label>Deadline</label>
              <p className="info-value">{formatDate(order.deadline)}</p>
            </div>
            <div className="info-item">
              <label>Dohodnutá cena</label>
              <p className="info-value">{formatPrice(order.price)}</p>
            </div>
            <div className="info-item">
              <label>Vytvorená</label>
              <p className="info-value">{formatDate(order.created_at)}</p>
            </div>
          </div>
        </section>

        {/* Price Card */}
        <section className="status-price-card">
          <h2>Cena</h2>

          <div className="price-section">
            {/* Stav ceny */}
            {order.status === 'canceled' ? (
              <div className="counter-offer-subsection">
                <label>Objednávka bola zrušená</label>
                <p className="price-status-text">❌ Zákazník odmietol ponuku.</p>
              </div>
            ) : order.status === 'new' && order.price > 0 ? (
              <div className="counter-offer-subsection">
                <label>Návrh čaká na schválenie</label>
                <p className="price-display price-suggested">{formatPrice(order.price)}</p>
                <p className="price-status-text">⏳ Zákazník rozhoduje o tejto cene</p>
              </div>
            ) : order.status === 'in_progress' && order.price > 0 ? (
              <div className="counter-offer-subsection">
                <label>Cena schválená zákazníkom</label>
                <p className="price-display price-approved">{formatPrice(order.price)}</p>
                <p className="price-status-text">✓ Zákazník schválil túto cenu</p>
              </div>
            ) : order.status === 'new' ? (
              <div className="counter-offer-subsection">
                <label htmlFor="price-input">Navrhnúť cenu zákazníkovi</label>
                <div className="price-controls">
                  <input
                    id="price-input"
                    type="number"
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    placeholder="Zadajte cenu"
                    className="price-input"
                    step="0.01"
                    min="0"
                  />
                  <span className="currency">€</span>
                  <button onClick={handlePriceUpdate} className="update-price-btn">
                    Navrhnúť
                  </button>
                </div>
              </div>
            ) : (
              <div className="counter-offer-subsection">
                <label>Objednávka je v procese alebo dokončená</label>
                <p className="price-status-text">💰 Cena: {formatPrice(order.price)}</p>
              </div>
            )}
          </div>
        </section>

        {/* Files List Card */}
        {orderFiles.length > 0 && (
          <section className="files-card">
            <h2>Nahraté súbory ({orderFiles.length})</h2>
            <div className="files-list">
              {orderFiles.map(file => (
                <div key={file.id} className="file-item">
                  <div className="file-info">
                    <span className="file-icon">📄</span>
                    {editingFileId === file.id ? (
                      <div className="file-edit-form">
                        <input
                          type="text"
                          value={editingFileName}
                          onChange={(e) => setEditingFileName(e.target.value)}
                          className="file-edit-input"
                          autoFocus
                        />
                        <button
                          onClick={() => handleSaveFileName(file.id)}
                          className="save-btn-small"
                        >
                          ✓ Uložiť
                        </button>
                        <button
                          onClick={() => setEditingFileId(null)}
                          className="cancel-btn-small"
                        >
                          ✕ Zrušiť
                        </button>
                      </div>
                    ) : (
                      <div className="file-name-display">
                        <p className="file-name">{stripFilePrefix(file.file_name)}</p>
                        <p className="file-size">{(file.file_size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                    )}
                  </div>
                  {editingFileId !== file.id && (
                    <div className="file-actions">
                      <button
                        onClick={() => handleEditFileName(file.id, file.file_name)}
                        className="edit-btn-small"
                        title="Zmeniť názov"
                      >
                        ✎ Zmeniť
                      </button>
                      <button
                        onClick={() => handleDeleteFile(file.id)}
                        className="delete-btn-small"
                        title="Odstrániť súbor"
                      >
                        🗑 Odstrániť
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Upload Card */}
        <section className="upload-card">
          <h2>Nahrávanie finálnych súborov</h2>
          
          <div className="upload-status">
            <label>Status nahrávky</label>
            <div className="upload-indicator">
              {order.final_ready ? (
                <div className="uploaded">
                  <span className="indicator-icon">✓</span>
                  <span>Súbory sú nahraté</span>
                </div>
              ) : (
                <div className="not-uploaded">
                  <span className="indicator-icon">○</span>
                  <span>Čakajúce na nahrávku</span>
                </div>
              )}
            </div>
          </div>

          <div className="upload-section">
            <input
              id="file-input"
              type="file"
              multiple
              onChange={handleFileUpload}
              disabled={uploading || order.status !== 'in_progress' || !order.price}
              className="file-input"
            />
            <label 
              htmlFor="file-input" 
              className={`upload-label ${order.status !== 'in_progress' || !order.price ? 'disabled' : ''}`}
            >
              {uploading ? 'Nahrávajú sa súbory...' : 'Vybrať súbory'}
            </label>
            {order.status !== 'in_progress' && (
              <p className="upload-hint-disabled">
                Objednávka musí byť v stave "V procese" aby bolo možné nahrať súbory
              </p>
            )}
            {order.status === 'in_progress' && !order.price && (
              <p className="upload-hint-disabled">
                Najprv musíte dohodnúť cenu so zákazníkom
              </p>
            )}
          </div>
        </section>

        {/* Action Buttons */}
        <section className="action-buttons">
          <button className="back-btn" onClick={() => navigate('/admin')}>
            Späť na dashboard
          </button>
          <button className="delete-btn" onClick={handleDeleteOrder}>
            Odstrániť objednávku
          </button>
        </section>

        {/* Messages */}
        {error && <div className="error-message">{error}</div>}
        {successMessage && <div className="success-message">{successMessage}</div>}

      </main>
    </div>
  );
}

export default OrderInfoAdmin;
