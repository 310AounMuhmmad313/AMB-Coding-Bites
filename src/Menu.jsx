import React, { useEffect, useMemo, useState } from "react";
import { Container, Row } from "react-bootstrap";
import { useSearchParams } from "react-router-dom";
import Layout from "./components/layouts/layouts";
import Cards, { DishSkeletons } from "./components/layouts/Cards";
import PageBanner from "./components/ui/PageBanner";
import { supabase } from "./supabase";
import "./Menu.css";

export default function Menu() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [params, setParams] = useSearchParams();
  const active = params.get("category") || "All";

  useEffect(() => {
    let mounted = true;

    const loadMenu = async () => {
      const { data } = await supabase
        .from("menu_items")
        .select("*")
        .eq("is_available", true)
        .eq("show_on_menu", true)
        .order("menu_order", { ascending: true })
        .order("created_at", { ascending: true });

      if (mounted) {
        setItems(data || []);
        setLoading(false);
      }
    };

    loadMenu();
    return () => {
      mounted = false;
    };
  }, []);

  const categories = useMemo(
    () => [
      "All",
      ...Array.from(new Set(items.map((i) => i.category).filter(Boolean))),
    ],
    [items],
  );

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((i) => {
      const inCat = active === "All" || i.category === active;
      const inSearch =
        !q || `${i.name} ${i.description || ""}`.toLowerCase().includes(q);
      return inCat && inSearch;
    });
  }, [items, active, query]);

  const pick = (cat) => setParams(cat === "All" ? {} : { category: cat });

  return (
    <Layout>
      <PageBanner
        title="Our menu"
        text="Pick your favourites, open any dish for the details, and add it to your cart. Tap the heart to save it for later."
      />
      <section className="page_body">
        <Container>
          <div className="menu_tools">
            <div
              className="menu_chips"
              role="group"
              aria-label="Filter by category"
            >
              {categories.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`chip ${active === c ? "on" : ""}`}
                  onClick={() => pick(c)}
                  aria-pressed={active === c}
                >
                  {c}
                </button>
              ))}
            </div>
            <div className="menu_search">
              <i className="bi bi-search" aria-hidden="true" />
              <input
                type="search"
                className="form-control"
                placeholder="Search the menu"
                aria-label="Search the menu"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
          </div>

          {!loading && items.length > 0 && (
            <p className="menu_count" role="status">
              {visible.length} {visible.length === 1 ? "dish" : "dishes"}
              {active !== "All" ? ` in ${active}` : ""}
            </p>
          )}

          {!loading && !items.length && (
            <div className="empty_state">
              <i className="bi bi-egg-fried" aria-hidden="true" />
              <h2>The menu is being prepared</h2>
              <p>
                New dishes will appear here as soon as the kitchen adds them.
              </p>
            </div>
          )}

          {!loading && items.length > 0 && !visible.length && (
            <div className="empty_state">
              <i className="bi bi-search" aria-hidden="true" />
              <h2>Nothing matches that</h2>
              <p>Try a different word or choose another category.</p>
              <button
                type="button"
                className="btn-brand btn-sm-pill"
                onClick={() => {
                  setQuery("");
                  pick("All");
                }}
              >
                Clear filters
              </button>
            </div>
          )}

          <Row>
            {loading && <DishSkeletons />}
            {visible.map((item) => (
              <Cards
                key={item.id}
                id={item.id}
                image={item.image_url}
                title={item.name}
                paragraph={item.description}
                price={item.price}
                rating={item.rating}
                category={item.category}
                cardStyle={item.card_style}
                showAddToCart={true}
              />
            ))}
          </Row>
        </Container>
      </section>
    </Layout>
  );
}
