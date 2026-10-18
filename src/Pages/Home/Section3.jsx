import React, { useEffect, useMemo, useState } from "react";
import { Container, Row } from "react-bootstrap";
import { Link } from "react-router-dom";
import Cards, { DishSkeletons } from "../../components/layouts/Cards";
import Reveal from "../../components/ui/Reveal";
import { supabase } from "../../supabase";
function Section3() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const loadMenu = async () => {
      const { data } = await supabase
        .from("menu_items")
        .select("*")
        .eq("is_available", true)
        .eq("show_on_home", true)
        .order("home_order", { ascending: true })
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
    () => Array.from(new Set(items.map((i) => i.category).filter(Boolean))),
    [items],
  );

  return (
    <section className="signature_section section_pad" id="signature">
      <Container>
        <Reveal className="section_head section_head_row">
          <div>
            <h2>Signature dishes</h2>
            <p>
              Fresh from the kitchen and ready to order. Open any dish for the
              full details.
            </p>
          </div>
          <Link to="/menu" className="text_link">
            View the full menu{" "}
            <i className="bi bi-arrow-right" aria-hidden="true" />
          </Link>
        </Reveal>

        {categories.length > 1 && (
          <nav className="home_cats" aria-label="Browse by category">
            {categories.map((c) => (
              <Link
                key={c}
                to={`/menu?category=${encodeURIComponent(c)}`}
                className="chip"
              >
                {c}
              </Link>
            ))}
          </nav>
        )}

        {!loading && !items.length && (
          <div className="empty_state">
            <i className="bi bi-egg-fried" aria-hidden="true" />
            <h2>Our menu is being updated</h2>
            <p>New dishes will appear here soon.</p>
          </div>
        )}

        <Row>
          {loading && <DishSkeletons count={3} />}
          {items.map((item) => (
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
  );
}

export default Section3;
