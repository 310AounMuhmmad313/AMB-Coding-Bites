import React from "react";
import { Container, Row, Col } from "react-bootstrap";
import { Link } from "react-router-dom";
import Reveal from "../../components/ui/Reveal";
import PromotionImage from "../../assets/promotion/pro.png";
import { story } from "../../content/siteContent";

function Section4() {
  return (
    <section className="story_section section_pad">
      <Container>
        <Row className="align-items-center gy-5">
          <Col lg={6}>
            <Reveal className="story_photo">
              <img
                src={PromotionImage}
                alt="Friends sharing burgers and drinks around a table"
                loading="lazy"
              />
            </Reveal>
          </Col>
          <Col lg={{ span: 5, offset: 1 }}>
            <Reveal>
              <h2>{story.title}</h2>
              <p className="story_text">{story.text}</p>
              <ul className="story_points">
                {story.points.map((p) => (
                  <li key={p}>
                    <i className="bi bi-check2-circle" aria-hidden="true" />
                    {p}
                  </li>
                ))}
              </ul>
              <Link to="/about" className="btn-brand">
                Our story
              </Link>
            </Reveal>
          </Col>
        </Row>
      </Container>
    </section>
  );
}

export default Section4;
