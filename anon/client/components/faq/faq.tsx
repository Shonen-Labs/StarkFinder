"use client";
import { Accordion } from "./accordion";
import "./style.css";

const items = [
  {
    id: 1,
    title: "Is this really anonymous?",
    content: () => (
      <p>
        Yes. We use zkTLS to verify employment without revealing your identity.
        We don’t store emails, names, or link posts to wallets publicly.
      </p>
    ),
  },
  {
    id: 2,
    title: "Is this really anonymous?",
    content: () => (
      <p>
        Yes. We use zkTLS to verify employment without revealing your identity.
        We don’t store emails, names, or link posts to wallets publicly.
      </p>
    ),
  },
  {
    id: 3,
    title: "What stops fake reviews ?",
    content: () => (
      <p>
        Employment proofs + on-chain gating, AI anomaly detection, and community
        signals reduce spam and brigading.
      </p>
    ),
  },
  {
    id: 4,
    title: "Do I need a wallet ?",
    content: () => (
      <p>
        Yes. Wallets act as your pseudonymous account. You can rotate or use
        fresh wallets.
      </p>
    ),
  },
  {
    id: 5,
    title: "What data do you collect ?",
    content: () => (
      <p>Minimal telemetry. No ad pixels. See our Privacy page for details.</p>
    ),
  },
  {
    id: 6,
    title: "Can I verify past employment ?",
    content: () => (
      <p>
        Yes—choose the timeframe you wish to attest to when proving your
        affiliation.
      </p>
    ),
  },
  {
    id: 7,
    title: "Is this only for web3 ?",
    content: () => (
      <p>We’re web3-first, but not web3-only. Any organization can be added.</p>
    ),
  },
  {
    id: 8,
    title: "How do summaries work ?",
    content: () => (
      <p>
        We use NLP to extract recurring themes and pros/cons from verified
        reviews. No quotes are attributed to individuals.
      </p>
    ),
  },
];

const customSpringConfig = {
  type: "spring",
  stiffness: 200,
  damping: 25,
  mass: 0.5,
};

export default function FAQpage() {
  return (
    <div className="faq-page">
      <div className="page-bg">
        <img src="/bg/faq.png" alt="" />
      </div>
      <div className="faq-grid">
        <div className="flex items-center justify-center">
          <h1>Frequently Asked Questions</h1>
        </div>
        <div className="max-w-[480px] accordion">
          <Accordion
            items={items}
            allowMultiple={false}
            springConfig={customSpringConfig}
            itemClassName="border border-white/5"
          />
        </div>
      </div>
    </div>
  );
}
