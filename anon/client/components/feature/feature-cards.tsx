"use client";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
gsap.registerPlugin(useGSAP, ScrollTrigger);
import "./style.css";
import { useRef } from "react";
import Copy from "../ui/Copy";

const features = [
  {
    heading: "verified anonymity",
    content:
      "Your posts are unlinkable to you. Employment is proven with zero-knowledge proofs, not personal data.",
  },
  {
    heading: "On-Chain Integrity",
    content:
      "Reviews are content-addressed and anchored on-chain for integrity and availability.",
  },
  {
    heading: "AI Safety Layer",
    content:
      "Automatic PII redaction, toxicity checks, and brigading detection keep discourse useful.",
  },
  {
    heading: "Summaries & Search",
    content:
      "Company-level pros/cons, theme extraction, and semantic search to cut through noise.",
  },
  {
    heading: "Fair Posting Rules",
    content:
      "One verified reviewer per company context, rate limits, and transparent community guidelines.",
  },
  {
    heading: "Open & Extensible",
    content:
      "Open-source core, subgraph indexing, and APIs for research and audits.",
  },
];

export default function FeatureCards() {
  return (
    <div className="features ">
      <div className="grid grid-cols-6 gap-[24px] h-full">
        <div className="col-span-1 feature-card-title">
          <h1>Features</h1>
          <img className="card-bg" src="/bg/card-bg-4.png" alt="" />
        </div>
        <div className="col-span-3 feature-card backdrop-blur-xl">
          <Copy>
            <h1>{features[0].heading}</h1>
            <p>{features[0].content}</p>
          </Copy>

          <img className="card-bg" src="/bg/card-bg-2.png" alt="" />
        </div>
        <div className="col-span-2 feature-card backdrop-blur-xl ">
          <Copy>
            <h1>{features[1].heading}</h1>
            <p className="text-foreground/40">{features[1].content}</p>
          </Copy>

          <img className="card-bg" src="/bg/card-bg-4.png" alt="" />
        </div>
      </div>

      <div className="grid grid-cols-5 gap-[24px] h-full">
        <div className="col-span-2 feature-card backdrop-blur-xl">
          <Copy>
            <h1>{features[2].heading}</h1>
            <p>{features[2].content}</p>
          </Copy>

          <img className="card-bg-alt" src="/bg/card-2.png" alt="" />
        </div>
        <div className="col-span-3 backdrop-blur-xl feature-card">
          <Copy>
            <h1>{features[4].heading}</h1>
            <p>{features[4].content}</p>
          </Copy>

          <img className="card-bg-alt" src="/bg/card-3.png" alt="" />
        </div>
      </div>

      <div className="grid grid-cols-6 gap-[24px] h-full ">
        <div className="col-span-2  feature-card ">
          <Copy>
            <h1>{features[3].heading}</h1>
            <p>{features[3].content}</p>
          </Copy>

          <img className="card-bg-alt" src="/bg/card-2.png" alt="" />
        </div>
        <div className="col-span-4  feature-card">
          <Copy>
            <h1>{features[5].heading}</h1>
            <p>{features[5].content}</p>
          </Copy>

          <img className="card-bg-alt" src="/bg/card-1.png" alt="" />
        </div>
      </div>
    </div>
  );
}
