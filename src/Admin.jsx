import React, { useEffect, useState } from "react";
import {
  Row,
  Col,
  Form,
  Button,
  Card,
  Alert,
  Table,
  Badge,
  Modal,
} from "react-bootstrap";
import { supabase } from "./supabase";
import logo from "./assets/logo/logo.png";
import "./Admin.css";

const ADMIN_EMAIL = "admin@tastburger.com";

const emptyMenu = {
  id: null,
  name: "",
  description: "",
  price: "",
  rating: 5,
  image_url: "",
  category: "Burgers",
  is_available: true,
  show_on_home: true,
  show_on_menu: true,
  home_order: 0,
  menu_order: 0,
  card_style: "default",
};

const statusOptions = [
  "pending",
  "accepted",
  "preparing",
  "out_for_delivery",
  "delivered",
  "done",
  "cancelled",
];
const nextStep = {
  pending: ["accepted", "Accept order"],
  accepted: ["preparing", "Start preparing"],
  preparing: ["out_for_delivery", "Send out for delivery"],
  out_for_delivery: ["delivered", "Mark as delivered"],
  delivered: ["done", "Complete order"],
};
const statusLabel = (s) =>
  s.replaceAll("_", " ").replace(/^./, (c) => c.toUpperCase());
const orderNo = (id) =>
  `#TB-${String(id || "")
    .replaceAll("-", "")
    .slice(-6)
    .toUpperCase()}`;
const formatDate = (value) =>
  value ? new Date(value).toLocaleDateString("en-GB") : "—";
