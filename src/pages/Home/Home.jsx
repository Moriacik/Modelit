import { useEffect, useState } from 'react';
import Reviews from './Reviews';
import './Home.css';

function Home() {
  const [projects, setProjects] = useState([]);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    fetch("/app/src/php/projects.php")
      .then((res) => res.json())
      .then((data) => {
        // Obmedzíme na 4 projekty
        setProjects(data.slice(0, 4));
      })
      .catch((err) => console.error("Chyba pri načítaní:", err));
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <main className="home-page">
      <section className="hero-section">
        {projects.map((project, index) => {
          const isYellow = index % 2 === 0;
          // Individuálny paralax pre každý obrázok podľa pozície
          const slideOffset = index * window.innerHeight;
          const relativeScroll = scrollY - slideOffset;
          const paralaxOffset = relativeScroll * 0.5; // Obrázky sa pohybujú pomalšie
          
          return (
            <div 
              key={project.id} 
              className={`project-slide ${isYellow ? 'yellow-bg' : 'white-bg'}`}
            >
              <img 
                src={project.image} 
                alt={project.title}
                className="project-image"
                style={{
                  transform: `translateY(${-paralaxOffset}px)`
                }}
              />
              <div className="project-text">
                <h2>{project.title}</h2>
                <p>{project.description}</p>
                <a 
                  href={project.link} 
                  target="_blank" 
                  rel="noreferrer"
                  className="project-link"
                >
                  Otvoriť projekt
                </a>
              </div>
            </div>
          );
        })}
      </section>
      <section id="reviews" className="reviews-wrapper">
        <Reviews />
      </section>
    </main>
  );
}

export default Home;