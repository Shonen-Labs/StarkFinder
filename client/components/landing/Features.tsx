import Image from "next/image";
const featureListData = [
  {
    name: "AI-Powered Matching",
    width: 524,
    height: 300,
    image: "/feature_image_1.png",
    description:
      "Leverage advanced artificial intelligence to connect users with precision and personalization. Our intelligent matching algorithm analyzes user profiles, preferences, and interaction patterns to create meaningful, targeted connections across multiple domains.",
  },
  {
    name: "Secure Blockchain Payments",
    width: 600,
    height: 491,
    image: "/feature_image_2.png",
    description:
      "Utilize cutting-edge blockchain technology to ensure transparent, secure, and instantaneous financial transactions. Our platform provides end-to-end encryption and decentralized payment mechanisms that protect user funds and transaction integrity.",
  },
  {
    name: "Real-Time Collaboration Tools",
    width: 300,
    height: 300,
    image: "/feature_image_3.png",
    description:
      "Empower seamless teamwork with dynamic, interactive collaboration features. Users can communicate, share resources, and work together simultaneously through integrated communication channels, document sharing, and live editing capabilities.",
  },
];
export default function Features() {
  return (
    <div className="relative py-20 md:py-32 w-full bg-[#7e3dff] min-h-[500px]">
      {/* <Image
        fill
        src={"/feature_title.png"}
        alt={"starkfinder_background_stars"}
        className="w-full h-full z-20 absolute top-0 left-0"
      /> */}
      <div className="w-full h-full z-30 flex items-center justify-center">
        <div className="w-[90%] max-w-[1000px] mx-auto h-full flex flex-col lg:items-center lg:justify-center gap-20 ">
          {/* <h2 className=" text-3xl lg:text-6xl lg:text-center font-bold text-[#FFAE63]">
            Our Features
          </h2> */}
          <Image
            width={426}
            height={131}
            src={"/feature_title.png"}
            alt={"starkfinder_background_stars"}
            className="w-[426px] h-[130px] z-20 "
          />
          <div className="flex flex-col gap-8">
            {featureListData?.map((data, index) => {
              return (
                <div
                  key={index}
                  className={`w-full ${index %2===0 ?"md:flex-row ":"md:flex-row"} flex flex-col justify-between lg:items-center gap-20`}
                >
                  <div className="relative max-w-[400px] min-h-[200px] md:min-h-[400px] flex-2">
                    <img
                      // fill
                      src={data?.image}
                      alt={"starkfinder_features"}
                      className="w-full object-cover h-full z-20"
                    />
                  </div>
                  <div className="flex-1 flex items-start flex-col gap-8">
                    <h3 className=" text-3xl lg:text-4xl font-semibold text-[#fff]">
                      {data?.name}
                    </h3>
                    <p className=" text-base lg:text-lg leading-loose font-normal text-[#E1E1E1]">
                      {data?.description}
                    </p>
                    <button className="btn text-base font-normal">
                      Get Started
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
