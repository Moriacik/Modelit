import './Footer.css';

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-left">
          <p>Modelit &copy; 2024. Všetky práva vyhradené.</p>
        </div>
        
        <div className="footer-right">
          <div className="social-links">
            <a href="mailto:info@modelit.sk" aria-label="Email">info@modelit.sk</a>
            <span className="divider">•</span>
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram">Instagram</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;