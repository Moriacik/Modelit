import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import './Header.css';

function Header() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Považujeme za "scrolled" keď sme viac ako 100px od vrchu
      const scrolled = window.scrollY > 100;
      setIsScrolled(scrolled);
    };

    window.addEventListener('scroll', handleScroll);
    
    // Kontrola pri načítaní stránky
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`header ${isScrolled ? 'scrolled' : ''}`}>
      <div className="header-container">
        <div className="logo">
          <Link to="/">
            <h1>Logo</h1>
          </Link>
        </div>
        
        <div className="hamburger-menu-container">
          <div className="hamburger-menu">
            <span className="hamburger-line"></span>
            <span className="hamburger-line"></span>
            <span className="hamburger-line"></span>
          </div>

          <nav className="nav">
            <ul className="nav-list">
              <li><Link to="/">Domov</Link></li>
              <li><Link to="/objednavka">Objednávky</Link></li>
              <li><Link to="/login">Prihlásenie</Link></li>
            </ul>
          </nav>
        </div>
      </div>
    </header>
  );
}

export default Header;