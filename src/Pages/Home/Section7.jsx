import React from "react";
import { Container } from "react-bootstrap";
import { Link } from "react-router-dom";
import Reveal from "../../components/ui/Reveal";
import { contact, delivery } from "../../content/siteContent";

function Section7() {
  return (
    <section className="cta_section" id="contact">
      <Container>
        <Reveal className="cta_inner">
          <p className="cta_kicker">{delivery.kicker}</p>
          <h2>{delivery.title}</h2>
          <p className="cta_text">{delivery.text}</p>
          <div className="cta_actions">
            <Link to="/menu" className="btn-gold">
              Order Now
            </Link>
            <a href={`tel:${contact.phoneTel}`} className="btn-ghost-light">
              <i className="bi bi-telephone" aria-hidden="true" /> Call{" "}
              {contact.phoneDisplay}
            </a>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}

export default Section7;
