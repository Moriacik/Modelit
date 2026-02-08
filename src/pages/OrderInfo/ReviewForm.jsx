import { useState } from 'react';
import { createReview } from '@/services/api';
import './ReviewForm.css';

export default function ReviewForm({ orderId, onSuccess }) {
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_role: '',
    text: '',
    rating: 5
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const validateForm = () => {
    setError('');

    // Validácia mena
    if (!formData.customer_name.trim()) {
      setError('Meno je povinné');
      return false;
    }
    if (formData.customer_name.length < 2 || formData.customer_name.length > 100) {
      setError('Meno musí mať 2-100 znakov');
      return false;
    }

    // Validácia role
    if (!formData.customer_role.trim()) {
      setError('Rola je povinná');
      return false;
    }
    if (formData.customer_role.length < 2 || formData.customer_role.length > 50) {
      setError('Rola musí mať 2-50 znakov');
      return false;
    }

    // Validácia textu
    if (!formData.text.trim()) {
      setError('Text recenzie je povinný');
      return false;
    }
    if (formData.text.length < 10 || formData.text.length > 1000) {
      setError('Text musí mať 10-1000 znakov');
      return false;
    }

    // Validácia ratingu
    const rating = parseInt(formData.rating);
    if (rating < 1 || rating > 5) {
      setError('Hodnotenie musí byť 1-5');
      return false;
    }

    return true;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const result = await createReview({
        customer_name: formData.customer_name,
        customer_role: formData.customer_role,
        text: formData.text,
        rating: parseInt(formData.rating)
      });

      if (result.success) {
        setSuccess('Ďakujeme za vašu recenziu! 🎉');
        setFormData({
          customer_name: '',
          customer_role: '',
          text: '',
          rating: 5
        });
        setTimeout(() => {
          setSuccess('');
          onSuccess?.();
        }, 2000);
      } else {
        setError(result.message || 'Chyba pri odoslaní recenzie');
      }
    } catch (err) {
      setError('Chyba pri komunikácii so serverom');
    } finally {
      setLoading(false);
    }
  };

  const characterCount = formData.text.length;

  return (
    <form className="review-form" onSubmit={handleSubmit}>
      <h3>Zdieľajte vašu skúsenosť</h3>
      <p>Vaša recenzia nám pomáha zlepšovať našu službu a ďalším zákazníkom si vytvoriť predstavu o kvalite našej práce.</p>

      {error && <div className="form-error">{error}</div>}
      {success && <div className="form-success">{success}</div>}

      <div className="form-group">
        <label htmlFor="customer_name">Vaše meno *</label>
        <input
          type="text"
          id="customer_name"
          name="customer_name"
          value={formData.customer_name}
          onChange={handleChange}
          placeholder="napr. Ján Varga"
          maxLength="100"
          disabled={loading}
        />
        <small>{formData.customer_name.length}/100</small>
      </div>

      <div className="form-group">
        <label htmlFor="customer_role">Vaša rola/profesia *</label>
        <select
          id="customer_role"
          name="customer_role"
          value={formData.customer_role}
          onChange={handleChange}
          disabled={loading}
        >
          <option value="">-- Vyberte rolu --</option>
          <option value="Designer">Designer</option>
          <option value="Architect">Architekt</option>
          <option value="Engineer">Inžinier</option>
          <option value="Student">Študent</option>
          <option value="Game Developer">Game Developer</option>
          <option value="Entrepreneur">Podnikateľ</option>
          <option value="Hobbyist">Záujemca</option>
          <option value="Other">Iné</option>
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="rating">Hodnotenie *</label>
        <div className="rating-selector">
          {[1, 2, 3, 4, 5].map(star => (
            <button
              key={star}
              type="button"
              className={`star ${parseInt(formData.rating) >= star ? 'active' : ''}`}
              onClick={() => setFormData(prev => ({ ...prev, rating: star }))}
              disabled={loading}
              title={`${star} ${star === 1 ? 'hviezda' : 'hviezd'}`}
            >
              ★
            </button>
          ))}
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="text">Vaša recenzia *</label>
        <textarea
          id="text"
          name="text"
          value={formData.text}
          onChange={handleChange}
          placeholder="Podelíte sa s nami o vašej skúsenosti? Čo sa vám páčilo? Čo by sme mohli zlepšiť?"
          maxLength="1000"
          rows="5"
          disabled={loading}
        />
        <small>{characterCount}/1000</small>
      </div>

      <button
        type="submit"
        className="btn btn-primary"
        disabled={loading}
      >
        {loading ? 'Odosielam...' : 'Odoslať recenziu'}
      </button>
    </form>
  );
}
