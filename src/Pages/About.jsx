import React from "react";
import { Col, Container, Row } from "react-bootstrap";
import { Link } from "react-router-dom";
import Layout from "../components/layouts/layouts";
import Reveal from "../components/ui/Reveal";
import { brand, contact } from "../content/siteContent";
import HeroImg from "../assets/about/about-1.jpg";
import TableImg from "../assets/menu/burger-12.jpg";
import "./InfoPages.css";

const values = [
  {
    icon: "bi-egg-fried",
    title: "Food worth sharing",
    text: "A varied menu so everyone at the table finds something they love: burgers, pizza, sides and more.",
  },
  {
    icon: "bi-broadcast",
    title: "Clear order updates",
    text: "Follow your order from accepted to delivered, with a live countdown once it leaves the restaurant.",
  },
  {
    icon: "bi-heart",
    title: "Customers first",
    text: "Ordering should be simple, and help should be one tap away when you need it.",
  },
];

const how = [
  {
    title: "Choose your dishes",
    text: "Browse the menu, open any dish for details and add it to your cart.",
  },
  {
    title: "Check out",
    text: "Sign in, confirm your delivery details and place the order.",
  },
  {
    title: "Follow it live",
    text: "Watch your order move through the kitchen to your door, then tell us how it was.",
  },
];

export default function About() {
  return (
    <Layout>
      <div className="info-page about-page">
        <section className="about_hero">
          <img
            src={HeroImg}
            alt="Three gourmet burgers lined up on a counter"
            fetchPriority="high"
          />
          <Container>
            <div className="about_hero_copy">
              <h1>Good food brings everyone together.</h1>
              <p>
                {brand.name} is built around a simple idea: great burgers,
                honest flavour and an ordering experience that feels as good as
                the food. From the first sizzle on the grill to the moment your
                order arrives, we care about every detail.
              </p>
              <div className="info-actions">
                <Link className="btn-gold" to="/menu">
                  Explore our menu
                </Link>
                <Link className="btn-ghost-light" to="/contact">
                  Talk to us
                </Link>
              </div>
            </div>
          </Container>
        </section>

        <section className="section_pad">
          <Container>
            <Reveal className="section_head">
              <h2>A better way to order your favourites</h2>
              <p>
                From browsing the menu to following your order, everything
                should be clear, comfortable and friendly.
              </p>
            </Reveal>
            <Row className="g-4">
              {values.map((v, i) => (
                <Col md={4} key={v.title}>
                  <Reveal delay={i * 90} className="info_value">
                    <i className={`bi ${v.icon}`} aria-hidden="true" />
                    <h3>{v.title}</h3>
                    <p>{v.text}</p>
                  </Reveal>
                </Col>
              ))}
            </Row>
          </Container>
        </section>

        <section className="section_pad about_how">
          <Container>
            <Row className="gy-5 align-items-center">
              <Col lg={5}>
                <Reveal>
                  <h2>How ordering works</h2>
                  <p className="text-secondary mb-4">
                    Three steps from hungry to happy.
                  </p>
                  <ol className="how_list">
                    {how.map((h, i) => (
                      <li key={h.title}>
                        <span className="how_n" aria-hidden="true">
                          {i + 1}
                        </span>
                        <div>
                          <h3>{h.title}</h3>
                          <p>{h.text}</p>
                        </div>
                      </li>
                    ))}
                  </ol>
                </Reveal>
              </Col>
              <Col lg={{ span: 6, offset: 1 }}>
                <Reveal className="about_photo">
                  <img
                    src={TableImg}
                    alt="A stacked bacon cheeseburger on a wooden board"
                    loading="lazy"
                  />
                </Reveal>
              </Col>
            </Row>
          </Container>
        </section>

        <section className="section_pad about_cta">
          <Container>
            <Reveal className="about_cta_inner">
              <div>
                <h2>Find your next favourite meal.</h2>
                <p>
                  We are in {contact.address[0]}, {contact.address[1]}. Browse
                  the menu and add your choices straight to the cart.
                </p>
              </div>
              <Link to="/menu" className="btn-brand">
                Order from the menu
              </Link>
            </Reveal>
          </Container>
        </section>
      </div>
    </Layout>
  );
}
