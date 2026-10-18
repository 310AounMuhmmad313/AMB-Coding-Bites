import React from "react";
import { Container } from "react-bootstrap";
import { Link } from "react-router-dom";
import HeroPhoto from "../../assets/menu/burger-12.jpg";
import { hero } from "../../content/siteContent";
const Section1 = () => (
  <section className="hero" aria-labelledby="hero-title">
    <div className="hero_photo">
      <img
        src={HeroPhoto}
        alt="A stacked bacon cheeseburger on a wooden board"
        fetchPriority="high"
      />
    </div>
    <div
      className="hero_badge"
      aria-label={`${hero.badgeTitle}, only ${hero.badgePrice}`}
    >
      <span>{hero.badgeTitle}</span>
      <strong>{hero.badgePrice}</strong>
    </div>

    <Container className="hero_inner">
      <div className="hero_copy">
        <h1 id="hero-title">
          {hero.headline.map((line, i) => (
            <span className="hl" key={line}>
              <span style={{ "--i": i }}>{line}</span>
            </span>
          ))}
        </h1>
        <p className="hero_text">{hero.text}</p>
        <div className="hero_actions">
          <Link to="/menu" className="btn-gold">
            Order Now
          </Link>
          <a href="#signature" className="btn-ghost-light">
            Explore Menu
          </a>
        </div>
        <p className="hero_note">
          <i className="bi bi-bicycle" aria-hidden="true" /> {hero.deliveryNote}
        </p>
      </div>
    </Container>
  </section>
);

export default Section1;
