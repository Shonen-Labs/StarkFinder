export const cardInfo = [
  {
    id: "card-0",
    title: "For Job Seekers",
    heading: "Know the culture before you join.",
    content: () => (
      <div>
        <p>Summaries of pros/cons and recurring themes</p>
        <p>
          Semantic search across topics (e.g., “work-life balance”,
          “management”)
        </p>
        <p>Signals over hype: reviews from verified insiders only</p>
      </div>
    ),
    cta: "Find companies",
  },
  {
    id: "card-1",
    title: "For Employees",
    heading: "Say what matters—safely.",
    content: () => (
      <div>
        <p>Anonymous by default; identity never stored</p>
        <p>zkTLS verification proves you belong—without doxxing.</p>
        <p>Optional staking/anti-spam keeps the feed clean</p>
      </div>
    ),
    cta: "Write a review",
  },
  {
    id: "card-2",
    title: "For Teams & Employers",
    heading: "Listen, learn, improve.",
    content: () => (
      <div>
        <p>Aggregate sentiment and topic trends over time.</p>
        <p>Transparent, tamper-resistant feedback you can’t buy.</p>
        <p>Opt-in channels to share responses and improvements.</p>
      </div>
    ),
    cta: "Claim your company page",
  },
];

const Card = ({
  id,
  title,
  heading,
  cta,
  content,
}: {
  id: string;
  title: string;
  heading: string;
  cta: string;
  content: React.JSX.Element;
}) => {
  return (
    <div id={id} className="sticky-card backdrop-blur-2xl rounded-[12px] overflow-hidden bg-white/5">
      <div className="sticky-card-inner ">
        <div className="sticky-card-content">
          <h1>{title}</h1>
          <h2>{heading}</h2>
          {content}
        </div>
        <div className="sticky-card-cta ">
            <button className="cta-button bg-white/5 backdrop-blur-lg  rounded-full">
                {cta}
            </button>
        </div>
      </div>
    </div>
  );
};
export default  Card;