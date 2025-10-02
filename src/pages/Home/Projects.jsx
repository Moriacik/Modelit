import { useEffect, useState } from "react";

function Projects() {
  const [projects, setProjects] = useState([]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    fetch("http://localhost/app/src/php/projects.php")
      .then((res) => res.json())
      .then((data) => setProjects(data))
      .catch((err) => console.error("Chyba pri načítaní:", err));
  }, []);

  // autoplay každých 5 sekúnd
  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev < projects.length - 1 ? prev + 1 : 0));
    }, 5000);
    return () => clearInterval(interval);
  }, [projects]);

  return (
    <div className="projects-container">
      {projects.length > 0 && (
        <div className="slide">
          <img
            src={projects[index].image}
            alt={projects[index].title}
            className="slide-image"
          />
          <div className="slide-content">
            <h1>{projects[index].title}</h1>
            <p>{projects[index].description}</p>
            <a href={projects[index].link} target="_blank" rel="noreferrer">
              Otvoriť projekt
            </a>
          </div>

          {/* Indikátory */}
          <div className="dots">
            {projects.map((_, i) => (
              <span
                key={i}
                className={`dot ${i === index ? "active" : ""}`}
                onClick={() => setIndex(i)}
              ></span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default Projects;