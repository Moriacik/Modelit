import React, { useEffect, useState, useRef } from 'react';
import './Home.css';

const Home = () => {
  const [statsAnimated, setStatsAnimated] = useState(false);
  const [customerCount, setCustomerCount] = useState(0);
  const [orderCount, setOrderCount] = useState(0);
  const [experienceCount, setExperienceCount] = useState(0);
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
  return (
    <div className="home-page">
      <section className="hero">
        {/* Ľavý kontajner - text v hornej časti */}
        <div className="hero-left">
          <h1>Moderné Riešenia<br />Pre Váš Biznis</h1>
        </div>
        
        {/* Pravý kontajner - text v dolnej časti */}
        <div className="hero-right">
          <p className="hero-description">Vytvárame intuitívne webové aplikácie a objednávkové systémy, ktoré zjednodušujú podnikové procesy. Naše riešenia kombinujú moderný dizajn s pokročilou funkcionalitou, aby sme vašim klientom poskytli najlepšiu možnú používateľskú skúsenosť.</p>
        </div>
      </section>

      {/* Right Divider with Image */}
      <div className="section-divider">
        <img src="/img/divider-diamond.png" alt="" className="divider-image" />
      </div>

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
              <div className="logo-item">LOGO</div>
            </div>
          </div>
          
          <div className="reviews-grid">
            <div className="review-column">
              <div className="review-card" style={{marginLeft: '12%'}}>
                <p>"Výborná kvalita služieb a rýchla komunikácia. Náš projekt bol dokončený presne podľa požiadaviek a v stanovenom termíne."</p>
                <div className="review-author">
                  <strong>Peter Novák</strong>
                  <span>CEO, TechStart Solutions</span>
                </div>
              </div>
            </div>
            
            <div className="review-column">
              <div className="review-card" style={{marginLeft: '68%'}}>
                <p>"Profesionálny prístup a skvelé výsledky. Určite budeme spolupracovať aj v budúcnosti. Systém je intuitívny a efektívny."</p>
                <div className="review-author">
                  <strong>Mária Kováčová</strong>
                  <span>Marketing Manager, InnovateTech</span>
                </div>
              </div>
            </div>
            
            <div className="review-column">
              <div className="review-card" style={{marginLeft: '5%'}}>
                <p>"Najlepší order management systém, aký sme kedy používali. Všetko funguje bez problémov a podpora je fantastická."</p>
                <div className="review-author">
                  <strong>Jakub Horváth</strong>
                  <span>Operations Director, LogiFlow</span>
                </div>
              </div>
            </div>
            
            <div className="review-column">
              <div className="review-card" style={{marginLeft: '25%'}}>
                <p>"Rýchle dodanie a perfektná podpora. Odporúčam všetkým, ktorí hľadajú kvalitné riešenia pre svoj business."</p>
                <div className="review-author">
                  <strong>Anna Svobodová</strong>
                  <span>Project Manager, DigitalCorp</span>
                </div>
              </div>
            </div>
            
            <div className="review-column">
              <div className="review-card" style={{marginLeft: '75%'}}>
                <p>"Excelenté riešenie pre naše potreby. Implementácia bola hladká a výsledky prekročili očakávania celého tímu."</p>
                <div className="review-author">
                  <strong>Tomáš Krejčí</strong>
                  <span>IT Director, ModernSystems</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Right Divider with Image */}
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
