import { Link } from 'react-router-dom';
import './Header.css';

function Header() {
  return (
    <header className="header">
      <div className="header-container">
        <div className="logo">
          <Link to="/">
            <h1>Portfolio</h1>
          </Link>
        </div>
        <nav className="nav">
          <ul className="nav-list">
            <li><Link to="/">Domov</Link></li>
            <li><a href="#projects">Objednávky</a></li>
            <li><a href="#reviews">Recenzie</a></li>
            <li><Link to="/login">Prihlásenie</Link></li>
          </ul>
        </nav>
      </div>
    </header>
  );
}

export default Header;