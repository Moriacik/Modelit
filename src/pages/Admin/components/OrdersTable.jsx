import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminGetOrders } from '@/services/api';
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
      const result = await adminGetOrders();
      
      if (result.success) {
        setOrders(result.data.orders || []);
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
      case 'new': return '#f39c12';
      case 'in_progress': return '#3498db';
      case 'completed': return '#27ae60';
      default: return '#95a5a6';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'new': return 'Nová';
      case 'in_progress': return 'V procese';
      case 'waiting_approval': return 'Čaka schválenie';
      case 'completed': return 'Dokončená';
      case 'cancelled': return 'Zrušená';
      default: return status;
    }
  };

  const formatPrice = (price) => {
    return price ? `${parseFloat(price).toFixed(2)} €` : '-';
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
          <h2>Počet objednávok: {filteredOrders.length}</h2>
        </div>
        
        <div className="orders-controls">
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            className="status-filter"
          >
            <option value="all">Všetky statusy</option>
            <option value="new">Nové</option>
            <option value="in_progress">V procese</option>
            <option value="completed">Dokončené</option>
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
              <th>Token</th>
              <th>Zákazník</th>
              <th>Status</th>
              <th>Deadline</th>
              <th>Cena</th>
              <th>Akcie</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.map(order => (
              <tr key={order.id} className="order-row">
                <td className="order-token">
                  <strong>{order.order_token}</strong>
                </td>
                <td className="customer-name">{order.customer_name}</td>
                <td className="order-status">
                  <span 
                    className="status-badge"
                    style={{ backgroundColor: getStatusColor(order.status) }}
                  >
                    {getStatusText(order.status)}
                  </span>
                </td>
                <td className="order-deadline">
                  {order.deadline ? formatDate(order.deadline) : 'Nezadané'}
                </td>
                <td className="order-price">{formatPrice(order.price)}</td>
                <td className="order-actions">
                  <button
                    onClick={() => navigate(`/admin/orders/${order.id}`)}
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