import React from "react";
import { Container } from "react-bootstrap";

export default function PageBanner({ title, text, children }) {
  return (
    <section className="page_banner">
      <Container>
        <h1>{title}</h1>
        {text && <p>{text}</p>}
        {children}
      </Container>
    </section>
  );
}
