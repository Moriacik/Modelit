import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './OrdersTable.css';

function OrdersTable() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'nova': return '#f39c12';
      case 'pending': return '#9b59b6';
      case 'price_negotiation': return '#e67e22';
      case 'in_progress': return '#3498db';
      case 'completed': return '#27ae60';
      case 'cancelled': return '#e74c3c';
      default: return '#95a5a6';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'nova': return 'Nová';
      case 'pending': return 'Čakajúca';
      case 'price_negotiation': return 'Vyjednávanie';
      case 'in_progress': return 'V procese';
      case 'completed': return 'Dokončená';
      case 'cancelled': return 'Zrušená';
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
            <option value="pending">Čakajúce</option>
            <option value="price_negotiation">Vyjednávanie</option>
            <option value="in_progress">V procese</option>
            <option value="completed">Dokončené</option>
            <option value="cancelled">Zrušené</option>
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
                  <button
                    onClick={() => navigate(`/admin/order/${order.id}`)}
                    className="manage-btn"
                    title="Spravovať objednávku"
                  >
                    ⚙️ Spravovať
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
    </div>
  );
}

export default OrdersTable;