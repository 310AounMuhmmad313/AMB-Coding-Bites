import React from "react";
import { Container, Row, Col } from "react-bootstrap";
import { Link } from "react-router-dom";
import Reveal from "../../components/ui/Reveal";
import { offers } from "../../content/siteContent";
import Ads1 from "../../assets/menu/ads-1.jpg";
import Ads2 from "../../assets/menu/ads-2.jpg";
import G1 from "../../assets/about/about-1.jpg";
import G2 from "../../assets/menu/burger-11.jpg";
import G3 from "../../assets/menu/burger-15.jpg";
import G4 from "../../assets/menu/burger-18.jpg";
import G5 from "../../assets/menu/burger-13.jpg";
import G6 from "../../assets/menu/burger-16.jpg";
import G7 from "../../assets/menu/burger-17.jpg";

const adImages = { "ads-1": Ads1, "ads-2": Ads2 };
const gallery = [
  { src: G1, alt: "Three gourmet burgers lined up on a counter" },
  { src: G2, alt: "A burger with fresh toppings" },
  { src: G3, alt: "A loaded burger with fries" },
  { src: G4, alt: "A burger on a plate" },
  { src: G5, alt: "A tall stacked burger" },
  { src: G6, alt: "A burger with melted cheese" },
  { src: G7, alt: "A burger ready to serve" },
];

// Promotional banners + food gallery.
function Section5() {
  return (
    <>
      <section className="offers_section section_pad">
        <Container>
          <Reveal className="section_head">
            <h2>Offers worth ordering for</h2>
            <p>Check back often. Our kitchen adds new treats and specials.</p>
          </Reveal>
          <Row className="gy-4">
            {offers.map((o, i) => (
              <Col md={i === 0 ? 5 : 7} key={o.title}>
                <Reveal delay={i * 100} className="offer">
                  <img src={adImages[o.image]} alt="" loading="lazy" />
                  <div className="offer_text">
                    <h3>{o.title}</h3>
                    <p>{o.text}</p>
                    <Link to="/menu" className="btn-gold btn-sm-pill">
                      Order now
                    </Link>
                  </div>
                </Reveal>
              </Col>
            ))}
          </Row>
        </Container>
      </section>

      <section className="gallery_section section_pad">
        <Container>
          <Reveal className="section_head">
            <h2>A closer look</h2>
            <p>The kind of plate that makes the table go quiet.</p>
          </Reveal>
          <Reveal className="gallery">
            {gallery.map((g, i) => (
              <figure key={g.src} className={`g g${i + 1}`}>
                <img src={g.src} alt={g.alt} loading="lazy" />
              </figure>
            ))}
          </Reveal>
        </Container>
      </section>
    </>
  );
}

export default Section5;
