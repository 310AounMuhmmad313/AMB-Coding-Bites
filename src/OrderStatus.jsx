import React, { useEffect, useRef, useState } from "react";
import { Container, Row, Col, Spinner, Form, Button, Alert } from "react-bootstrap";
import { Link, useNavigate, useParams } from "react-router-dom";
import Layout from "./components/layouts/layouts";
import PageBanner from "./components/ui/PageBanner";
import { supabase } from "./supabase";
import "./Shop.css";

const labels = {
  pending: "Order received",
  accepted: "Order accepted",
  preparing: "Preparing your order",
  ready: "Order ready",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
  done: "Completed",
  cancelled: "Cancelled",
};

const steps = [
  { key: "pending", title: "Order received", text: "We have your order.", icon: "bi-receipt" },
  { key: "accepted", title: "Accepted", text: "The restaurant confirmed it.", icon: "bi-check2-circle" },
  { key: "preparing", title: "Preparing", text: "Your meal is being made.", icon: "bi-fire" },
  { key: "out_for_delivery", title: "Out for delivery", text: "Your rider is on the way.", icon: "bi-bicycle" },
  { key: "delivered", title: "Delivered", text: "Enjoy your meal.", icon: "bi-bag-check" },
];
const stepIndex = { pending: 0, accepted: 1, preparing: 2, ready: 2, out_for_delivery: 3, delivered: 4, done: 4 };
const orderNo = (id) => `#TB-${String(id || "").replaceAll("-", "").slice(-6).toUpperCase()}`;

