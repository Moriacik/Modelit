import { Link } from 'react-router-dom';
import './Header.css';

function Header() {
  return (
    <header className="header">
      <div className="header-container">
        <div className="logo">
          <Link to="/">
            <img src="/img/logo-icon.png" alt="Logo" className="logo-image" />
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