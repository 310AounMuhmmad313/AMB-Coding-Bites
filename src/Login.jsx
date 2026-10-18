import React, { useState } from "react";
import { Alert, Form, Button, Tabs, Tab } from "react-bootstrap";
import { useLocation, useNavigate } from "react-router-dom";
import Layout from "./components/layouts/layouts";
import { supabase } from "./supabase";
import Photo from "./assets/menu/burger-12.jpg";
import { brand } from "./content/siteContent";
import "./Shop.css";

export default function Login() {
  const nav = useNavigate();
  const loc = useLocation();
  const redirect = new URLSearchParams(loc.search).get("redirect") || "/";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const login = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) setError(error.message);
    else nav(redirect);
    setLoading(false);
  };
  const signup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });
    if (error) setError(error.message);
    else if (data.session) nav(redirect);
    else
      setMessage(
        "Account created. Check your email if confirmation is enabled.",
      );
    setLoading(false);
  };
  return (
    <Layout>
      <section className="auth_page">
        <div
          className="auth_photo"
          style={{ backgroundImage: `url(${Photo})` }}
        >
          <div className="auth_photo_text">
            <h2>{brand.tagline}</h2>
            <p>
              Sign in to order, save favourites and follow your meal to your
              door.
            </p>
          </div>
        </div>
        <div className="auth_panel">
          <div className="auth_card">
            <h1>Welcome</h1>
            <p className="auth_sub">
              Log in or create an account to place your order.
            </p>
            {error && (
              <Alert variant="danger" role="alert">
                {error}
              </Alert>
            )}
            {message && (
              <Alert variant="success" role="status">
                {message}
              </Alert>
            )}
            <Tabs defaultActiveKey="login" className="auth_tabs mb-4" fill>
              <Tab eventKey="login" title="Login">
                <Form onSubmit={login}>
                  <Form.Group className="mb-3" controlId="li-email">
                    <Form.Label>Email</Form.Label>
                    <Form.Control
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </Form.Group>
                  <Form.Group className="mb-4" controlId="li-pass">
                    <Form.Label>Password</Form.Label>
                    <Form.Control
                      type="password"
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </Form.Group>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="btn-brand border-0 w-100"
                  >
                    {loading ? "Please wait…" : "Login"}
                  </Button>
                </Form>
              </Tab>
              <Tab eventKey="signup" title="Create account">
                <Form onSubmit={signup}>
                  <Form.Group className="mb-3" controlId="su-name">
                    <Form.Label>Full name</Form.Label>
                    <Form.Control
                      autoComplete="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </Form.Group>
                  <Form.Group className="mb-3" controlId="su-email">
                    <Form.Label>Email</Form.Label>
                    <Form.Control
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </Form.Group>
                  <Form.Group className="mb-4" controlId="su-pass">
                    <Form.Label>Password</Form.Label>
                    <Form.Control
                      type="password"
                      minLength={6}
                      autoComplete="new-password"
                      placeholder="6+ characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </Form.Group>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="btn-brand border-0 w-100"
                  >
                    {loading ? "Creating…" : "Create account"}
                  </Button>
                </Form>
              </Tab>
            </Tabs>
          </div>
        </div>
      </section>
    </Layout>
  );
}
