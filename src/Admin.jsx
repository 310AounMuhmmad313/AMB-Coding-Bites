import React, { useEffect, useMemo, useRef, useState } from "react";
import { Row, Col, Form, Button, Card, Alert, Table, Badge, Modal } from "react-bootstrap";
import { supabase } from "./supabase";
import logo from "./assets/logo/logo.png";
import "./Admin.css";

const ADMIN_EMAIL = "admin@tastburger.com";

const emptyMenu = {
  id: null, name: "", description: "", price: "", rating: 5,
  image_url: "", category: "Burgers", is_available: true,
  show_on_home: true, show_on_menu: true, home_order: 0, menu_order: 0, card_style: "default",
};

const statusOptions = ["pending", "accepted", "preparing", "out_for_delivery", "delivered", "done", "cancelled"];
const nextStep = {
  pending: ["accepted", "Accept order"], accepted: ["preparing", "Start preparing"],
  preparing: ["out_for_delivery", "Send out for delivery"], out_for_delivery: ["delivered", "Mark as delivered"],
  delivered: ["done", "Complete order"],
};

const statusLabel = (s) => s.replaceAll("_", " ").replace(/^./, (c) => c.toUpperCase());
const statusVariant = (s) => s === "pending" ? "warning" : s === "cancelled" ? "danger" : s === "delivered" || s === "done" ? "success" : "secondary";
const orderNo = (id) => `#TB-${String(id || "").replaceAll("-", "").slice(-6).toUpperCase()}`;
const formatDate = (value) => value ? new Date(value).toLocaleDateString("en-GB") : "—";
const formatTime = (value) => value ? new Date(value).toLocaleTimeString("en-PK", { hour: "2-digit", minute: "2-digit" }) : "—";

/* ---------- Date helpers for Desktop ---------- */
const localISO = (d) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
const todayISO = () => localISO(new Date());
const daysAgoISO = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return localISO(d); };
const monthKey = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
const monthLabel = (d) => d.toLocaleDateString("en-GB", { month: "short", year: "2-digit" });

const PRESETS = [
  { key: "today", label: "Today" }, { key: "7d", label: "7 days" },
  { key: "30d", label: "30 days" }, { key: "month", label: "This month" }, { key: "all", label: "All" },
];

