import React, { useEffect, useRef, useState } from "react";
import { Col, Modal } from "react-bootstrap";
import { useCart } from "../../CartContext";

const renderRatingIcons = (rating = 0) =>
  Array.from({ length: 5 }, (_, i) => (
    <i
      key={i}
      aria-hidden="true"
      className={
        Number(rating) >= i + 1
          ? "bi bi-star-fill"
          : Number(rating) >= i + 0.5
            ? "bi bi-star-half"
            : "bi bi-star"
      }
    />
  ));

function Cards({
  image,
  rating,
  title,
  paragraph,
  price,
  id,
  category,
  cardStyle = "default",
  showAddToCart = false,
}) {
  const { addToCart } = useCart();
  const [open, setOpen] = useState(false);
  const [added, setAdded] = useState(false);
  const timer = useRef(null);

  useEffect(() => () => clearTimeout(timer.current), []);

  const item = { id, image, title, paragraph, price: Number(price), rating };

  const handleAdd = () => {
    addToCart(item);
    setAdded(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setAdded(false), 1500);
  };

  const addButton = (extra = "") => (
    <button
      type="button"
      onClick={handleAdd}
      className={`dish_add ${added ? "is_added" : ""} ${extra}`}
      aria-live="polite"
    >
      <i
        className={`bi ${added ? "bi-check2" : "bi-bag-plus"}`}
        aria-hidden="true"
      />
      {added ? "Added" : "Add to cart"}
    </button>
  );

  return (
    <Col sm={6} lg={4} className="mb-4 d-flex">
      <article className={`dish dish_${cardStyle}`}>
        <div className="dish_media">
          <button
            type="button"
            className="dish_open"
            onClick={() => setOpen(true)}
            aria-label={`View details for ${title}`}
          >
            <img src={image} alt={title} loading="lazy" />
          </button>
          {cardStyle === "featured" && (
            <span className="dish_badge">Featured</span>
          )}
        </div>

        <div className="dish_body">
          <div
            className="dish_rating"
            aria-label={`Rated ${Number(rating) || 0} out of 5`}
          >
            {renderRatingIcons(rating)}
          </div>
          <h3 className="dish_title">
            <button type="button" onClick={() => setOpen(true)}>
              {title}
            </button>
          </h3>
          {cardStyle !== "compact" && <p className="dish_desc">{paragraph}</p>}
          <div className="dish_footer">
            <span className="dish_price">\${Number(price).toFixed(2)}</span>
            {showAddToCart && addButton()}
          </div>
        </div>
      </article>

      <Modal
        show={open}
        onHide={() => setOpen(false)}
        centered
        size="lg"
        className="dish_modal"
        aria-labelledby={`dish-${id}`}
      >
        <Modal.Body className="p-0">
          <button
            type="button"
            className="dish_modal_close"
            onClick={() => setOpen(false)}
            aria-label="Close"
          >
            <i className="bi bi-x-lg" aria-hidden="true" />
          </button>
          <div className="dish_modal_grid">
            <div className="dish_modal_img">
              <img src={image} alt={title} />
            </div>
            <div className="dish_modal_info">
              {category && <span className="dish_cat">{category}</span>}
              <h3 id={`dish-${id}`}>{title}</h3>
              <div className="dish_rating">{renderRatingIcons(rating)}</div>
              <p>{paragraph || "A favourite from our kitchen."}</p>
              <div className="dish_modal_foot">
                <span className="dish_price">\${Number(price).toFixed(2)}</span>
                <div className="d-flex gap-2 align-items-center">
                  {showAddToCart && addButton("dish_add_lg")}
                </div>
              </div>
            </div>
          </div>
        </Modal.Body>
      </Modal>
    </Col>
  );
}

export function DishSkeletons({ count = 6 }) {
  return Array.from({ length: count }, (_, i) => (
    <Col sm={6} lg={4} className="mb-4 d-flex" key={i} aria-hidden="true">
      <div className="dish w-100">
        <div className="skeleton dish_skel_img" />
        <div className="dish_body">
          <div className="skeleton" style={{ height: 14, width: "40%" }} />
          <div
            className="skeleton"
            style={{ height: 24, width: "75%", marginTop: 12 }}
          />
          <div
            className="skeleton"
            style={{ height: 14, width: "95%", marginTop: 12 }}
          />
          <div
            className="skeleton"
            style={{ height: 14, width: "60%", marginTop: 8 }}
          />
        </div>
      </div>
    </Col>
  ));
}

export default Cards;