const formatTime = (value) =>
  value
    ? new Date(value).toLocaleTimeString("en-PK", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

export default function Admin() {
  const [session, setSession] = useState(null);
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [orders, setOrders] = useState([]);
  const [history, setHistory] = useState([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [selectedHistoryOrder, setSelectedHistoryOrder] = useState(null);
  const [menu, setMenu] = useState([]);
  const [form, setForm] = useState(emptyMenu);
  const [message, setMessage] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_event, next) =>
      setSession(next),
    );
    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) {
      setIsAdmin(false);
      return;
    }
    let channel;
    const setup = async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", session.user.id)
        .maybeSingle();
      if (error) {
        setLoginError(`Admin profile check failed: ${error.message}`);
        setIsAdmin(false);
        return;
      }
      if (data?.role !== "admin") {
        setLoginError("This account is not registered as an admin.");
        setIsAdmin(false);
        await supabase.auth.signOut();
        return;
      }
      setIsAdmin(true);
      loadOrders();
      loadHistory();
      loadMenu();
      channel = supabase
        .channel("admin-orders")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "orders" },
          () => {
            loadOrders();
            loadHistory();
          },
        )
        .subscribe();
    };
    setup();
    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [session]);

  const login = async (e) => {
    e.preventDefault();
    setLoginError("");
    const { error } = await supabase.auth.signInWithPassword({
      email: ADMIN_EMAIL,
      password,
    });
    if (error) setLoginError(error.message);
  };

  const logout = () => supabase.auth.signOut();

  const loadOrders = async () => {
    const { data, error } = await supabase
      .from("orders")
      .select("*, order_items(*)")
      .neq("status", "done")
      .order("created_at", { ascending: false });
    if (!error) setOrders(data || []);
  };

  const loadHistory = async () => {
    const { data, error } = await supabase
      .from("orders")
      .select("*, order_items(*)")
      .eq("status", "done")
      .order("done_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false });
    if (!error) setHistory(data || []);
  };

  const loadMenu = async () => {
    const { data } = await supabase
      .from("menu_items")
      .select("*")
      .order("home_order", { ascending: true })
      .order("menu_order", { ascending: true })
      .order("created_at", { ascending: true });
    setMenu(data || []);
  };

  const updateOrder = async (
    order,
    status,
    minutes = order.estimated_minutes,
  ) => {
    const selectedMinutes = Number(minutes) || 30;
    const patch = { status, estimated_minutes: selectedMinutes };
    if (status === "out_for_delivery")
      patch.estimated_end_at = new Date(
        Date.now() + selectedMinutes * 60000,
      ).toISOString();
    if (["delivered", "cancelled"].includes(status))
      patch.estimated_end_at = null;
    if (status === "done") {
      patch.estimated_end_at = null;
      patch.done_at = new Date().toISOString();
    }
    if (status !== "done" && order.status === "done") patch.done_at = null;
    const { error } = await supabase
      .from("orders")
      .update(patch)
      .eq("id", order.id);
    if (error) setMessage(error.message);
    else {
      setMessage(`Order ${orderNo(order.id)} updated.`);
      loadOrders();
      loadHistory();
    }
  };

  const deleteOrder = async (id) => {
    if (!window.confirm("Delete this order?")) return;
    const { error } = await supabase.from("orders").delete().eq("id", id);
    if (error) setMessage(error.message);
    else {
      setMessage("Order deleted.");
      loadOrders();
      loadHistory();
    }
  };

  const updateForm = (key, value) =>
    setForm((old) => ({ ...old, [key]: value }));

  const saveMenu = async (e) => {
    e.preventDefault();
    setMessage("");
    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      price: Number(form.price),
      rating: Number(form.rating),
      image_url: form.image_url.trim(),
      category: form.category.trim() || "Burgers",
      is_available: Boolean(form.is_available),
      show_on_home: Boolean(form.show_on_home),
      show_on_menu: Boolean(form.show_on_menu),
      home_order: Number(form.home_order) || 0,
      menu_order: Number(form.menu_order) || 0,
      card_style: form.card_style,
    };
    const result = form.id
      ? await supabase.from("menu_items").update(payload).eq("id", form.id)
      : await supabase.from("menu_items").insert(payload);
    if (result.error) {
      setMessage(result.error.message);
      return;
    }
    setMessage(
      form.id
        ? "Menu item updated successfully."
        : "Menu item added successfully.",
    );
    setForm(emptyMenu);
    loadMenu();
  };

  const editMenu = (item) => {
    setForm({
      id: item.id,
      name: item.name || "",
      description: item.description || "",
      price: item.price || "",
      rating: item.rating ?? 5,
      image_url: item.image_url || "",
      category: item.category || "Burgers",
      is_available: item.is_available ?? true,
      show_on_home: item.show_on_home ?? true,
      show_on_menu: item.show_on_menu ?? true,
      home_order: item.home_order ?? 0,
      menu_order: item.menu_order ?? 0,
      card_style: item.card_style || "default",
    });
    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
  };

  const deleteMenu = async (id) => {
    if (!window.confirm("Delete this menu item?")) return;
    const { error } = await supabase.from("menu_items").delete().eq("id", id);
    if (error) setMessage(error.message);
    else {
      setMessage("Menu item deleted.");
      loadMenu();
    }
  };

  if (!session || !isAdmin) {
    return (
      <div className="admin_page">
        <div className="admin_login_shell">
          <div className="admin_brand">
            <img src={logo} alt="TastBurger" />
            <span>ADMIN PANEL</span>
          </div>
          <Card className="admin_login_card">
            <h2>Admin Login</h2>
            {loginError && <Alert variant="danger">{loginError}</Alert>}
            <Form onSubmit={login}>
              <Form.Label>Admin Email</Form.Label>
              <Form.Control
                className="mb-3"
                type="email"
                value={ADMIN_EMAIL}
                readOnly
              />
              <Form.Label>Password</Form.Label>
              <Form.Control
                className="mb-3"
                type="password"
                placeholder="Enter admin password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <Button type="submit" className="btn-brand border-0 w-100">
                Login
              </Button>
            </Form>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="admin_page">
      <header className="admin_header">
        <div className="admin_header_inner">
          <div className="admin_brand admin_brand_header">
            <img src={logo} alt="TastBurger" />
            <div>
              <strong>AMB Coding Bite</strong>
              <small>ADMIN PANEL</small>
            </div>
          </div>
          <div className="admin_header_actions">
            <Button
              className="admin_history_btn"
              onClick={() => setHistoryOpen(true)}
            >
              Order History{" "}
              <Badge bg="light" text="dark">
                {history.length}
              </Badge>
            </Button>
            <Button variant="outline-danger" onClick={logout}>
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="admin_content">
        <div className="admin_title_row">
          <div>
            <h2>Admin Dashboard</h2>
            <p>Manage orders and control your menu.</p>
          </div>
        </div>
        <div className="admin_stats">
          <div>
            <strong>{orders.length}</strong>
            <span>Active orders</span>
          </div>
          <div
            className={
              orders.some((o) => o.status === "pending") ? "alert_stat" : ""
            }
          >
            <strong>
              {orders.filter((o) => o.status === "pending").length}
            </strong>
            <span>Awaiting acceptance</span>
          </div>
          <div>
            <strong>{menu.length}</strong>
            <span>Menu items</span>
          </div>
          <div>
            <strong>{history.length}</strong>
            <span>Completed orders</span>
          </div>
        </div>
        {message && <Alert variant="info">{message}</Alert>}

        <section className="admin_section">
          <div className="section_heading">
            <div>
              <h3>Orders & Notifications</h3>
              <span>Live customer orders</span>
            </div>
          </div>
          {!orders.length && (
            <Alert variant="light">
              No active orders yet. New orders will appear here automatically.
            </Alert>
          )}
          {orders.map((order) => (
            <Card key={order.id} className="admin_order_card">
              <Row>
                <Col md={8}>
                  <div className="order_topline">
                    <div>
                      <span className="order_number">{orderNo(order.id)}</span>
                      <h5>{order.customer_name}</h5>
                    </div>
                    <Badge
                      bg={
                        order.status === "pending"
                          ? "warning"
                          : order.status === "delivered"
                            ? "success"
                            : "secondary"
                      }
                      text={order.status === "pending" ? "dark" : undefined}
                    >
                      {statusLabel(order.status)}
                    </Badge>
                  </div>
                  <div className="order_meta">
                    {formatDate(order.created_at)} ·{" "}
                    {formatTime(order.created_at)}
                  </div>
                  <div>Phone: {order.phone}</div>
                  <div>Address: {order.address}</div>
                  <div className="order_total">
                    Total:{" "}
                    <strong>${Number(order.total_amount).toFixed(2)}</strong>
                  </div>
                  <div className="order_items_preview">
                    {order.order_items?.map((item) => (
                      <span key={item.id}>
                        {item.item_name} × {item.quantity}
                      </span>
                    ))}
                  </div>
                </Col>
                <Col md={4} className="mt-3 mt-md-0">
                  {nextStep[order.status] && (
                    <Button
                      className="btn-brand border-0 w-100 mb-3"
                      onClick={() =>
                        updateOrder(
                          order,
                          nextStep[order.status][0],
                          order.estimated_minutes,
                        )
                      }
                    >
                      {nextStep[order.status][1]}
                    </Button>
                  )}
                  <Form.Label>Delivery Timer</Form.Label>
                  <Form.Select
                    className="mb-2"
                    value={order.estimated_minutes || 30}
                    onChange={(e) =>
                      updateOrder(order, order.status, e.target.value)
                    }
                  >
                    {[15, 20, 30, 45, 60, 90].map((m) => (
                      <option key={m} value={m}>
                        {m} minutes
                      </option>
                    ))}
                  </Form.Select>
                  <Form.Label>Status</Form.Label>
                  <Form.Select
                    value={order.status}
                    onChange={(e) =>
                      updateOrder(
                        order,
                        e.target.value,
                        order.estimated_minutes,
                      )
                    }
                  >
                    {statusOptions.map((s) => (
                      <option key={s} value={s}>
                        {statusLabel(s)}
                      </option>
                    ))}
                  </Form.Select>
                  <Button
                    variant="outline-danger"
                    className="mt-2 w-100"
                    onClick={() => deleteOrder(order.id)}
                  >
                    Delete Order
                  </Button>
                </Col>
              </Row>
            </Card>
          ))}
        </section>

        <hr className="my-5" />
        <section className="admin_section">
          <div className="section_heading">
            <div>
              <h3>Deals / Menu Builder</h3>
              <span>Add and control website menu cards</span>
            </div>
          </div>
          <Card className="p-3 mb-4">
            <Form onSubmit={saveMenu}>
              <Row>
                <Col md={6}>
                  <Form.Label>Name</Form.Label>
                  <Form.Control
                    className="mb-2"
                    placeholder="Crispy Chicken"
                    value={form.name}
                    onChange={(e) => updateForm("name", e.target.value)}
                    required
                  />
                </Col>
                <Col md={3}>
                  <Form.Label>Price</Form.Label>
                  <Form.Control
                    className="mb-2"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="6.99"
                    value={form.price}
                    onChange={(e) => updateForm("price", e.target.value)}
                    required
                  />
                </Col>
                <Col md={3}>
                  <Form.Label>Rating</Form.Label>
                  <Form.Control
                    className="mb-2"
                    type="number"
                    step="0.5"
                    min="0"
                    max="5"
                    value={form.rating}
                    onChange={(e) => updateForm("rating", e.target.value)}
                  />
                </Col>
              </Row>
              <Row>
                <Col md={8}>
                  <Form.Label>Description</Form.Label>
                  <Form.Control
                    className="mb-2"
                    placeholder="Chicken, cheese, sauce..."
                    value={form.description}
                    onChange={(e) => updateForm("description", e.target.value)}
                  />
                </Col>
                <Col md={4}>
                  <Form.Label>Category</Form.Label>
                  <Form.Control
                    className="mb-2"
                    placeholder="Burgers"
                    value={form.category}
                    onChange={(e) => updateForm("category", e.target.value)}
                  />
                </Col>
              </Row>
              <Form.Label>Image URL</Form.Label>
              <Form.Control
                className="mb-3"
                placeholder="https://..."
                value={form.image_url}
                onChange={(e) => updateForm("image_url", e.target.value)}
                required
              />
              <Row className="mb-3">
                <Col md={4}>
                  <Form.Label>Card Style</Form.Label>
                  <Form.Select
                    value={form.card_style}
                    onChange={(e) => updateForm("card_style", e.target.value)}
                  >
                    <option value="default">Default</option>
                    <option value="featured">Featured</option>
                    <option value="compact">Compact</option>
                  </Form.Select>
                </Col>
                <Col md={4}>
                  <Form.Label>Home Position</Form.Label>
                  <Form.Control
                    type="number"
                    min="0"
                    value={form.home_order}
                    onChange={(e) => updateForm("home_order", e.target.value)}
                  />
                </Col>
                <Col md={4}>
                  <Form.Label>Menu Position</Form.Label>
                  <Form.Control
                    type="number"
                    min="0"
                    value={form.menu_order}
                    onChange={(e) => updateForm("menu_order", e.target.value)}
                  />
                </Col>
              </Row>
              <div className="d-flex flex-wrap gap-4 mb-3">
                <Form.Check
                  type="checkbox"
                  label="Available for customers"
                  checked={form.is_available}
                  onChange={(e) => updateForm("is_available", e.target.checked)}
                />
                <Form.Check
                  type="checkbox"
                  label="Show on Home"
                  checked={form.show_on_home}
                  onChange={(e) => updateForm("show_on_home", e.target.checked)}
                />
                <Form.Check
                  type="checkbox"
                  label="Show on Menu page"
                  checked={form.show_on_menu}
                  onChange={(e) => updateForm("show_on_menu", e.target.checked)}
                />
              </div>
              <Button type="submit" className="btn-brand border-0 me-2">
                {form.id ? "Update Item" : "Add Item"}
              </Button>
              {form.id && (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setForm(emptyMenu)}
                >
                  Cancel
                </Button>
              )}
            </Form>
          </Card>
          <Table responsive hover className="admin_table">
            <thead>
              <tr>
                <th>Preview</th>
                <th>Name</th>
                <th>Price</th>
                <th>Display</th>
                <th>Style</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {menu.map((item) => (
                <tr key={item.id}>
                  <td>
                    <img
                      src={item.image_url}
                      alt={item.name}
                      style={{
                        width: 70,
                        height: 55,
                        objectFit: "cover",
                        borderRadius: 6,
                      }}
                    />
                  </td>
                  <td>
                    <strong>{item.name}</strong>
                    <br />
                    <small>{item.category}</small>
                  </td>
                  <td>${Number(item.price).toFixed(2)}</td>
                  <td>
                    {item.show_on_home && (
                      <Badge bg="dark" className="me-1">
                        Home
                      </Badge>
                    )}
                    {item.show_on_menu && <Badge bg="secondary">Menu</Badge>}
                    {!item.is_available && (
                      <Badge bg="danger" className="ms-1">
                        Hidden
                      </Badge>
                    )}
                  </td>
                  <td>{item.card_style}</td>
                  <td>
                    <Button
                      size="sm"
                      className="me-2"
                      onClick={() => editMenu(item)}
                    >
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => deleteMenu(item.id)}
                    >
                      Delete
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </section>
      </main>

      <Modal
        show={historyOpen}
        onHide={() => setHistoryOpen(false)}
        size="lg"
        centered
        className="admin_history_modal"
      >
        <Modal.Header closeButton>
          <Modal.Title>Order History</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {!history.length ? (
            <Alert variant="light">No completed orders in history yet.</Alert>
          ) : (
            <div className="history_list">
              {history.map((order) => (
                <button
                  type="button"
                  className="history_row"
                  key={order.id}
                  onClick={() => setSelectedHistoryOrder(order)}
                >
                  <span className="history_order_no">{orderNo(order.id)}</span>
                  <span>{formatDate(order.done_at || order.created_at)}</span>
                  <span>{formatTime(order.done_at || order.created_at)}</span>
                  <span>{order.customer_name || "—"}</span>
                  <Badge bg="success">Done</Badge>
                </button>
              ))}
            </div>
          )}
        </Modal.Body>
      </Modal>

      <Modal
        show={!!selectedHistoryOrder}
        onHide={() => setSelectedHistoryOrder(null)}
        size="lg"
        centered
      >
        {selectedHistoryOrder && (
          <>
            <Modal.Header closeButton>
              <Modal.Title>
                Order {orderNo(selectedHistoryOrder.id)}
              </Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <div className="detail_grid">
                <div>
                  <small>Date</small>
                  <strong>
                    {formatDate(
                      selectedHistoryOrder.done_at ||
                        selectedHistoryOrder.created_at,
                    )}
                  </strong>
                </div>
                <div>
                  <small>Time</small>
                  <strong>
                    {formatTime(
                      selectedHistoryOrder.done_at ||
                        selectedHistoryOrder.created_at,
                    )}
                  </strong>
                </div>
                <div>
                  <small>Status</small>
                  <strong>Done</strong>
                </div>
              </div>
              <hr />
              <h5>Customer Details</h5>
              <p className="mb-1">
                <strong>Name:</strong>{" "}
                {selectedHistoryOrder.customer_name || "—"}
              </p>
              <p className="mb-1">
                <strong>Phone:</strong> {selectedHistoryOrder.phone || "—"}
              </p>
              <p>
                <strong>Address:</strong> {selectedHistoryOrder.address || "—"}
              </p>
              <h5 className="mt-4">Ordered Items</h5>
              <Table responsive bordered size="sm">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Qty</th>
                    <th>Price</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedHistoryOrder.order_items?.map((item) => (
                    <tr key={item.id}>
                      <td>{item.item_name}</td>
                      <td>{item.quantity}</td>
                      <td>${Number(item.price || 0).toFixed(2)}</td>
                      <td>
                        $
                        {(
                          Number(item.price || 0) * Number(item.quantity || 0)
                        ).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
              <div className="history_grand_total">
                Order Total:{" "}
                <strong>
                  ${Number(selectedHistoryOrder.total_amount || 0).toFixed(2)}
                </strong>
              </div>
              {selectedHistoryOrder.rating ? (
                <div className="rating_remark">
                  <strong>Rating:</strong>{" "}
                  {"★".repeat(Number(selectedHistoryOrder.rating))} <br />
                  <strong>Remark:</strong> {selectedHistoryOrder.remark || "—"}
                </div>
              ) : null}
            </Modal.Body>
          </>
        )}
      </Modal>
    </div>
  );
}
