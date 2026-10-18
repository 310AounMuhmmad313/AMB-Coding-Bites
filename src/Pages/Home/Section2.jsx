import React from "react";
import { Container, Row, Col } from "react-bootstrap";
import Reveal from "../../components/ui/Reveal";
import { promises } from "../../content/siteContent";

const icons = ["bi-fire", "bi-patch-check", "bi-bicycle"];

function Section2() {
  return (
    <section className="promise_section section_pad">
      <Container>
        <Row className="gy-5 align-items-center">
          <Col lg={5}>
            <Reveal>
              <h2>Made to be shared, built to be enjoyed.</h2>
              <p className="promise_lead">
                From the first bite to the last fry, we keep the menu simple and
                the details right.
              </p>
            </Reveal>
          </Col>
          <Col lg={{ span: 6, offset: 1 }}>
            <ul className="promise_list">
              {promises.map((p, i) => (
                <Reveal as="li" delay={i * 90} key={p.title}>
                  <i className={`bi ${icons[i]}`} aria-hidden="true" />
                  <div>
                    <h3>{p.title}</h3>
                    <p>{p.text}</p>
                  </div>
                </Reveal>
              ))}
            </ul>
          </Col>
        </Row>
      </Container>
    </section>
  );
}

export default Section2;