export default function OrderStatus() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [items, setItems] = useState([]);
  const [seconds, setSeconds] = useState(0);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(0);
  const [remark, setRemark] = useState("");
  const [sending, setSending] = useState(false);
  const [feedbackError, setFeedbackError] = useState("");
  const [thanks, setThanks] = useState(false);
  const redirectTimer = useRef(null);

  useEffect(() => {
    let channel;

    const load = async () => {
      const { data } = await supabase.from("orders").select("*").eq("id", id).single();
      if (data) {
        setOrder(data);
        setSeconds(Math.max(0, (new Date(data.estimated_end_at || data.created_at).getTime() - Date.now()) / 1000));
      }
      setLoading(false);
      
      const { data: rows } = await supabase.from("order_items").select("*").eq("order_id", id);
      if (rows) setItems(rows);
    };

    load();

    channel = supabase
      .channel(`order-${id}`)
      .on("postgres_changes", {
        event: "UPDATE",
        schema: "public",
        table: "orders",
        filter: `id=eq.${id}`,
      }, (payload) => setOrder(payload.new))
      .subscribe();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [id]);

  useEffect(() => {
    if (!order?.estimated_end_at) return;
    const timer = setInterval(() => {
      setSeconds(Math.max(0, (new Date(order.estimated_end_at).getTime() - Date.now()) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [order?.estimated_end_at]);

  useEffect(() => () => clearTimeout(redirectTimer.current), []);

  if (loading) {
    return (
      <Layout>
        <PageBanner title="Order tracking" />
        <section className="page_body text-center"><Spinner animation="border" role="status"><span className="visually-hidden">Loading</span></Spinner></section>
      </Layout>
    );
  }

  if (!order) {
    return (
      <Layout>
        <PageBanner title="Order tracking" />
        <section className="page_body">
          <Container>
            <div className="empty_state">
              <i className="bi bi-question-circle" aria-hidden="true" />
              <h2>Order not found</h2>
              <p>Check the link, or head back to the menu to place a new order.</p>
              <Link to="/menu" className="btn-brand">Browse the menu</Link>
            </div>
          </Container>
        </section>
      </Layout>
    );
  }

  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const cancelled = order.status === "cancelled";
  const finished = ["delivered", "done"].includes(order.status);
  const current = stepIndex[order.status] ?? 0;
  const showTimer = !cancelled && !finished && Boolean(order.estimated_end_at);
  const progress = finished ? 100 : cancelled ? 0 : (current / (steps.length - 1)) * 100;

  const submitFeedback = async (e) => {
    e.preventDefault();
    if (!rating) { setFeedbackError("Please choose a star rating."); return; }
    setSending(true);
    setFeedbackError("");
    const { error } = await supabase.from("orders").update({ rating, remark: remark.trim() }).eq("id", order.id);
    setSending(false);
    if (error) { setFeedbackError(error.message); return; }
    setOrder({ ...order, rating, remark: remark.trim() });
    setThanks(true);
    redirectTimer.current = setTimeout(() => navigate("/"), 2200);
  };

  return (
    <Layout>
      <PageBanner title="Order tracking" text={`Order ${orderNo(order.id)} · placed for ${order.customer_name || "you"}`} />
      <section className="page_body">
        <Container>
          <Row className="gy-4">
            <Col lg={7}>
              <div className="panel track">
                <div className="track_head" role="status">
                  <h2>{labels[order.status] || order.status}</h2>
                  {cancelled && <p className="track_cancel">This order was cancelled. Please contact us if you have questions.</p>}
                </div>

                {showTimer && (
                  <div className="countdown" aria-live="off">
                    <span>Arriving in</span>
                    <strong>{mins}:{String(secs).padStart(2, "0")}</strong>
                    <small>{seconds === 0 ? "Your rider should be with you any moment." : "minutes"}</small>
                  </div>
                )}
                {!showTimer && !cancelled && !finished && (
                  <p className="track_wait"><i className="bi bi-stopwatch" aria-hidden="true" /> Estimated delivery is about {order.estimated_minutes || 30} minutes. The countdown begins when your order leaves the restaurant.</p>
                )}

                {!cancelled && (
                  <ol className="timeline" style={{ "--progress-n": progress / 100 }}>
                    {steps.map((s, i) => {
                      const state = finished || i < current ? "done" : i === current ? "current" : "todo";
                      return (
                        <li key={s.key} className={state} aria-current={state === "current" ? "step" : undefined}>
                          <span className="tl_dot"><i className={`bi ${state === "done" ? "bi-check-lg" : s.icon}`} aria-hidden="true" /></span>
                          <div><strong>{s.title}</strong><small>{s.text}</small></div>
                        </li>
                      );
                    })}
                  </ol>
                )}
                <p className="track_note">This page updates automatically when the restaurant changes your order.</p>
              </div>
            </Col>

            <Col lg={5}>
              <aside className="summary">
                <h2>Order details</h2>
                {items.length > 0 && (
                  <ul className="summary_items">
                    {items.map((it) => (
                      <li key={it.id}><span>{it.item_name}<small>× {it.quantity}</small></span><strong>${(Number(it.price) * Number(it.quantity)).toFixed(2)}</strong></li>
                    ))}
                  </ul>
                )}
                <dl>
                  <div><dt>Deliver to</dt><dd>{order.address}</dd></div>
                  <div><dt>Phone</dt><dd>{order.phone}</dd></div>
                  <div className="summary_total"><dt>Total</dt><dd>${Number(order.total_amount).toFixed(2)}</dd></div>
                </dl>
              </aside>
            </Col>
          </Row>

          {finished && (
            <div className="panel feedback">
              {order.rating && !thanks ? (
                <>
                  <h2>Thanks for your feedback</h2>
                  <p className="mb-0">You rated this order {Number(order.rating)} out of 5.</p>
                </>
              ) : thanks ? (
                <>
                  <h2>Thank you!</h2>
                  <p className="mb-0" role="status">Your feedback has been sent. Taking you back to the homepage…</p>
                </>
              ) : (
                <Form onSubmit={submitFeedback}>
                  <h2>How was your meal?</h2>
                  <p className="text-muted">Your rating helps us keep every order right.</p>
                  {feedbackError && <Alert variant="danger" role="alert">{feedbackError}</Alert>}
                  <fieldset className="stars">
                    <legend className="visually-hidden">Rating</legend>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <label key={n} className={n <= rating ? "on" : ""}>
                        <input type="radio" name="rating" value={n} checked={rating === n} onChange={() => setRating(n)} />
                        <i className={`bi ${n <= rating ? "bi-star-fill" : "bi-star"}`} aria-hidden="true" />
                        <span className="visually-hidden">{n} {n === 1 ? "star" : "stars"}</span>
                      </label>
                    ))}
                  </fieldset>
                  <Form.Group className="mb-3" controlId="fb-remark">
                    <Form.Label>Anything to add? (optional)</Form.Label>
                    <Form.Control as="textarea" rows={3} value={remark} onChange={(e) => setRemark(e.target.value)} />
                  </Form.Group>
                  <Button type="submit" disabled={sending} className="btn-brand border-0">{sending ? "Sending…" : "Send feedback"}</Button>
                </Form>
              )}
            </div>
          )}
        </Container>
      </section>
    </Layout>
  );
}
