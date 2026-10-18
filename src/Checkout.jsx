import React, { useEffect, useState } from "react";
import {
  Container,
  Row,
  Col,
  Form,
  Button,
  Alert,
  Spinner,
} from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import Layout from "./components/layouts/layouts";
import PageBanner from "./components/ui/PageBanner";
import { useCart } from "./CartContext";
import { supabase } from "./supabase";
import "./Shop.css";

const isUuid = (value) =>
  typeof value === "string" &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );

export default function Checkout() {
  const { cart, total, clearCart } = useCart();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [checking, setChecking] = useState(true);
  const [form, setForm] = useState({ name: "", phone: "", address: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setChecking(false);
    });
  }, []);
  useEffect(() => {
    if (session?.user?.user_metadata?.name)
      setForm((f) => ({
        ...f,
        name: f.name || session.user.user_metadata.name,
      }));
  }, [session]);

  if (!cart.length)
    return (
      <Layout>
        <PageBanner title="Checkout" />
        <section className="page_body">
          <Container>
            <div className="empty_state">
              <i className="bi bi-bag" aria-hidden="true" />
              <h2>Your cart is empty</h2>
              <p>Add something from the menu before checking out.</p>
              <Button
                className="btn-brand border-0"
                onClick={() => navigate("/menu")}
              >
                Go to menu
              </Button>
            </div>
          </Container>
        </section>
      </Layout>
    );
  if (checking)
    return (
      <Layout>
        <PageBanner title="Checkout" />
        <section className="page_body">
          <Container className="text-center">
            <Spinner animation="border" role="status">
              <span className="visually-hidden">Loading</span>
            </Spinner>
          </Container>
        </section>
      </Layout>
    );
  if (!session)
    return (
      <Layout>
        <PageBanner title="Checkout" />
        <section className="page_body">
          <Container>
            <div className="empty_state">
              <i className="bi bi-person-lock" aria-hidden="true" />
              <h2>Sign in to place your order</h2>
              <p>
                Please log in or create an account so we can follow your order
                for you.
              </p>
              <Button
                className="btn-brand border-0"
                onClick={() => navigate("/login?redirect=/checkout")}
              >
                Login / Create account
              </Button>
            </div>
          </Container>
        </section>
      </Layout>
    );

  const submitOrder = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        user_id: session.user.id,
        customer_name: form.name,
        phone: form.phone,
        address: form.address,
        total_amount: total,
        status: "pending",
        estimated_minutes: 30,
      })
      .select()
      .single();
    if (orderError) {
      setError(orderError.message);
      setLoading(false);
      return;
    }
    const items = cart.map((item) => ({
      order_id: order.id,
      menu_item_id: isUuid(item.id) ? item.id : null,
      item_name: item.title,
      price: Number(item.price),
      quantity: item.quantity,
    }));
    const { error: itemsError } = await supabase
      .from("order_items")
      .insert(items);
    if (itemsError) {
      await supabase.from("orders").delete().eq("id", order.id);
      setError(itemsError.message);
      setLoading(false);
      return;
    }
    localStorage.setItem("last_order_id", order.id);
    clearCart();
    navigate(`/order/${order.id}`);
  };

  return (
    <Layout>
      <PageBanner
        title="Checkout"
        text="Tell us where to bring your meal. You can follow it live once it is placed."
      />
      <section className="page_body">
        <Container>
          <Row className="gy-4">
            <Col lg={7}>
              <div className="panel">
                <h2>Delivery details</h2>
                {error && (
                  <Alert variant="danger" role="alert">
                    {error}
                  </Alert>
                )}
                <Form onSubmit={submitOrder}>
                  <Form.Group className="mb-3" controlId="co-name">
                    <Form.Label>Full name</Form.Label>
                    <Form.Control
                      required
                      autoComplete="name"
                      value={form.name}
                      onChange={(e) =>
                        setForm({ ...form, name: e.target.value })
                      }
                    />
                  </Form.Group>
                  <Form.Group className="mb-3" controlId="co-phone">
                    <Form.Label>Phone</Form.Label>
                    <Form.Control
                      required
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel"
                      value={form.phone}
                      onChange={(e) =>
                        setForm({ ...form, phone: e.target.value })
                      }
                    />
                  </Form.Group>
                  <Form.Group className="mb-4" controlId="co-address">
                    <Form.Label>Delivery address</Form.Label>
                    <Form.Control
                      required
                      as="textarea"
                      rows={3}
                      autoComplete="street-address"
                      value={form.address}
                      onChange={(e) =>
                        setForm({ ...form, address: e.target.value })
                      }
                    />
                  </Form.Group>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="btn-brand border-0 w-100"
                  >
                    {loading ? (
                      <>
                        <Spinner
                          size="sm"
                          animation="border"
                          aria-hidden="true"
                        />{" "}
                        Placing order…
                      </>
                    ) : (
                      `Place order · $${total.toFixed(2)}`
                    )}
                  </Button>
                </Form>
              </div>
            </Col>
            <Col lg={5}>
              <aside className="summary">
                <h2>Your order</h2>
                <ul className="summary_items">
                  {cart.map((item) => (
                    <li key={item.id}>
                      <img src={item.image} alt="" />
                      <span>
                        {item.title}
                        <small>× {item.quantity}</small>
                      </span>
                      <strong>
                        ${(Number(item.price) * item.quantity).toFixed(2)}
                      </strong>
                    </li>
                  ))}
                </ul>
                <dl>
                  <div className="summary_total">
                    <dt>Total</dt>
                    <dd>${total.toFixed(2)}</dd>
                  </div>
                </dl>
              </aside>
            </Col>
          </Row>
        </Container>
      </section>
    </Layout>
  );
}
