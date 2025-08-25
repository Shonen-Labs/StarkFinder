import FeatureCards from "./feature-cards";
import "./style.css";

export default function Feature() {
  return (
    <div className="value-page">
      <div className="value-page-bg">
        <img src="/bg/value.png" />
      </div>
      <FeatureCards/>
    </div>
  );
}
