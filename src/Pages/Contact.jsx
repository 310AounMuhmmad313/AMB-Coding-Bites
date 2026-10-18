import React, { useState, useRef } from "react";
import { Col, Container, Form, Row, Alert } from "react-bootstrap";
import emailjs from "@emailjs/browser";
import Layout from "../components/layouts/layouts";
import PageBanner from "../components/ui/PageBanner";
import Reveal from "../components/ui/Reveal";
import { contact } from "../content/siteContent";
import "./InfoPages.css";

const faqs = [
  {
    q: "How do I track my order?",
    a: "After you place an order you land on its tracking page. Use the Track Order link in the menu bar to come back to it at any time.",
  },
  {
    q: "Can I change or cancel an order?",
    a: "Contact us as soon as possible with your order number. We will do our best if the kitchen has not started preparing it.",
  },
  {
    q: "Allergies or special requests?",
    a: "Please call or message us before ordering so we can tell you what is possible with the current menu.",
  },
  {
    q: "When can I order?",
    a: "See our opening hours on this page. You can browse the menu at any time.",
  },
];

export default function Contact() {
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const formRef = useRef();

  const handleSubmit = (event) => {
    event.preventDefault();
    setLoading(true);

    const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID; 
    const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

    emailjs
      .sendForm(serviceId, templateId, formRef.current, {
        publicKey: publicKey,
      })
      .then(
        () => {
          setSent(true);
          setLoading(false);
          event.target.reset();
          setTimeout(() => setSent(false), 5000);
        },
        (error) => {
          console.error("FAILED...", error.text);
          setLoading(false);
          alert("Message send nahi ho saka. Koshish karein ke keys bilkul theek hon.");
        }
      );
  };

  
  const mapUrl = "https://maps.app.goo.gl/Rp4GQ2mSRPd26shM8";

  return (
    <Layout>
      <div className="info-page contact-page">
        <PageBanner
          title="Let’s talk about your order."
          text="Questions about the menu, an order or anything else? Reach us the way that suits you."
        />

        <section className="page_body">
          <Container>
            <Row className="gy-5">
              <Col lg={5}>
                <Reveal>
                  <ul className="contact_list">
                    <li>
                      <i className="bi bi-telephone" aria-hidden="true" />
                      <div>
                        <strong>Call us</strong>
                        <a href={`tel:${contact.phoneTel}`}>
                          {contact.phoneDisplay}
                        </a>
                      </div>
                    </li>
                    <li>
                      <i className="bi bi-whatsapp" aria-hidden="true" />
                      <div>
                        <strong>WhatsApp</strong>
                        <a
                          href={contact.whatsappUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Message us
                        </a>
                      </div>
                    </li>
                    <li>
                      <i className="bi bi-envelope" aria-hidden="true" />
                      <div>
                        <strong>Email</strong>
                        <a href={`mailto:${contact.email}`}>{contact.email}</a>
                      </div>
                    </li>
                    <li>
                      <i className="bi bi-geo-alt" aria-hidden="true" />
                      <div>
                        <strong>Visit us</strong>
                        <span>{contact.address.join(", ")}</span>
                        <a
                          href={mapUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Open in Maps
                        </a>
                      </div>
                    </li>
                    <li>
                      <i className="bi bi-clock" aria-hidden="true" />
                      <div>
                        <strong>Opening hours</strong>
                        {contact.hours.map((h) => (
                          <span key={h.days}>
                            {h.days}: {h.time}
                          </span>
                        ))}
                      </div>
                    </li>
                  </ul>
                </Reveal>
              </Col>

              <Col lg={7}>
                <Reveal delay={100} className="panel">
                  <h2>Send a message</h2>
                  {sent && (
                    <Alert variant="success" role="status">
                      Thanks! Your message has been received. We’ll reply soon.
                    </Alert>
                  )}
                  <Form ref={formRef} onSubmit={handleSubmit}>
                    <Row className="g-3">
                      <Col sm={6}>
                        <Form.Group controlId="ct-name">
                          <Form.Label>Your name</Form.Label>
                          <Form.Control
                            name="user_name"
                            type="text"
                            autoComplete="name"
                            required
                          />
                        </Form.Group>
                      </Col>
                      <Col sm={6}>
                        <Form.Group controlId="ct-email">
                          <Form.Label>Email address</Form.Label>
                          <Form.Control
                            name="user_email"
                            type="email"
                            autoComplete="email"
                            placeholder="you@example.com"
                            required
                          />
                        </Form.Group>
                      </Col>
                      <Col xs={12}>
                        <Form.Group controlId="ct-phone">
                          <Form.Label>Phone (optional)</Form.Label>
                          <Form.Control
                            name="user_phone"
                            type="tel"
                            autoComplete="tel"
                          />
                        </Form.Group>
                      </Col>
                      <Col xs={12}>
                        <Form.Group controlId="ct-subject">
                          <Form.Label>Subject</Form.Label>
                          <Form.Control
                            name="user_subject"
                            type="text"
                            placeholder="What can we help with?"
                            required
                          />
                        </Form.Group>
                      </Col>
                      <Col xs={12}>
                        <Form.Group controlId="ct-message">
                          <Form.Label>Message</Form.Label>
                          <Form.Control
                            name="message"
                            as="textarea"
                            rows={5}
                            placeholder="Include your order number if relevant."
                            required
                          />
                        </Form.Group>
                      </Col>
                      <Col xs={12}>
                        <button className="btn-brand w-100" type="submit" disabled={loading}>
                          {loading ? "Sending..." : "Send message"}
                        </button>
                      </Col>
                    </Row>
                  </Form>
                </Reveal>
              </Col>
            </Row>
          </Container>
        </section>

        <section className="section_pad faq_section">
          <Container>
            <Reveal className="section_head">
              <h2>Quick answers</h2>
              <p>Before you message us, these might help.</p>
            </Reveal>
            <Row className="g-4">
              {faqs.map((f, i) => (
                <Col md={6} key={f.q}>
                  <Reveal delay={i * 70} as="article" className="faq">
                    <h3>{f.q}</h3>
                    <p>{f.a}</p>
                  </Reveal>
                </Col>
              ))}
            </Row>
          </Container>
        </section>
      </div>
    </Layout>
  );
}
