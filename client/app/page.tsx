// import { BentoDemo } from "@/components/landing/BentoGrid";
// import { Background } from "@/components/landing/DotPattern";
// import { GridPatternDemo } from "@/components/landing/gridbackground";
import SmoothScroll from "@/constants/SmoothScroll";

// import NavbarDemo from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import Features from "@/components/landing/Features";
import Offer from "@/components/landing/Offer";
import FAQ from "@/components/landing/FAQ";
import Footer from "@/components/landing/Footer";

export default function Home() {
  return (
    <SmoothScroll>
      <Hero />
      <Features />
      <Offer />
      <FAQ />
      <Footer />
    </SmoothScroll>
  );
}
