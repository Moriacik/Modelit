import './Footer.css';

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-content">
          <div className="footer-section">
            <h4>Kontakt</h4>
            <ul>
              <li>info@qualix.sk</li>
            </ul>
          </div>
          
          <div className="footer-section">
            <h4>Sledujte nás</h4>
            <div className="social-links">
              <a href="#" aria-label="LinkedIn">IN</a>
              <a href="#" aria-label="GitHub">GH</a>
              <a href="#" aria-label="Twitter">TW</a>
            </div>
          </div>
        </div>
        

      </div>
    </footer>
  );
}

export default Footer;