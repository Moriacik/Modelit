import { useState, useEffect } from 'react';
import './OrdersTable.css';

function OrdersTable() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await fetch('/app/src/php/get-orders.php');
      const result = await response.json();
      
      if (result.success) {
        setOrders(result.orders);
      } else {
        setError(result.message || 'Chyba pri načítaní objednávok');
      }
    } catch (err) {
      setError('Chyba pri komunikácii so serverom');
      console.error('Fetch orders error:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const response = await fetch('/app/src/php/update-order-status.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          order_id: orderId,
          status: newStatus
        })
      });

      const result = await response.json();
      
      if (result.success) {
        // Aktualizácia lokálneho stavu
        setOrders(orders.map(order => 
          order.id === orderId 
            ? { ...order, status: newStatus }
            : order
        ));
        setError('');
      } else {
        setError(result.message || 'Chyba pri aktualizácii statusu');
      }
    } catch (err) {
      setError('Chyba pri komunikácii so serverom');
      console.error('Update status error:', err);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'nova': return '#f39c12';
      case 'v_procese': return '#3498db';
      case 'dokoncena': return '#27ae60';
      case 'zrusena': return '#e74c3c';
      default: return '#95a5a6';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'nova': return 'Nová';
      case 'v_procese': return 'V procese';
      case 'dokoncena': return 'Dokončená';
      case 'zrusena': return 'Zrušená';
      default: return status;
    }
  };

  const formatPrice = (price) => {
    return price ? `${parseFloat(price).toFixed(2)} €` : 'Nezadané';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('sk-SK');
  };

  const filteredOrders = orders.filter(order => 
    statusFilter === 'all' || order.status === statusFilter
  );

  if (loading) {
    return (
      <div className="orders-loading">
        <div className="loading-spinner"></div>
        <p>Načítavajú sa objednávky...</p>
      </div>
    );
  }

  return (
    <div className="orders-table-container">
      <div className="orders-header">
        <div className="orders-title">
          <h2>Správa objednávok</h2>
          <span className="orders-count">{filteredOrders.length} objednávok</span>
        </div>
        
        <div className="orders-controls">
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            className="status-filter"
          >
            <option value="all">Všetky statusy</option>
            <option value="nova">Nové</option>
            <option value="v_procese">V procese</option>
            <option value="dokoncena">Dokončené</option>
            <option value="zrusena">Zrušené</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="orders-table-wrapper">
        <table className="orders-table">
          <thead>
            <tr>
              <th>Číslo objednávky</th>
              <th>Zákazník</th>
              <th>Email</th>
              <th>Cena</th>
              <th>Deadline</th>
              <th>Status</th>
              <th>Vytvorené</th>
              <th>Akcie</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.map(order => (
              <tr key={order.id} className="order-row">
                <td className="order-token">
                  <strong>{order.order_token}</strong>
                </td>
                <td className="customer-name">{order.meno}</td>
                <td className="customer-email">
                  <a href={`mailto:${order.email}`}>{order.email}</a>
                </td>
                <td className="order-price">{formatPrice(order.odhadovana_cena)}</td>
                <td className="order-deadline">
                  {order.deadline ? formatDate(order.deadline) : 'Nezadané'}
                </td>
                <td className="order-status">
                  <span 
                    className="status-badge"
                    style={{ backgroundColor: getStatusColor(order.status) }}
                  >
                    {getStatusText(order.status)}
                  </span>
                </td>
                <td className="order-created">{formatDate(order.datum_vytvorenia)}</td>
                <td className="order-actions">
                  <select
                    value={order.status}
                    onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                    className="status-select"
                  >
                    <option value="nova">Nová</option>
                    <option value="v_procese">V procese</option>
                    <option value="dokoncena">Dokončená</option>
                    <option value="zrusena">Zrušená</option>
                  </select>
                  
                  <button
                    onClick={() => setSelectedOrder(order)}
                    className="view-btn"
                    title="Zobraziť detaily"
                  >
                    i
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredOrders.length === 0 && !loading && (
          <div className="no-orders">
            <p>Žiadne objednávky neboli nájdené.</p>
          </div>
        )}
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="order-modal-overlay" onClick={() => setSelectedOrder(null)}>
          <div className="order-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Detail objednávky {selectedOrder.order_token}</h3>
              <button 
                onClick={() => setSelectedOrder(null)}
                className="close-btn"
              >
                ✕
              </button>
            </div>
            
            <div className="modal-content">
              <div className="order-info-grid">
                <div className="info-item">
                  <label>Zákazník:</label>
                  <span>{selectedOrder.meno}</span>
                </div>
                
                <div className="info-item">
                  <label>Email:</label>
                  <span>{selectedOrder.email}</span>
                </div>
                
                <div className="info-item">
                  <label>Odhadovaná cena:</label>
                  <span>{formatPrice(selectedOrder.odhadovana_cena)}</span>
                </div>
                
                <div className="info-item">
                  <label>Deadline:</label>
                  <span>{selectedOrder.deadline ? formatDate(selectedOrder.deadline) : 'Nezadané'}</span>
                </div>
                
                <div className="info-item full-width">
                  <label>Popis práce:</label>
                  <p className="description-text">{selectedOrder.popis_prace}</p>
                </div>

                {selectedOrder.referencne_subory && JSON.parse(selectedOrder.referencne_subory).length > 0 && (
                  <div className="info-item full-width">
                    <label>Referenčné súbory:</label>
                    <ul className="files-list">
                      {JSON.parse(selectedOrder.referencne_subory).map((file, index) => (
                        <li key={index}>
                          <a href={`/app/uploads/orders/${file.filename}`} target="_blank" rel="noopener noreferrer">
                            {file.original_name}
                          </a>
                          <span className="file-size">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default OrdersTable;