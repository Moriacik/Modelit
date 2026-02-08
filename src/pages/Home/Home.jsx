import React, { useEffect, useState, useRef } from 'react';
import { getPublishedReviews } from '@/services/api';
import './Home.css';

const Home = () => {
  const [statsAnimated, setStatsAnimated] = useState(false);
  const [customerCount, setCustomerCount] = useState(0);
  const [orderCount, setOrderCount] = useState(0);
  const [experienceCount, setExperienceCount] = useState(0);
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const statsRef = useRef(null);
  // Animácia čísiel
  const animateNumber = (start, end, duration, setter) => {
    const startTime = Date.now();
    const animate = () => {
      const currentTime = Date.now();
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      const current = Math.floor(start + (end - start) * progress);
      setter(current);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    animate();
  };

  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.pageYOffset;
      const reviewsSection = document.querySelector('.reviews-scroll');
      const logo = document.querySelector('.scrolling-logo');
      
      // Paralax efekt loga
      if (reviewsSection && logo) {
        const halfViewport = window.innerHeight / 2;
        const reviewsTop = reviewsSection.offsetTop - halfViewport + 100;
        const reviewsBottom = reviewsSection.offsetTop + reviewsSection.offsetHeight - halfViewport - 200;
        
        if (scrolled >= reviewsTop && scrolled <= reviewsBottom) {
          const scrollProgress = (scrolled - reviewsTop) / reviewsSection.offsetHeight;
          const yPos = scrollProgress * 100;
          
          logo.style.transform = `translate(-50%, calc(-50% + ${yPos}px))`;
          logo.style.opacity = '1';
        } else {
          logo.style.opacity = '0';
        }
      }
      
      // Animácia štatistík
      if (statsRef.current && !statsAnimated) {
        const statsTop = statsRef.current.offsetTop;
        const statsBottom = statsTop + statsRef.current.offsetHeight;
        
        if (scrolled + window.innerHeight > statsTop && scrolled < statsBottom) {
          setStatsAnimated(true);
          animateNumber(0, 41, 2000, setCustomerCount);
          animateNumber(0, 85, 2500, setOrderCount);
          animateNumber(0, 4, 1500, setExperienceCount);
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, [statsAnimated]);

  // Načítať recenzie
  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const result = await getPublishedReviews();
        console.log('Reviews result:', result);
        if (result.success) {
          console.log('Setting reviews:', result.data);
          setReviews(result.data || []);
        } else {
          console.error('API error:', result.message);
        }
      } catch (err) {
        console.error('Error fetching reviews:', err);
      } finally {
        setReviewsLoading(false);
      }
    };

    fetchReviews();
  }, []);

  return (
    <div className="home-page">
      <section className="hero-new">
        {/* Ľavá strana - 3 časti */}
        <div className="hero-new-left">
          {/* 1. Odstavec textu na vrchu */}
          <div className="hero-left-top">
            <div className="hero-top-divider"></div>
          </div>
          
          {/* 2. Logo uprostred */}
          <div className="hero-left-middle">
            <p className="hero-top-text">Čas uskutočniť vaše nápady</p>
            <img src="/img/logo.png" alt="Modelit" className="hero-logo" />
          </div>
          
          {/* 3. Text o modely naspod */}
          <div className="hero-left-bottom">
            <p className="hero-model-info">3D návrhy • CAD/CAM • Parametrické modely</p>
          </div>
        </div>
        
        {/* Centrum - Obrázok modelu */}
        <div className="hero-new-center">
          <div className="hero-model-container">
            <img src="/img/landing-page.png" alt="3D Model" className="hero-model" />
          </div>
        </div>
        
        {/* Pravá strana - Body points */}
        <div className="hero-new-right">
          <div className="hero-features">
            <div className="feature-item">
              <span className="feature-number">01</span>
              <div className="feature-content">
                <h3>Všetko pod kontrolou</h3>
                <p>Optimalizujeme CAD/CAM modely na mieru s parametrickým riadením.</p>
              </div>
            </div>
            
            <div className="feature-item">
              <span className="feature-number">02</span>
              <div className="feature-content">
                <h3>Buďte pánmi času</h3>
                <p>Zohľadňujeme vaše potreby a zabezpečíme dodanie včas a podľa plánu.</p>
              </div>
            </div>
            
            <div className="feature-item">
              <span className="feature-number">03</span>
              <div className="feature-content">
                <h3>Presný je naša výsada</h3>
                <p>Naše modely sú vytvorené s dôrazom na každý detail a vysokú kvalitu.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About & Services Section */}
      <section className="about-services">
        {/* About Us Block */}
        <div className="content-block">
          <div className="block-image">
            <img src="/img/img5.png" alt="O nás" />
          </div>
          <div className="block-text">
            <h2>O nás</h2>
            <p>Sme tím vývojárov zameraných na vytvorenie intuitívneho a efektívneho objednávkového systému. Naša vízia je zjednodušiť proces objednávania pre firmy každej veľkosti.</p>
            <p>S dlhoročnými skúsenosťami v oblasti webového vývoja prinášame riešenia, ktoré šetria čas a zlepšujú používateľskú skúsenosť.</p>
          </div>
        </div>

        {/* Services Block */}
        <div className="content-block reverse">
          <div className="block-image">
            <img src="/img/img6.png" alt="Služby" />
          </div>
          <div className="block-text">
            <h2>Služby a Funkcie</h2>
            <p>Náš systém poskytuje kompletnú správu objednávok s pokročilými funkciami pre sledovanie stavu, export dát a používateľské účty.</p>
            <p>Jednoduché rozhranie umožňuje rýchle spracovanie objednávok a efektívnu komunikáciu medzi klientmi a administrátormi.</p>
          </div>
        </div>
      </section>

      {/* Left Divider with Image */}
      <div className="section-divider">
        <img src="/img/divider-left.png" alt="" className="divider-image" />
      </div>

      {/* Statistics Section */}
      <section className="statistics" ref={statsRef}>
        <div className="statistics-container">
          <div className="stat-item">
            <div className="stat-label">Aktívnych Zákazníkov</div>
            <div className="stat-number">{customerCount}+</div>
          </div>
          
          <div className="stat-item">
            <div className="stat-label">Úspešne Spracovaných Objednávok</div>
            <div className="stat-number">{orderCount.toLocaleString()}+</div>
          </div>
          
          <div className="stat-item">
            <div className="stat-label">Rokov Skúseností v Odbore</div>
            <div className="stat-number">{experienceCount}</div>
          </div>
        </div>
      </section>

      {/* Reviews Section with Scrolling Logo */}
      <section className="reviews-scroll">
        <div className="reviews-container">
          <div className="scrolling-logo">
            <div className="logo-track">
              <div className="logo-item">
                <img src="/img/logo.png" alt="Logo" className="logo" />
              </div>
            </div>
          </div>
          
          <div className="reviews-grid">
            {reviewsLoading ? (
              <div style={{gridColumn: '1 / -1', textAlign: 'center', padding: '40px 20px', color: '#999'}}>
                Načítavam recenzie...
              </div>
            ) : reviews && reviews.length > 0 ? (
              reviews.map((review, index) => (
                <div key={review.id} className="review-column" style={{marginLeft: `${(index % 2 === 0 ? 12 : 68) + (index % 3 * 10)}%`}}>
                  <div className="review-card">
                    <p>"{review.text}"</p>
                    <div className="review-author">
                      <strong>{review.customer_name}</strong>
                      <span>{review.customer_role}</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div style={{gridColumn: '1 / -1', textAlign: 'center', padding: '40px 20px', color: '#999'}}>
                Zatiaľ nie sú žiadne recenzie
              </div>
            )}
          </div>
        </div>
      </section>
      <div className="section-divider">
        <img src="/img/divider-right.png" alt="" className="divider-image" />
      </div>

      {/* Call to Action Section */}
      <section className="cta-section">
        <div className="cta-container">
          <div className="cta-content">
            <h2>Pripravení na spoluprácu?</h2>
            <p>Objednajte si náš kvalitný order management systém už dnes a zažite efektivitu na najvyššej úrovni.</p>
            <div className="cta-buttons">
              <button className="cta-secondary">Objednať teraz</button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