/* ---------- Hook for number counter ---------- */
function useCountUp(target, duration = 600) {
  const [val, setVal] = useState(target);
  const cur = useRef(target);
  useEffect(() => {
    const from = cur.current; const start = performance.now(); let raf;
    const tick = (now) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      const v = from + (target - from) * eased;
      cur.current = v; setVal(v);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return val;
}

function StatCard({ label, value, prefix = "", decimals = 0, sub, alert }) {
  const v = useCountUp(value);
  return (
    <div className={alert ? "stat_card stat_alert" : "stat_card"}>
      <span>{label}</span>
      <strong>{prefix}{v.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}</strong>
      <small>{sub}</small>
    </div>
  );
}

/* ================= DESKTOP DASHBOARD COMPONENT ================= */
function DesktopDashboard({ orders, history, menu, goOrders }) {
  const [range, setRange] = useState({ from: daysAgoISO(6), to: todayISO() });
  const [preset, setPreset] = useState("7d");
  const [search, setSearch] = useState("");

  const applyPreset = (key) => {
    setPreset(key); const t = todayISO();
    if (key === "today") setRange({ from: t, to: t });
    else if (key === "7d") setRange({ from: daysAgoISO(6), to: t });
    else if (key === "30d") setRange({ from: daysAgoISO(29), to: t });
    else if (key === "month") setRange({ from: localISO(new Date(new Date().getFullYear(), new Date().getMonth(), 1)), to: t });
    else setRange({ from: "", to: "" });
  };

  const allOrders = useMemo(() => [...orders, ...history], [orders, history]);
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return allOrders.filter((o) => {
      const d = new Date(o.created_at);
      if (range.from && d < new Date(range.from + "T00:00:00")) return false;
      if (range.to && d > new Date(range.to + "T23:59:59")) return false;
      if (q) {
        const hay = `${o.customer_name || ""} ${o.phone || ""} ${o.address || ""} ${orderNo(o.id)}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [allOrders, range, search]);

  const paid = filtered.filter((o) => o.status !== "cancelled");
  const revenue = paid.reduce((s, o) => s + Number(o.total_amount || 0), 0);
  const avg = paid.length ? revenue / paid.length : 0;
  const pendingCount = filtered.filter((o) => o.status === "pending").length;
  const cancelledCount = filtered.length - paid.length;

  const statusCounts = useMemo(() => {
    const c = {}; statusOptions.forEach((s) => (c[s] = 0));
    filtered.forEach((o) => (c[o.status] = (c[o.status] || 0) + 1));
    return c;
  }, [filtered]);

  const chartData = useMemo(() => {
    const buckets = new Map();
    const valid = filtered.filter((o) => o.status !== "cancelled");
    if (range.from && range.to) {
      const s = new Date(range.from + "T00:00:00"); const e = new Date(range.to + "T00:00:00");
      const dayCount = Math.round((e - s) / 86400000) + 1;
      if (dayCount <= 31) {
        for (let i = 0; i < dayCount; i++) {
          const d = new Date(s); d.setDate(s.getDate() + i);
          buckets.set(localISO(d), { key: localISO(d), label: d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" }), count: 0, total: 0 });
        }
        valid.forEach((o) => {
          const b = buckets.get(localISO(new Date(o.created_at)));
          if (b) { b.count++; b.total += Number(o.total_amount || 0); }
        });
      } else {
        let cur = new Date(s.getFullYear(), s.getMonth(), 1); const endM = new Date(e.getFullYear(), e.getMonth(), 1);
        while (cur <= endM) {
          buckets.set(monthKey(cur), { key: monthKey(cur), label: monthLabel(cur), count: 0, total: 0 });
          cur = new Date(cur.getFullYear(), cur.getMonth() + 1, 1);
        }
        valid.forEach((o) => {
          const b = buckets.get(monthKey(new Date(o.created_at)));
          if (b) { b.count++; b.total += Number(o.total_amount || 0); }
        });
      }
    } else {
      const now = new Date();
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        buckets.set(monthKey(d), { key: monthKey(d), label: monthLabel(d), count: 0, total: 0 });
      }
      valid.forEach((o) => {
        const b = buckets.get(monthKey(new Date(o.created_at)));
        if (b) { b.count++; b.total += Number(o.total_amount || 0); }
      });
    }
    return [...buckets.values()];
  }, [filtered, range]);

  const maxTotal = Math.max(...chartData.map((d) => d.total), 1);
  const dayCount = range.from && range.to ? Math.round((new Date(range.to + "T00:00:00") - new Date(range.from + "T00:00:00")) / 86400000) + 1 : 0;

  const topCustomers = useMemo(() => {
    const map = {};
    filtered.forEach((o) => {
      const key = (o.phone || o.customer_name || "unknown").toLowerCase();
      if (!map[key]) map[key] = { name: o.customer_name || "—", area: o.address || "", orders: 0, spent: 0 };
      map[key].orders++; map[key].spent += Number(o.total_amount || 0);
    });
    return Object.values(map).sort((a, b) => b.spent - a.spent).slice(0, 5);
  }, [filtered]);

  const recent = useMemo(() => [...filtered].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 8), [filtered]);

  return (
    <div className="tab_content fade_in">
      <div className="dash_head">
        <div>
          <h2 className="page_title">Dashboard</h2>
          <p className="page_sub">Orders, revenue and customers in one view.</p>
        </div>
        <span className="live_chip"><i></i> Live</span>
      </div>

      <div className="dash_filters">
        <div className="dash_chips">
          {PRESETS.map((p) => (
            <button key={p.key} type="button" className={preset === p.key ? "chip active" : "chip"} onClick={() => applyPreset(p.key)}>{p.label}</button>
          ))}
        </div>
        <div className="dash_dates">
          <Form.Control type="date" value={range.from} max={range.to || todayISO()} onChange={(e) => { setPreset("custom"); setRange((r) => ({ ...r, from: e.target.value })); }} />
          <span>to</span>
          <Form.Control type="date" value={range.to} min={range.from} max={todayISO()} onChange={(e) => { setPreset("custom"); setRange((r) => ({ ...r, to: e.target.value })); }} />
        </div>
        <Form.Control className="dash_search" placeholder="Search name, phone, area or invoice..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="admin_stats">
        <StatCard label="Total Revenue" value={revenue} prefix="$" decimals={2} sub={`${paid.length} paid orders`} />
        <StatCard label="Total Orders" value={filtered.length} sub={cancelledCount > 0 ? `${cancelledCount} cancelled` : "in selected range"} />
        <StatCard label="Avg Order" value={avg} prefix="$" decimals={2} sub="per paid order" />
        <StatCard label="Pending" value={pendingCount} alert={pendingCount > 0} sub={pendingCount > 0 ? "awaiting acceptance" : "all clear"} />
        <StatCard label="Menu Items" value={menu.length} sub={`${menu.filter((m) => m.is_available).length} available`} />
      </div>

      <div className="dash_grid mt-4">
        <Card className="content_card p-4">
          <div className="dash_card_head">
            <h5>Sales Overview</h5>
            <small>Revenue per {dayCount > 0 && dayCount <= 31 ? "day" : "month"}</small>
          </div>
          {chartData.length ? (
            <div className="chart_scroll">
              <div className="dash_chart" key={`${range.from}-${range.to}`}>
                {chartData.map((d) => (
                  <div className="dash_bar_col" key={d.key}>
                    <div className="dash_bar_zone">
                      <div className="dash_bar" style={{ height: d.total ? `${Math.max((d.total / maxTotal) * 100, 3)}%` : "2%" }} data-tip={`${d.count} orders · $${d.total.toFixed(0)}`} />
                    </div>
                    <small>{d.label}</small>
                  </div>
                ))}
              </div>
            </div>
          ) : (<p className="text-muted mb-0">No orders in this range.</p>)}
        </Card>
        <div className="d-flex flex-column gap-4">
          <Card className="content_card p-4">
            <div className="dash_card_head"><h5>Order Status</h5></div>
            {filtered.length ? (
              statusOptions.filter((s) => statusCounts[s] > 0).map((s) => (
                <div className="status_line" key={s}>
                  <span className="status_name">{statusLabel(s)}</span>
                  <div className="status_track">
                    <div className="status_fill" style={{ width: `${(statusCounts[s] / filtered.length) * 100}%` }} />
                  </div>
                  <b>{statusCounts[s]}</b>
                </div>
              ))
            ) : (<p className="text-muted mb-0">Nothing to show.</p>)}
          </Card>
          <Card className="content_card p-4">
            <div className="dash_card_head"><h5>Top Customers</h5></div>
            {topCustomers.length ? (
              <div className="cust_list">
                {topCustomers.map((c, i) => (
                  <div className="cust_row" key={i}>
                    <span className="cust_rank">{i + 1}</span>
                    <div className="cust_info">
                      <strong>{c.name}</strong><small>{c.area.length > 38 ? c.area.slice(0, 38) + "…" : c.area || "—"}</small>
                    </div>
                    <div className="cust_stats"><b>${c.spent.toFixed(2)}</b><small>{c.orders} orders</small></div>
                  </div>
                ))}
              </div>
            ) : (<p className="text-muted mb-0">No customers in this range.</p>)}
          </Card>
        </div>
      </div>

      <Card className="content_card mt-4">
        <div className="dash_card_head px-4 pt-3 pb-2">
          <h5>Recent Orders</h5>
          <button type="button" className="link_btn" onClick={() => goOrders && goOrders()}>View all</button>
        </div>
        {!recent.length ? (
          <p className="px-4 pb-3 text-muted mb-0">No orders found for this filter.</p>
        ) : (
          <div className="table_wrap">
            <Table responsive hover className="admin_table mb-0">
              <thead><tr><th>Invoice</th><th>Customer</th><th>Area</th><th>Date</th><th>Total</th><th>Status</th></tr></thead>
              <tbody>
                {recent.map((o) => (
                  <tr key={o.id}>
                    <td><strong>{orderNo(o.id)}</strong></td>
                    <td>{o.customer_name || "—"}</td>
                    <td>{(o.address || "—").length > 30 ? o.address.slice(0, 30) + "…" : o.address || "—"}</td>
                    <td>{formatDate(o.created_at)} {formatTime(o.created_at)}</td>
                    <td>${Number(o.total_amount || 0).toFixed(2)}</td>
                    <td><Badge bg={statusVariant(o.status)}>{statusLabel(o.status)}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        )}
      </Card>
    </div>
  );
}

/* ================= MAIN APP ================= */
export default function Admin() {
  const [session, setSession] = useState(null);
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [orders, setOrders] = useState([]);
  const [history, setHistory] = useState([]);
  const [menu, setMenu] = useState([]);
  const [form, setForm] = useState(emptyMenu);
  const [message, setMessage] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [selectedHistoryOrder, setSelectedHistoryOrder] = useState(null);
  
  // Mobile specific state
  const [isMobile, setIsMobile] = useState(typeof window !== "undefined" ? window.innerWidth <= 991 : false);
  const [historyOpen, setHistoryOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 991);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_event, next) => setSession(next));
    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) { setIsAdmin(false); return; }
    let channel;
    const setup = async () => {
      const { data, error } = await supabase.from("profiles").select("role").eq("id", session.user.id).maybeSingle();
      if (error) { setLoginError(`Admin profile check failed: ${error.message}`); setIsAdmin(false); return; }
      if (data?.role !== "admin") { setLoginError("This account is not registered as an admin."); setIsAdmin(false); await supabase.auth.signOut(); return; }
      setIsAdmin(true); loadOrders(); loadHistory(); loadMenu();
      channel = supabase.channel("admin-orders").on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => { loadOrders(); loadHistory(); }).subscribe();
    };
    setup();
    return () => { if (channel) supabase.removeChannel(channel); };
  }, [session]);

  const login = async (e) => {
    e.preventDefault(); setLoginError("");
    const { error } = await supabase.auth.signInWithPassword({ email: ADMIN_EMAIL, password });
    if (error) setLoginError(error.message);
  };
  const logout = () => supabase.auth.signOut();

  const loadOrders = async () => { const { data } = await supabase.from("orders").select("*, order_items(*)").neq("status", "done").order("created_at", { ascending: false }); setOrders(data || []); };
  const loadHistory = async () => { const { data } = await supabase.from("orders").select("*, order_items(*)").eq("status", "done").order("done_at", { ascending: false, nullsFirst: false }).order("created_at", { ascending: false }); setHistory(data || []); };
  const loadMenu = async () => { const { data } = await supabase.from("menu_items").select("*").order("home_order", { ascending: true }).order("menu_order", { ascending: true }).order("created_at", { ascending: true }); setMenu(data || []); };

  const updateOrder = async (order, status, minutes = order.estimated_minutes) => {
    const selectedMinutes = Number(minutes) || 30;
    const patch = { status, estimated_minutes: selectedMinutes };
    if (status === "out_for_delivery") patch.estimated_end_at = new Date(Date.now() + selectedMinutes * 60000).toISOString();
    if (["delivered", "cancelled"].includes(status)) patch.estimated_end_at = null;
    if (status === "done") { patch.estimated_end_at = null; patch.done_at = new Date().toISOString(); }
    if (status !== "done" && order.status === "done") patch.done_at = null;
    const { error } = await supabase.from("orders").update(patch).eq("id", order.id);
    if (error) setMessage(error.message); else { setMessage(`Order ${orderNo(order.id)} updated.`); loadOrders(); loadHistory(); setTimeout(() => setMessage(""), 3000); }
  };
  const deleteOrder = async (id) => {
    if (!window.confirm("Delete this order?")) return;
    const { error } = await supabase.from("orders").delete().eq("id", id);
    if (error) setMessage(error.message); else { setMessage("Order deleted."); loadOrders(); loadHistory(); setTimeout(() => setMessage(""), 3000); }
  };
  const updateForm = (key, value) => setForm((old) => ({ ...old, [key]: value }));
  const saveMenu = async (e) => {
    e.preventDefault(); setMessage("");
    const payload = { name: form.name.trim(), description: form.description.trim(), price: Number(form.price), rating: Number(form.rating), image_url: form.image_url.trim(), category: form.category.trim() || "Burgers", is_available: Boolean(form.is_available), show_on_home: Boolean(form.show_on_home), show_on_menu: Boolean(form.show_on_menu), home_order: Number(form.home_order) || 0, menu_order: Number(form.menu_order) || 0, card_style: form.card_style };
    const result = form.id ? await supabase.from("menu_items").update(payload).eq("id", form.id) : await supabase.from("menu_items").insert(payload);
    if (result.error) { setMessage(result.error.message); return; }
    setMessage(form.id ? "Menu item updated successfully." : "Menu item added successfully.");
    setForm(emptyMenu); loadMenu(); setTimeout(() => setMessage(""), 3000);
  };
  const editMenu = (item) => { setForm({ id: item.id, name: item.name || "", description: item.description || "", price: item.price || "", rating: item.rating ?? 5, image_url: item.image_url || "", category: item.category || "Burgers", is_available: item.is_available ?? true, show_on_home: item.show_on_home ?? true, show_on_menu: item.show_on_menu ?? true, home_order: item.home_order ?? 0, menu_order: item.menu_order ?? 0, card_style: item.card_style || "default" }); window.scrollTo({ top: isMobile ? document.body.scrollHeight : 0, behavior: "smooth" }); };
  const deleteMenu = async (id) => {
    if (!window.confirm("Delete this menu item?")) return;
    const { error } = await supabase.from("menu_items").delete().eq("id", id);
    if (error) setMessage(error.message); else { setMessage("Menu item deleted."); loadMenu(); setTimeout(() => setMessage(""), 3000); }
  };

  if (!session || !isAdmin) {
    return (
      <div className="admin_page">
        <div className="admin_login_shell">
          <div className="admin_brand_login">
            <img src={logo} alt="TastBurger" />
            <span>Admin Panel</span>
          </div>
          <Card className="admin_login_card">
            <h2>Admin Login</h2>
            {loginError && <Alert variant="danger">{loginError}</Alert>}
            <Form onSubmit={login}>
              <Form.Label>Admin Email</Form.Label>
              <Form.Control className="mb-3" type="email" value={ADMIN_EMAIL} readOnly />
              <Form.Label>Password</Form.Label>
              <Form.Control className="mb-3" type="password" placeholder="Enter admin password" value={password} onChange={(e) => setPassword(e.target.value)} required />
              <Button type="submit" className="btn-brand border-0 w-100">Login</Button>
            </Form>
          </Card>
        </div>
      </div>
    );
  }

  const pendingOrders = orders.filter((o) => o.status === "pending").length;

  /* ================== MOBILE VIEW (Original Scroll Layout) ================== */
  if (isMobile) {
    return (
      <div className="admin_page mobile_admin_view">
        <header className="admin_header">
          <div className="admin_header_inner">
            <div className="admin_brand">
              <img src={logo} alt="TastBurger" />
              <div>
                <strong>AMB Coding Bite</strong>
                <small>ADMIN PANEL</small>
              </div>
            </div>
            <div className="admin_header_actions">
              <Button className="admin_history_btn" onClick={() => setHistoryOpen(true)}>
                Order History <Badge bg="light" text="dark">{history.length}</Badge>
              </Button>
              <Button variant="outline-danger" onClick={logout}>Logout</Button>
            </div>
          </div>
        </header>

        <main className="admin_content">
          <div className="admin_title_row">
            <div><h2>Admin Dashboard</h2><p>Manage orders and control your menu.</p></div>
          </div>
          
          <div className="admin_stats">
            <div><strong>{orders.length}</strong><span>Active orders</span></div>
            <div className={pendingOrders > 0 ? "alert_stat" : ""}>
              <strong>{pendingOrders}</strong><span>Awaiting acceptance</span>
            </div>
            <div><strong>{menu.length}</strong><span>Menu items</span></div>
            <div><strong>{history.length}</strong><span>Completed orders</span></div>
          </div>
          {message && <Alert variant="info">{message}</Alert>}

          <section className="admin_section">
            <div className="section_heading">
              <div><h3>Orders & Notifications</h3><span>Live customer orders</span></div>
            </div>
            {!orders.length && <Alert variant="light">No active orders yet. New orders will appear here automatically.</Alert>}
            {orders.map((order) => (
              <Card key={order.id} className="admin_order_card mb-3">
                <Row>
                  <Col md={8}>
                    <div className="order_topline">
                      <div><span className="order_number">{orderNo(order.id)}</span><h5>{order.customer_name}</h5></div>
                      <Badge bg={statusVariant(order.status)} text={order.status === "pending" ? "dark" : undefined}>{statusLabel(order.status)}</Badge>
                    </div>
                    <div className="order_meta">{formatDate(order.created_at)} · {formatTime(order.created_at)}</div>
                    <div>Phone: {order.phone}</div>
                    <div>Address: {order.address}</div>
                    <div className="order_total mt-2">Total: <strong>${Number(order.total_amount).toFixed(2)}</strong></div>
                    <div className="order_items_preview">
                      {order.order_items?.map((item) => (<span key={item.id}>{item.item_name} × {item.quantity}</span>))}
                    </div>
                  </Col>
                  <Col md={4} className="mt-3 mt-md-0">
                    {nextStep[order.status] && (
                      <Button className="btn-brand border-0 w-100 mb-3" onClick={() => updateOrder(order, nextStep[order.status][0], order.estimated_minutes)}>
                        {nextStep[order.status][1]}
                      </Button>
                    )}
                    <Form.Label>Delivery Timer</Form.Label>
                    <Form.Select className="mb-2" value={order.estimated_minutes || 30} onChange={(e) => updateOrder(order, order.status, e.target.value)}>
                      {[15, 20, 30, 45, 60, 90].map((m) => (<option key={m} value={m}>{m} minutes</option>))}
                    </Form.Select>
                    <Form.Label>Status</Form.Label>
                    <Form.Select value={order.status} onChange={(e) => updateOrder(order, e.target.value, order.estimated_minutes)}>
                      {statusOptions.map((s) => (<option key={s} value={s}>{statusLabel(s)}</option>))}
                    </Form.Select>
                    <Button variant="outline-danger" className="mt-3 w-100" onClick={() => deleteOrder(order.id)}>Delete Order</Button>
                  </Col>
                </Row>
              </Card>
            ))}
          </section>

          <section className="admin_section mt-5">
            <div className="section_heading">
              <div><h3>Deals / Menu Builder</h3><span>Add and control website menu cards</span></div>
            </div>
            <Card className="p-3 mb-4">
              <Form onSubmit={saveMenu}>
                <Row>
                  <Col md={6}><Form.Label>Name</Form.Label><Form.Control className="mb-2" placeholder="Crispy Chicken" value={form.name} onChange={(e) => updateForm("name", e.target.value)} required /></Col>
                  <Col md={3}><Form.Label>Price</Form.Label><Form.Control className="mb-2" type="number" step="0.01" min="0" placeholder="6.99" value={form.price} onChange={(e) => updateForm("price", e.target.value)} required /></Col>
                  <Col md={3}><Form.Label>Rating</Form.Label><Form.Control className="mb-2" type="number" step="0.5" min="0" max="5" value={form.rating} onChange={(e) => updateForm("rating", e.target.value)} /></Col>
                </Row>
                <Row>
                  <Col md={8}><Form.Label>Description</Form.Label><Form.Control className="mb-2" placeholder="Chicken, cheese, sauce..." value={form.description} onChange={(e) => updateForm("description", e.target.value)} /></Col>
                  <Col md={4}><Form.Label>Category</Form.Label><Form.Control className="mb-2" placeholder="Burgers" value={form.category} onChange={(e) => updateForm("category", e.target.value)} /></Col>
                </Row>
                <Form.Label>Image URL</Form.Label><Form.Control className="mb-3" placeholder="https://..." value={form.image_url} onChange={(e) => updateForm("image_url", e.target.value)} required />
                <Row className="mb-3">
                  <Col md={4}><Form.Label>Card Style</Form.Label><Form.Select value={form.card_style} onChange={(e) => updateForm("card_style", e.target.value)}><option value="default">Default</option><option value="featured">Featured</option><option value="compact">Compact</option></Form.Select></Col>
                  <Col md={4}><Form.Label>Home Pos.</Form.Label><Form.Control type="number" min="0" value={form.home_order} onChange={(e) => updateForm("home_order", e.target.value)} /></Col>
                  <Col md={4}><Form.Label>Menu Pos.</Form.Label><Form.Control type="number" min="0" value={form.menu_order} onChange={(e) => updateForm("menu_order", e.target.value)} /></Col>
                </Row>
                <div className="d-flex flex-wrap gap-3 mb-3">
                  <Form.Check type="checkbox" label="Available" checked={form.is_available} onChange={(e) => updateForm("is_available", e.target.checked)} />
                  <Form.Check type="checkbox" label="Show on Home" checked={form.show_on_home} onChange={(e) => updateForm("show_on_home", e.target.checked)} />
                  <Form.Check type="checkbox" label="Show on Menu" checked={form.show_on_menu} onChange={(e) => updateForm("show_on_menu", e.target.checked)} />
                </div>
                <Button type="submit" className="btn-brand border-0 me-2">{form.id ? "Update Item" : "Add Item"}</Button>
                {form.id && <Button type="button" variant="secondary" onClick={() => setForm(emptyMenu)}>Cancel</Button>}
              </Form>
            </Card>
            
            <div className="table_wrap">
              <Table responsive hover className="admin_table">
                <thead><tr><th>Preview</th><th>Name</th><th>Price</th><th>Visibility</th><th>Action</th></tr></thead>
                <tbody>
                  {menu.map((item) => (
                    <tr key={item.id}>
                      <td><img src={item.image_url} alt={item.name} style={{ width: 60, height: 50, objectFit: "cover", borderRadius: 6 }} /></td>
                      <td><strong>{item.name}</strong><br /><small>{item.category}</small></td>
                      <td>${Number(item.price).toFixed(2)}</td>
                      <td>
                        {item.show_on_home && <Badge bg="dark" className="me-1">Home</Badge>}
                        {item.show_on_menu && <Badge bg="secondary">Menu</Badge>}
                        {!item.is_available && <Badge bg="danger" className="ms-1">Hidden</Badge>}
                      </td>
                      <td>
                        <Button size="sm" className="me-2" onClick={() => editMenu(item)}>Edit</Button>
                        <Button size="sm" variant="danger" onClick={() => deleteMenu(item.id)}>Delete</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          </section>
        </main>

        <Modal show={historyOpen} onHide={() => setHistoryOpen(false)} size="lg" centered className="admin_history_modal">
          <Modal.Header closeButton><Modal.Title>Order History</Modal.Title></Modal.Header>
          <Modal.Body>
            {!history.length ? (<Alert variant="light">No completed orders in history yet.</Alert>) : (
              <div className="history_list">
                {history.map((order) => (
                  <button type="button" className="history_row" key={order.id} onClick={() => setSelectedHistoryOrder(order)}>
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

        <Modal show={!!selectedHistoryOrder} onHide={() => setSelectedHistoryOrder(null)} size="lg" centered>
          {selectedHistoryOrder && (
            <>
              <Modal.Header closeButton><Modal.Title>Order {orderNo(selectedHistoryOrder.id)}</Modal.Title></Modal.Header>
              <Modal.Body>
                <div className="detail_grid">
                  <div><small>Date</small><strong>{formatDate(selectedHistoryOrder.done_at || selectedHistoryOrder.created_at)}</strong></div>
                  <div><small>Time</small><strong>{formatTime(selectedHistoryOrder.done_at || selectedHistoryOrder.created_at)}</strong></div>
                  <div><small>Status</small><strong>Completed</strong></div>
                </div>
                <hr />
                <h5>Customer Details</h5>
                <p className="mb-1"><strong>Name:</strong> {selectedHistoryOrder.customer_name || "—"}</p>
                <p className="mb-1"><strong>Phone:</strong> {selectedHistoryOrder.phone || "—"}</p>
                <p><strong>Address:</strong> {selectedHistoryOrder.address || "—"}</p>
                <h5 className="mt-4">Ordered Items</h5>
                <div className="table_wrap">
                  <Table bordered size="sm">
                    <thead><tr><th>Item</th><th>Qty</th><th>Price</th><th>Total</th></tr></thead>
                    <tbody>
                      {selectedHistoryOrder.order_items?.map((item) => (
                        <tr key={item.id}>
                          <td>{item.item_name}</td><td>{item.quantity}</td>
                          <td>${Number(item.price || 0).toFixed(2)}</td>
                          <td>${(Number(item.price || 0) * Number(item.quantity || 0)).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
                <div className="history_grand_total">
                  Order Total: <strong>${Number(selectedHistoryOrder.total_amount || 0).toFixed(2)}</strong>
                </div>
              </Modal.Body>
            </>
          )}
        </Modal>
      </div>
    );
  }

  /* ================== DESKTOP VIEW (New Sidebar Tabbed Layout) ================== */
  return (
    <div className="admin_layout desktop_admin_view">
      <aside className="admin_sidebar">
        <div className="sidebar_brand">
          <img src={logo} alt="TastBurger" />
          <div>
            <strong>AMB Coding Bite</strong>
            <span>Admin Panel</span>
          </div>
        </div>
        <nav className="sidebar_nav">
          <button className={activeTab === "dashboard" ? "active" : ""} onClick={() => setActiveTab("dashboard")}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="9" rx="1" /><rect x="14" y="3" width="7" height="5" rx="1" /><rect x="14" y="12" width="7" height="9" rx="1" /><rect x="3" y="16" width="7" height="5" rx="1" /></svg> Dashboard
          </button>
          <button className={activeTab === "orders" ? "active" : ""} onClick={() => setActiveTab("orders")}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 0 1-8 0" /></svg> Active Orders {pendingOrders > 0 && (<span className="nav_badge">{pendingOrders}</span>)}
          </button>
          <button className={activeTab === "menu" ? "active" : ""} onClick={() => setActiveTab("menu")}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3h18v18H3z" /><path d="M12 8v8M8 12h8" /></svg> Menu Builder
          </button>
          <button className={activeTab === "history" ? "active" : ""} onClick={() => setActiveTab("history")}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg> Order History
          </button>
        </nav>
        <div className="sidebar_footer">
          <a href="/" target="_blank" rel="noreferrer" className="sidebar_link">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg> View Website
          </a>
          <button className="sidebar_link" onClick={logout}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg> Logout
          </button>
        </div>
      </aside>

      <main className="admin_main">
        {message && <Alert variant="info" className="global_alert">{message}</Alert>}

        {activeTab === "dashboard" && <DesktopDashboard orders={orders} history={history} menu={menu} goOrders={() => setActiveTab("orders")} />}

        {activeTab === "orders" && (
          <div className="tab_content fade_in">
            <h2 className="page_title">Live Orders</h2>
            <p className="page_sub mb-4">{orders.length} active · {pendingOrders} pending</p>
            {!orders.length && <Alert variant="light">No active orders yet.</Alert>}
            {orders.map((order) => (
              <Card className="admin_order_card mb-3" key={order.id}>
                <Row>
                  <Col md={8}>
                    <div className="order_topline">
                      <div><span className="order_number">{orderNo(order.id)}</span><h5>{order.customer_name}</h5></div>
                      <Badge bg={statusVariant(order.status)} text={order.status === "pending" ? "dark" : undefined}>{statusLabel(order.status)}</Badge>
                    </div>
                    <div className="order_meta">{formatDate(order.created_at)} · {formatTime(order.created_at)}<br />Phone: {order.phone}<br />Address: {order.address}</div>
                    <div className="order_total">Total: <strong>${Number(order.total_amount).toFixed(2)}</strong></div>
                    <div className="order_items_preview mt-2">
                      {order.order_items?.map((item) => (<span key={item.id}>{item.item_name} × {item.quantity}</span>))}
                    </div>
                  </Col>
                  <Col md={4} className="mt-3 mt-md-0">
                    {nextStep[order.status] && (
                      <Button className="btn-brand border-0 w-100 mb-3" onClick={() => updateOrder(order, nextStep[order.status][0], order.estimated_minutes)}>
                        {nextStep[order.status][1]}
                      </Button>
                    )}
                    <Form.Label className="small text-muted">Delivery Timer</Form.Label>
                    <Form.Select size="sm" className="mb-2" value={order.estimated_minutes || 30} onChange={(e) => updateOrder(order, order.status, e.target.value)}>
                      {[15, 20, 30, 45, 60, 90].map((m) => (<option key={m} value={m}>{m} minutes</option>))}
                    </Form.Select>
                    <Form.Label className="small text-muted">Status</Form.Label>
                    <Form.Select size="sm" value={order.status} onChange={(e) => updateOrder(order, e.target.value, order.estimated_minutes)}>
                      {statusOptions.map((s) => (<option key={s} value={s}>{statusLabel(s)}</option>))}
                    </Form.Select>
                    <Button variant="outline-danger" size="sm" className="mt-3 w-100" onClick={() => deleteOrder(order.id)}>Delete Order</Button>
                  </Col>
                </Row>
              </Card>
            ))}
          </div>
        )}

        {activeTab === "menu" && (
          <div className="tab_content fade_in">
            <h2 className="page_title">Deals & Menu Builder</h2>
            <p className="page_sub mb-4">Add and control website menu cards.</p>
            <Card className="content_card mb-4 p-4">
              <Form onSubmit={saveMenu}>
                <Row>
                  <Col md={4}><Form.Group className="mb-3"><Form.Label>Name</Form.Label><Form.Control placeholder="Crispy Chicken" value={form.name} onChange={(e) => updateForm("name", e.target.value)} required /></Form.Group></Col>
                  <Col md={2}><Form.Group className="mb-3"><Form.Label>Price ($)</Form.Label><Form.Control type="number" step="0.01" min="0" placeholder="6.99" value={form.price} onChange={(e) => updateForm("price", e.target.value)} required /></Form.Group></Col>
                  <Col md={2}><Form.Group className="mb-3"><Form.Label>Rating</Form.Label><Form.Control type="number" step="0.5" min="0" max="5" value={form.rating} onChange={(e) => updateForm("rating", e.target.value)} /></Form.Group></Col>
                  <Col md={4}><Form.Group className="mb-3"><Form.Label>Category</Form.Label><Form.Control placeholder="Burgers" value={form.category} onChange={(e) => updateForm("category", e.target.value)} /></Form.Group></Col>
                </Row>
                <Row>
                  <Col md={8}><Form.Group className="mb-3"><Form.Label>Description</Form.Label><Form.Control placeholder="Chicken, cheese, sauce..." value={form.description} onChange={(e) => updateForm("description", e.target.value)} /></Form.Group></Col>
                  <Col md={4}><Form.Group className="mb-3"><Form.Label>Image URL</Form.Label><Form.Control placeholder="https://..." value={form.image_url} onChange={(e) => updateForm("image_url", e.target.value)} required /></Form.Group></Col>
                </Row>
                <Row className="align-items-end mb-3">
                  <Col md={3} xs={6}><Form.Label>Card Style</Form.Label><Form.Select value={form.card_style} onChange={(e) => updateForm("card_style", e.target.value)}><option value="default">Default</option><option value="featured">Featured</option><option value="compact">Compact</option></Form.Select></Col>
                  <Col md={2} xs={3}><Form.Label>Home Pos.</Form.Label><Form.Control type="number" min="0" value={form.home_order} onChange={(e) => updateForm("home_order", e.target.value)} /></Col>
                  <Col md={2} xs={3}><Form.Label>Menu Pos.</Form.Label><Form.Control type="number" min="0" value={form.menu_order} onChange={(e) => updateForm("menu_order", e.target.value)} /></Col>
                  <Col md={5}>
                    <div className="d-flex flex-wrap gap-3 pt-2">
                      <Form.Check type="checkbox" label="Available" checked={form.is_available} onChange={(e) => updateForm("is_available", e.target.checked)} />
                      <Form.Check type="checkbox" label="On Home" checked={form.show_on_home} onChange={(e) => updateForm("show_on_home", e.target.checked)} />
                      <Form.Check type="checkbox" label="On Menu" checked={form.show_on_menu} onChange={(e) => updateForm("show_on_menu", e.target.checked)} />
                    </div>
                  </Col>
                </Row>
                <div className="mt-2">
                  <Button type="submit" className="btn-brand border-0 me-2 px-4">{form.id ? "Update Item" : "Add New Item"}</Button>
                  {form.id && <Button type="button" variant="light" onClick={() => setForm(emptyMenu)}>Cancel</Button>}
                </div>
              </Form>
            </Card>
            <Card className="content_card">
              <div className="table_wrap">
                <Table responsive hover className="admin_table mb-0">
                  <thead><tr><th>Product</th><th>Category</th><th>Price</th><th>Visibility</th><th>Actions</th></tr></thead>
                  <tbody>
                    {menu.map((item) => (
                      <tr key={item.id}>
                        <td><div className="menu_cell"><img src={item.image_url} alt={item.name} /><strong>{item.name}</strong></div></td>
                        <td>{item.category}</td>
                        <td>${Number(item.price).toFixed(2)}</td>
                        <td>
                          {!item.is_available ? <Badge bg="danger">Hidden</Badge> : <Badge bg="success">Active</Badge>}
                          {item.show_on_home && <Badge bg="dark" className="ms-1">Home</Badge>}
                        </td>
                        <td>
                          <div className="d-flex gap-2">
                            <Button variant="light" size="sm" onClick={() => editMenu(item)}>Edit</Button>
                            <Button variant="light" size="sm" className="text-danger" onClick={() => deleteMenu(item.id)}>Delete</Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            </Card>
          </div>
        )}

        {activeTab === "history" && (
          <div className="tab_content fade_in">
            <h2 className="page_title">Order History</h2>
            <p className="page_sub mb-4">{history.length} completed orders</p>
            <Card className="content_card">
              {!history.length ? (
                <div className="p-4 text-center text-muted">No completed orders in history yet.</div>
              ) : (
                <div className="table_wrap">
                  <Table responsive hover className="admin_table mb-0">
                    <thead><tr><th>Order ID</th><th>Date & Time</th><th>Customer</th><th>Total</th><th>Status</th><th>Action</th></tr></thead>
                    <tbody>
                      {history.map((order) => (
                        <tr key={order.id}>
                          <td><strong>{orderNo(order.id)}</strong></td>
                          <td>{formatDate(order.done_at || order.created_at)} {formatTime(order.done_at || order.created_at)}</td>
                          <td>{order.customer_name || "—"}</td>
                          <td>${Number(order.total_amount).toFixed(2)}</td>
                          <td><Badge bg="success">Done</Badge></td>
                          <td><Button variant="light" size="sm" onClick={() => setSelectedHistoryOrder(order)}>View</Button></td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              )}
            </Card>
          </div>
        )}
      </main>

      <Modal show={!!selectedHistoryOrder} onHide={() => setSelectedHistoryOrder(null)} size="lg" centered>
        {selectedHistoryOrder && (
          <>
            <Modal.Header closeButton className="pb-0"><Modal.Title>Order {orderNo(selectedHistoryOrder.id)}</Modal.Title></Modal.Header>
            <Modal.Body className="pt-2">
              <div className="detail_grid">
                <div><small>Date</small><strong>{formatDate(selectedHistoryOrder.done_at || selectedHistoryOrder.created_at)}</strong></div>
                <div><small>Time</small><strong>{formatTime(selectedHistoryOrder.done_at || selectedHistoryOrder.created_at)}</strong></div>
                <div><small>Status</small><strong>Completed</strong></div>
              </div>
              <hr />
              <h6>Customer</h6>
              <p className="mb-1"><strong>Name:</strong> {selectedHistoryOrder.customer_name || "—"}</p>
              <p className="mb-1"><strong>Phone:</strong> {selectedHistoryOrder.phone || "—"}</p>
              <p><strong>Address:</strong> {selectedHistoryOrder.address || "—"}</p>
              <h6 className="mt-3">Items</h6>
              <div className="table_wrap">
                <Table bordered size="sm" className="mb-3">
                  <thead><tr><th>Item</th><th>Qty</th><th>Price</th><th>Total</th></tr></thead>
                  <tbody>
                    {selectedHistoryOrder.order_items?.map((item) => (
                      <tr key={item.id}>
                        <td>{item.item_name}</td><td>{item.quantity}</td>
                        <td>${Number(item.price || 0).toFixed(2)}</td>
                        <td>${(Number(item.price || 0) * Number(item.quantity || 0)).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
              <div className="history_grand_total">
                Order Total: <strong>${Number(selectedHistoryOrder.total_amount || 0).toFixed(2)}</strong>
              </div>
            </Modal.Body>
          </>
        )}
      </Modal>
    </div>
  );
}
