import React, { useState, useEffect } from "react";
import { Container, Row, Col } from "react-bootstrap";
import { Link } from "react-router-dom";
import Logo from "../../assets/logo/logo.png";
import { brand, contact, credit } from "../../content/siteContent";

function Footer() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setIsVisible(window.scrollY > 400);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <footer className="site_footer">
        <Container>
          <Row className="gy-5">
            <Col lg={4}>
              <Link to="/" className="footer_brand">
                <img src={Logo} alt="" width="56" height="56" />
                <span>{brand.name}</span>
              </Link>
              <p className="footer_tag">
                {brand.tagline} Order online and follow your meal to your door.
              </p>
            </Col>

            <Col sm={6} lg={3}>
              <h2 className="footer_h">Visit us</h2>
              <address>
                {contact.address.map((line) => (
                  <span key={line}>{line}</span>
                ))}
              </address>
            </Col>

            <Col sm={6} lg={3}>
              <h2 className="footer_h">Opening hours</h2>
              <dl className="footer_hours">
                {contact.hours.map((h) => (
                  <div key={h.days}>
                    <dt>{h.days}</dt>
                    <dd>{h.time}</dd>
                  </div>
                ))}
              </dl>
            </Col>

            <Col lg={2}>
              <h2 className="footer_h">Order now</h2>
              <a className="footer_phone" href={`tel:${contact.phoneTel}`}>
                {contact.phoneDisplay}
              </a>
              <a
                className="footer_wa"
                href={contact.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <i className="bi bi-whatsapp" aria-hidden="true" /> WhatsApp
              </a>
            </Col>
          </Row>

          <div className="footer_bottom">
            <div className="footer_credit">
              <small>
                © 2026 {brand.name}. Built by{" "}
                <a href={credit.site} target="_blank" rel="noopener noreferrer">
                  {credit.name}
                </a>
              </small>
              <ul className="footer_social list-unstyled">
                {credit.links.map((l) => (
                  <li key={l.label}>
                    <a
                      href={l.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`${credit.name} on ${l.label}`}
                    >
                      <i className={`bi ${l.icon}`} aria-hidden="true" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <nav aria-label="Footer">
              <Link to="/">Home</Link>
              <Link to="/menu">Our Menu</Link>
              <Link to="/about">About Us</Link>
              <Link to="/contact">Contact Us</Link>
              <Link to="/admin">Admin</Link>
            </nav>
          </div>
        </Container>
      </footer>

      <button
        type="button"
        className={`scroll_top ${isVisible ? "show" : ""}`}
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        aria-label="Back to top"
        tabIndex={isVisible ? 0 : -1}
      >
        <i className="bi bi-arrow-up" aria-hidden="true" />
      </button>
    </>
  );
}

export default Footer;
