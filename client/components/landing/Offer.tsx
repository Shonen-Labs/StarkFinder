import Image from "next/image";
const featureListData = [
  {
    name: "Save your files",
    subimage: "/sub_offer_1.png",
    image: "/offer_1.png",
    description: "We automatically save your files as you type.",
  },
  {
    name: "Notification",
    subimage: "/sub_offer_2.png",
    image: "/offer_2.png",
    description: "Get notified when something new comes up.",
  },
  {
    name: "Calendar",
    subimage: "/sub_offer_4.png",
    image: "/offer_3.png",
    description: "Use calendar to filter your files by date",
  },
  {
    name: "Integration",
    subimage: "/sub_offer_3.png",
    image: "/offer_4.png",
    description: "Integrate seamlessly with other apps",
  },
];
export default function Features() {
  return (
    <div className="relative py-20 md:py-32 bg-[#5530d6] w-full min-h-[500px]">
      {/* <Image
        fill
        src={"/stars.png"}
        alt={"starkfinder_background_stars"}
        className="w-full h-full z-20 absolute top-0 left-0"
      /> */}
      <div className="w-full h-full z-30 flex items-center justify-center">
        <div className="w-[90%] max-w-[1000px] mx-auto h-full flex flex-col gap-12 ">
          <div className="w-full h-full flex flex-col gap-8 lg:items-center lg:justify-center">
            <h2 className="text-4xl lg:text-5xl lg:text-center font-bold text-white">
              What can we offer
            </h2>
            <p className="text-base text-[#D0D6E0] lg:max-w-[600px] lg:text-center lg:mx-auto">
              At StarkFinder, we provide a comprehensive suite of tools and
              features tailored for both users and developers in the Starknet
              ecosystem
            </p>
          </div>
          <div className="grid lg:grid-cols-2 gap-6">
            {featureListData?.map((data, index) => {
              return (
                <div
                  key={index}
                  className="w-full h-[413px] rounded-xl justify-between flex flex-col p-8 bg-[#121319] gap-8"
                >
                  <div className="relative min-h-[200px] w-full">
                    <Image
                      fill
                      src={data?.image}
                      alt={"starkfinder_features"}
                      className="w-full h-full z-20 object-cover"
                    />
                  </div>
                  <div className="w-full flex items-start gap-4">
                    <Image
                      width={24}
                      height={24}
                      src={data?.subimage}
                      alt={"starkfinder_features"}
                      className="w-[24px] object-cover h-[24px]"
                    />
                    <div className="w-full flex items-start flex-col">
                      <h3 className=" text-xl lg:text-2xl font-semibold text-[#fff]">
                        {data?.name}
                      </h3>
                      <p className=" text-lg lg:text-base font-normal text-[#8A8F98]">
                        {data?.description}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="w-full flex lg:justify-center lg:items-center">
            <button className="btn btn_2 p-3 text-base font-normal">
              Launch App
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
