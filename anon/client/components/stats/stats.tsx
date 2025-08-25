import "./style.css";

const stats = [
  {
    name: "Trusted by".toUpperCase(),
    stats: "1000+ users",
  },
  {
    name: "Contributors".toUpperCase(),
    stats: "25+",
  },
  {
    name: "Companies reviewed".toUpperCase(),
    stats: "100+",
  },
];

export default function Stats() {
  const isMobile = window.innerWidth < 1200;

  return (
    <div className="flex items-center  justify-center">
      {isMobile ? (
        <div className="mobile-stats ">
          {stats.map((stat) => (
            <div className="flex items-center justify-between">
              <p>{stat.name}</p>
              <h1>{stat.stats}</h1>
            </div>
          ))}
        </div>
      ) : (
        <div className="desktop-stats  grid grid-cols-3 ">
          {stats.map((stat) => (
            <div className="flex items-center gap-4">
              <h1>{stat.name}</h1>
              <h1 className="font-bold">{stat.stats}</h1>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
