import './Footer.css';

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-content">
          <div className="footer-section">
            <h3>Portfolio</h3>
            <p>Profesionálne webové riešenia a dizajn.</p>
          </div>
          <div className="footer-section">
            <h4>Kontakt</h4>
            <p>Email: info@portfolio.sk</p>
            <p>Telefón: +421 123 456 789</p>
          </div>
          <div className="footer-section">
            <h4>Sledujte nás</h4>
            <div className="social-links">
              <a href="#" aria-label="Facebook">FB</a>
              <a href="#" aria-label="Instagram">IG</a>
              <a href="#" aria-label="LinkedIn">LI</a>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2024 Portfolio. Všetky práva vyhradené.</p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;