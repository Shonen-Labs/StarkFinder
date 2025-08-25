"use client";

import { useGSAP } from "@gsap/react";
import "./style.css";
import { cardInfo } from "./sticky-cards";
import Card from "./sticky-cards";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { useRef } from "react";
gsap.registerPlugin(useGSAP, ScrollTrigger);

export default function Workings() {


  const containerRef = useRef(null);

  useGSAP(()=>{
    const cards = document.querySelectorAll(".sticky-card");
    const totalCards = cards.length;

    gsap.set(cards[0],{y:"0%",scale:1});
    for(let i= 1; i< totalCards;i++){
      gsap.set(cards[i],{y:"100%",scale: 1});
    }

    const scrollTimeline = gsap.timeline({
      scrollTrigger:{
        trigger: containerRef.current,
        start: "top top",
        end:`+=${window.innerHeight * (totalCards - 1)}`,
        pin: true,
        scrub: true,
        pinSpacing: true,
      }
    });

    for(let i =0;i< totalCards - 1;i++){
      const currentCard = cards[i];
      const nextCard =cards[i+1];
      const position = i;

      scrollTimeline.to(currentCard,{
        scale:0.5,
        duration:1,
        ease:"none"
      }, position);

      scrollTimeline.to(nextCard,{
        y: "0%",
        duration: 1,
        ease: "none"
      }, position)
    }

    return () => {
      scrollTimeline.kill();
      ScrollTrigger.getAll().forEach((trigger)=> trigger.kill())
    }
    

  },{scope:containerRef})

  const lenis = new Lenis();
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((time) => {
    lenis.raf(time * 1000);
  });
  gsap.ticker.lagSmoothing(0);

  return (
    <div ref={containerRef} className="working-page -z-99">
      <div className="workings-bg">
        <img src="/bg/working.png" alt="" />
      </div>
      <div className="sticky-cards-section">
        {cardInfo.map((card) => (
          <Card
            key={card.id}
            id={card.id}
            title={card.title}
            heading={card.heading}
            cta={card.cta}
            content={card.content()}
          />
        ))}
      </div>
    </div>
  );
}
