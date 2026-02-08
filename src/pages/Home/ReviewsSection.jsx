import { useState, useEffect } from 'react';
import { getPublishedReviews } from '@/services/api';
import './Reviews.css';

export default function Reviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const result = await getPublishedReviews();
        if (result.success) {
          setReviews(result.data || []);
        } else {
          setError(result.message || 'Chyba pri načítaní recenzií');
        }
      } catch (err) {
        console.error('Error fetching reviews:', err);
        setError('Chyba pri komunikácii so serverom');
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, []);

  const renderStars = (rating) => {
    return (
      <div className="stars">
        {[1, 2, 3, 4, 5].map(star => (
          <span key={star} className={`star ${star <= rating ? 'filled' : ''}`}>
            ★
          </span>
        ))}
      </div>
    );
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('sk-SK', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <section className="reviews-section">
        <div className="reviews-container">
          <h2>Recenzie od našich zákazníkov</h2>
          <div className="loading-reviews">Načítavam recenzie...</div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="reviews-section">
        <div className="reviews-container">
          <h2>Recenzie od našich zákazníkov</h2>
          <div className="error-reviews">{error}</div>
        </div>
      </section>
    );
  }

  if (!reviews || reviews.length === 0) {
    return (
      <section className="reviews-section">
        <div className="reviews-container">
          <h2>Recenzie od našich zákazníkov</h2>
          <div className="no-reviews">
            <p>Zatiaľ tu nie sú žiadne recenzie. Buďte prvý, kto sa podelí o svoju skúsenosť!</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="reviews-section">
      <div className="reviews-container">
        <h2>Recenzie od našich zákazníkov</h2>
        <p className="reviews-subtitle">
          Pozrite si, čo hovoria tí, ktorí už s nami spolupracovali
        </p>

        <div className="reviews-grid">
          {reviews.map(review => (
            <div key={review.id} className="review-card">
              <div className="review-header">
                <div className="reviewer-info">
                  <h4 className="reviewer-name">{review.customer_name}</h4>
                  <p className="reviewer-role">{review.customer_role}</p>
                </div>
              </div>

              <div className="review-rating">
                {renderStars(review.rating)}
              </div>

              <p className="review-text">{review.text}</p>

              <p className="review-date">{formatDate(review.created_at)}</p>
            </div>
          ))}
        </div>

        {reviews.length > 6 && (
          <div className="reviews-footer">
            <p>Zobrazujem posledných 6 recenzií</p>
          </div>
        )}
      </div>
    </section>
  );
}
