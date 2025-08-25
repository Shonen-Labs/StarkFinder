import "./style.css";

const badges = [
    {
        content: "zkTLS verification"
    },
    {
        content: "On-chain credentials"
    },
    {
        content: "AI moderation"
    },
    {
        content: "Open-source"
    },
    {
        content: "Censorship-resistant"
    }
]

export default function Hero() {
  return (
    <div className="hero-section">
      <img className="bg" src="/bg/hero.png" alt="hero-background" />
      <div className="hero-content">
        <div className="left-div">
          <p className="opacity-80 tracking-wide">Honest workplace reviews-</p>
          <h1>anonymous,</h1>
          <h1>verifiable,</h1>
          <h1>on-chain.</h1>
        </div>
        <div className="right-div">
          <p>Share and discover real experiences at web3 companies.</p>
          <p>Your employment is verified privately with zkTLS,</p>
          <p>your identity stays yours.</p>
          <div className="flex justify-end gap-4">
            {badges.map((badge)=>(
            <div className="bg-white/10 backdrop-blur-lg rounded-[24px] badge">
                <p>
                    {badge.content}
                </p>
            </div>
          ))}
          </div>
          
        </div>
        <div className="right-div-alt">
          <p>
            Share and discover real experiences at web3 companies.Your
            employment is verified privately with zkTLS,your identity stays
            yours.{" "}
          </p>
        </div>
      </div>
      <div className="cta">
        <button className="primary-button">
          <img className="bg" src="/bg/button.png" alt="" />
          Connect Wallet
        </button>
        <button className="secondary-button flex w-full h-full items-center justify-center bg-white/20 backdrop-blur-lg border border-white/10 overflow-hidden  rounded-[24px]">
          Browse
        </button>
      </div>
      <div className="micro">
        <p>No emails. No trackers. Proof, not profiles.</p>
      </div>
    </div>
  );
}
