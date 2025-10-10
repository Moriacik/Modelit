import React from 'react';
import './Home.css';

const Home = () => {
  return (
    <div className="home-page">
      <section className="hero">
        {/* Left Content */}
        <div className="hero-content">
          <h1>Objednávkový Systém</h1>
          <div className="hero-description">
            <div className="hero-description-text">
              <h3>Jednoduché Objednávanie</h3>
              <p>Rýchle a efektívne spracovanie objednávok s prehľadným rozhraním pre klientov aj administrátorov.</p>
            </div>
          </div>
        </div>

        {/* Center Image */}
        <div className="hero-visual">
          <img src="/img/img2.png" alt="Web Solutions" className="hero-image" />
        </div>

        {/* Right Content */}
        <div className="hero-details">
          <div className="hero-details-box">
            <div className="hero-details-text">
              <h3>Správa Objednávok</h3>
              <p>Pokročilá administrácia s možnosťou sledovania stavu objednávok, exportu dát a kompletnej správy systému.</p>
            </div>
          </div>
          <div className="hero-navigation">
            <button className="nav-arrow">→</button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
