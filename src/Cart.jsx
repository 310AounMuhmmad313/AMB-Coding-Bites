import React from "react";
import { Container, Row, Col } from "react-bootstrap";
import { Link } from "react-router-dom";
import Layout from "./components/layouts/layouts";
import PageBanner from "./components/ui/PageBanner";
import { useCart } from "./CartContext";
import "./Shop.css";

export default function Cart() {
  const { cart, increase, decrease, remove, total, count } = useCart();

  return (
    <Layout>
      <PageBanner
        title="Your cart"
        text={
          cart.length
            ? `${count} ${count === 1 ? "item" : "items"} ready to order.`
            : "Nothing here yet."
        }
      />
      <section className="page_body">
        <Container>
          {!cart.length ? (
            <div className="empty_state">
              <i className="bi bi-bag" aria-hidden="true" />
              <h2>Your cart is empty</h2>
              <p>Browse the menu and add a dish to get started.</p>
              <Link to="/menu" className="btn-brand">
                Browse the menu
              </Link>
            </div>
          ) : (
            <Row className="gy-4">
              <Col lg={8}>
                <ul className="cart_list">
                  {cart.map((item) => (
                    <li key={item.id} className="cart_row">
                      <img src={item.image} alt="" className="cart_img" />
                      <div className="cart_info">
                        <h2>{item.title}</h2>
                        <span className="cart_each">
                          ${Number(item.price).toFixed(2)} each
                        </span>
                      </div>
                      <div
                        className="qty"
                        role="group"
                        aria-label={`Quantity for ${item.title}`}
                      >
                        <button
                          type="button"
                          onClick={() => decrease(item.id)}
                          aria-label={`Decrease quantity of ${item.title}`}
                        >
                          <i className="bi bi-dash-lg" aria-hidden="true" />
                        </button>
                        <output aria-live="polite">{item.quantity}</output>
                        <button
                          type="button"
                          onClick={() => increase(item.id)}
                          aria-label={`Increase quantity of ${item.title}`}
                        >
                          <i className="bi bi-plus-lg" aria-hidden="true" />
                        </button>
                      </div>
                      <strong className="cart_line">
                        ${(Number(item.price) * item.quantity).toFixed(2)}
                      </strong>
                      <button
                        type="button"
                        className="cart_remove"
                        onClick={() => remove(item.id)}
                        aria-label={`Remove ${item.title} from cart`}
                      >
                        <i className="bi bi-trash3" aria-hidden="true" />
                      </button>
                    </li>
                  ))}
                </ul>
              </Col>
              <Col lg={4}>
                <aside className="summary">
                  <h2>Order summary</h2>
                  <dl>
                    <div>
                      <dt>Items</dt>
                      <dd>{count}</dd>
                    </div>
                    <div className="summary_total">
                      <dt>Total</dt>
                      <dd>${total.toFixed(2)}</dd>
                    </div>
                  </dl>
                  <Link to="/checkout" className="btn-brand w-100">
                    Checkout
                  </Link>
                  <Link to="/menu" className="summary_more">
                    Add more dishes
                  </Link>
                </aside>
              </Col>
            </Row>
          )}
        </Container>
      </section>
    </Layout>
  );
}
