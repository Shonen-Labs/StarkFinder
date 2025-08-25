"use client";
import "./style.css";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";
import { useRef } from "react";
gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText);

export default function HowItWorks() {
  const textRef = useRef(null);
  const containerRef = useRef(null);
  const lineRef = useRef(null);

  useGSAP(() => {
    const splitText = SplitText.create(textRef.current, {
      type: "chars, words",
    });

    let scrollText = gsap.timeline({
      scrollTrigger: {
        trigger: containerRef.current,
        start: "-=70%",
        end: "+=100%",
        scrub: 1,
      },
    });

    gsap.set(splitText.chars, {
      opacity: 0.5,
    });

    scrollText.fromTo(
      splitText.chars,
      {
        opacity: 0.5,
      },
      {
        opacity: 1,
        stagger: {
          each: 0.05,
          from: "start",
        },
      }
    );

    gsap.set(lineRef.current, {
      opacity: 0.5,
    });

    let lineAnimation = gsap.timeline({
      scrollTrigger: {
        trigger: containerRef.current,
        start: "-=70%",
        end: "+=100%",
        scrub: 1,
      },
    });

    lineAnimation.fromTo(lineRef.current,{
        opacity:0.5
    },{
        opacity: 1,
    })

    return () => {
      if (splitText) {
        splitText.revert();
      }
    };
  });

  return (
    <div ref={containerRef} className="how-page">
      <img className="bg" src="/bg/how-to.png" alt="" />
      <div className="content ">
        <div className="trailer-container col-span-1">
          <div ref={lineRef} className="trailer" />
        </div>
        <div ref={textRef} className="copy col-span-2">
          <div className="">
            <h1>Step 1 — Prove privately</h1>
            <p>
              Use zkTLS to prove you’re an employee (or ex-employee) of a
              company—without revealing who you are.
            </p>
          </div>
          <div className="w-full">
            <h1>Step 2 — Post anonymously</h1>
            <p>
              Write a free-text review. Our AI redacts PII and flags toxic
              content before it goes live.
            </p>
          </div>
          <div className="w-full">
            <h1>Step 3 — Read the signal</h1>
            <p>
              Explore summaries, trends, and real stories—from people who’ve
              actually been there.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
