import { useEffect, useState } from "react";
import "./Home.css";

function Home() {
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    fetch("http://localhost/projects.php")
      .then((res) => res.json())
      .then((data) => setProjects(data))
      .catch((err) => console.error("Chyba pri načítaní:", err));
  }, []);

  return (
    <div className="home-container">
        {/* Header */}
        <header className="home-header">
            <h1>👋 Vitaj na mojom portfóliu</h1>
            <p>Pozri si moje posledné projekty</p>
        </header>

        {/* Projekty */}
        <div className="projects-grid">
        {projects.map((p) => (
            <div key={p.id} className="project-card">
            <h2>{p.title}</h2>
            <p>{p.description}</p>
            <a href={p.link} target="_blank" rel="noreferrer">
                Otvoriť projekt
            </a>
            </div>
        ))}
        </div>


        {/* Footer */}
        <footer className="home-footer">
            © {new Date().getFullYear()} Moje portfólio
        </footer>
    </div>
  );
}

export default Home;