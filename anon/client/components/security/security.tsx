import "./style.css";

export default function Security() {
  return (
    <div className="security -z-99">
      <div className="bg-img -z-99 bg-black">
        
      </div>
      <div className="privacy-bg-text ">
        <h1>Privacy</h1>
      </div>

      {/*CArds */}
      <div className="security-cards z-10">
        <div className="card-one backdrop-blur-md">
          <h1>What we verify</h1>
          <p>
            That you can prove affiliation with a company domain or source—cryptographically.
          </p>
          <div className="bg-img -z-99">
            <img src="/bg/card-1.png" alt="" />
          </div>
        </div>
        <div className="card-two backdrop-blur-md">
          <h1>What we don't collect</h1>
          <p>
            Emails, names, or IP addresses that can identify you. No third-party trackers.
          </p>
          <div className="bg-img -z-99">
            <img src="/bg/card-2.png" alt="" />
          </div>
        </div>
        <div className="card-three backdrop-blur-md">
          <h1>How we store</h1>
          <p>
            Review text is content-addressed; public copies remain, private raw text stays encrypted for moderation only.
          </p>
          <div className="bg-img -z-99">
            <img src="/bg/card-2.png" alt="" />
          </div>
        </div>
        <div className="card-four backdrop-blur-md">
          <h1>Disclosures and audit</h1>
          <p>
            We publish security reports and welcome responsible disclosures at security@yourdomain.
          </p>
          <div className="bg-img -z-99">
            <img src="/bg/card-3.png" alt="" />
          </div>
        </div>
      </div>
    </div>
  );
}
