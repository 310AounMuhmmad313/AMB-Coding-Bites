import React, { useEffect } from "react";
import Header from "../layouts/Header";
import Footer from "../layouts/footer";
import "./Cards.css";

const Layout = ({ children }) => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <>
      <Header />
      <main id="main" className="page_enter">
        {children}
      </main>
      <Footer />
    </>
  );
};

export default Layout;
