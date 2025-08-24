"use client"

import Header from "@/components/Header"
import { Feature, Hero, Offer, Question } from "@/components/landing/home"
import { Footer } from "@/components/landing/home/footer"

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