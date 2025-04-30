"use client";

import {
  Hero,
  Header,
  Feature,
  Footer,
  Offer,
  Question,
} from '@/components/landing/home'

import FloatingSidebar from "../components/playground/floatingWindow/FloatingSidebar"; 


// import FloatingSidebar from "../components/playground/floatingWindow/FloatingSidebar"; 


export default function HomePage() {
  // Create a function to handle adding blocks
  // const handleAddBlock = (block) => {
  //   console.log("Block added:", block);
  //   // Here you can implement the logic to add the block to your application
  // };
  
  return (
    <>
      <Header />
      <main>
        <Hero />
        <Feature />
        <Offer />
        <Question />
      </main>
      <Footer />
      {/* <FloatingSidebar addBlock={handleAddBlock} /> */}
    </>
  )
}
