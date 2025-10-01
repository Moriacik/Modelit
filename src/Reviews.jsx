
import { useEffect, useState } from "react";
import "./Reviews.css";

function Reviews() {
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    fetch("http://localhost/app/src/php/reviews.php")
      .then((res) => {
        if (!res.ok) throw new Error("Chyba pri načítaní recenzií");
        return res.json();
      })
      .then((data) => {
        setReviews(data);
        setLoading(false);
      });
  }, []);

  // Pre animáciu a duplikáciu kariet
  const allReviews = [...reviews, ...reviews];

  return (
    <section className="reviews-section">
      <h2 className="reviews-title">Recenzie od klientov</h2>
      <div className="reviews-row left">
        {allReviews.map((r, i) => (
          <div key={i} className="review-card">
            <p className="review-text">{r.review}</p>
            <div className="review-author">
              <div className="review-author-info">
                <span className="review-name">{r.name}</span>
                <span className="review-role">{r.role}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="reviews-row right">
        {allReviews.map((r, i) => (
          <div key={i + "-row2"} className="review-card">
            <p className="review-text">{r.review}</p>
            <div className="review-author">
              <div className="review-author-info">
                <span className="review-name">{r.name}</span>
                <span className="review-role">{r.role}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default Reviews;