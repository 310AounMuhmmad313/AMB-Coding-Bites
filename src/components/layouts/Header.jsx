import React, { useEffect, useState } from "react";
import { Container, Nav, Navbar } from "react-bootstrap";
import { Link, NavLink, useLocation } from "react-router-dom";
import Logo from "../../assets/logo/logo.png";
import { useCart } from "../../CartContext";
import { supabase } from "../../supabase";
import { brand } from "../../content/siteContent";
import "./HeaderStyle.css";

const Header = () => {
  const [scrolled, setScrolled] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [user, setUser] = useState(null);
  const { count } = useCart();
  const location = useLocation();
  const isHome = location.pathname === "/";
  const lastOrderId = localStorage.getItem("last_order_id");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    supabase.auth
      .getSession()
      .then(({ data }) => setUser(data.session?.user || null));
    const { data } = supabase.auth.onAuthStateChange((_event, next) =>
      setUser(next?.user || null),
    );
    return () => data.subscription.unsubscribe();
  }, []);

  const firstName = (user?.user_metadata?.name || user?.email || "").split(
    /[ @]/,
  )[0];
  const solid = scrolled || expanded || !isHome;

  return (
    <header className={`site_header ${solid ? "is_solid" : "on_hero"}`}>
      <a href="#main" className="skip_link">
        Skip to content
      </a>
      <Navbar
        expand="lg"
        expanded={expanded}
        onToggle={setExpanded}
        collapseOnSelect
        variant="dark"
      >
        <Container>
          <Navbar.Brand as={Link} to="/" className="brand">
            <img src={Logo} alt="" width="100" height="90" />
            <span>{brand.name}</span>
          </Navbar.Brand>
          <Navbar.Toggle
            aria-controls="main-nav"
            aria-label="Toggle navigation"
          />
          <Navbar.Collapse id="main-nav">
            <Nav className="ms-auto align-items-lg-center">
              <Nav.Link as={NavLink} to="/" end>
                Home
              </Nav.Link>
              <Nav.Link as={NavLink} to="/menu">
                Our Menu
              </Nav.Link>
              <Nav.Link as={NavLink} to="/about">
                About Us
              </Nav.Link>
              <Nav.Link as={NavLink} to="/contact">
                Contact Us
              </Nav.Link>
              {lastOrderId && (
                <Nav.Link as={NavLink} to={`/order/${lastOrderId}`}>
                  Track Order
                </Nav.Link>
              )}
              {user ? (
                <button
                  type="button"
                  className="nav_account"
                  onClick={() => supabase.auth.signOut()}
                >
                  <i className="bi bi-person-circle" aria-hidden="true" />{" "}
                  {firstName} <span>Sign out</span>
                </button>
              ) : (
                <Nav.Link as={NavLink} to="/login">
                  Sign in
                </Nav.Link>
              )}
              <Nav.Link
                as={NavLink}
                to="/cart"
                className="cart_link"
                aria-label={`Cart, ${count} items`}
              >
                <i className="bi bi-bag fs-5" aria-hidden="true" />
                <em
                  key={count}
                  className={`cart_count ${count ? "has_items" : ""}`}
                >
                  {count}
                </em>
              </Nav.Link>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>
    </header>
  );
};

export default Header;
