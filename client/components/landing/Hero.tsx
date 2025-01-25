import Image from "next/image";
import Navbar from "./Navbar";
export default function Hero() {
  return (
    <div className="relative w-full py-8 pb-24 min-h-[500px] flex flex-col gap-20 lg:min-h-[863px]">
      <Image
        fill
        src={"/background.png"}
        alt={"starkfinder_background"}
        className="w-full h-full z-20 absolute top-0 left-0"
      />
      <Navbar />
      <div className="w-full h-full z-30 py-12 relative flex items-center justify-center">
        <div className="w-full max-w-[1000px] mx-auto px-4 h-full z-[100] flex flex-col gap-8 lg:items-center lg:justify-center">
          <Image
            width={70}
            height={70}
            src={"/hero_image_2.png"}
            alt={"starkfinder_background"}
            className="w-[70px] h-[70px] z-20"
          />
          <h2 className="text-4xl lg:text-6xl lg:text-center font-bold text-white">
            StarkFinder: <br />
            Your Ultimate Starknet Hub
          </h2>
          <p className="text-sm lg:text-lg text-[#E1E1E1] lg:max-w-[800px] lg:text-center lg:mx-auto">
            Empowering users and developers to navigate the Starknet ecosystem
            with ease DeFi transactions, smart contracts, and deployments made
            simple.
          </p>
          <div className="w-full flex lg:items-center lg:justify-center">
            <button className="btn text-base font-normal text-white">
              Launch TG Bot
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
