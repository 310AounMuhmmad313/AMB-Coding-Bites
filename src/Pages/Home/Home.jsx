import React from "react";
import Layout from "../../components/layouts/layouts";
import "./HomeStyle.css";
import Section1 from "./Section1";
import Section2 from "./Section2";
import Section3 from "./Section3";
import Section4 from "./Section4";
import Section5 from "./Section5";
import Section7 from "./Section7";

const Home = () => {
  return (
    <Layout>
      <Section1 />
      <Section3 />
      <Section2 />
      <Section4 />
      <Section5 />
      <Section7 />
    </Layout>
  );
};

export default Home;
