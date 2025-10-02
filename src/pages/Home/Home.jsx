import Projects from './Projects';
import Reviews from './Reviews';
import './Home.css';

function Home() {
  return (
    <main className="home-page">
      <section id="home" className="hero-section">
        <Projects />
      </section>
      <section id="reviews" className="reviews-wrapper">
        <Reviews />
      </section>
    </main>
  );
}

export default Home;