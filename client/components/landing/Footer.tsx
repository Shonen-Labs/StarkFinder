import Image from "next/image";
export default function Footer() {
  return (
    <div className="relative py-20 md:py-32 bg-[#080B2A] w-full">
      <div className="w-[90%] max-w-[1000px] mx-auto h-full flex flex-col gap-8">
        <div className="w-full flex md:flex-row flex-col items-start gap-12">
          <div className="flex flex-col gap-6">
            <h4 className="text-2xl lg:text-3xl text-white font-bold">StarkFinder</h4>
            <span className="text-sm text-[#D0D6E0]">
              The only platform you need for all things Starknet
            </span>
            <div className="flex items-center gap-4">
              <Image
                width={24}
                height={24}
                src={"/social_icon_1.png"}
                alt="social_icon_1"
                className="w-[24px] h-[24px]"
              />
              <Image
                width={24}
                height={24}
                src={"/social_icon_2.png"}
                alt="social_icon_1"
                className="w-[24px] h-[24px]"
              />{" "}
              <Image
                width={24}
                height={24}
                src={"/social_icon_3.png"}
                alt="social_icon_1"
                className="w-[24px] h-[24px]"
              />
            </div>
          </div>
          <div className="flex-1 grid lg:grid-cols-3 gap-8">
            <div className="flex flex-col gap-4">
              <h5 className="text-lg text-white font-bold">Site Map</h5>
              <ul className="flex flex-col gap-4">
                <li className="text-sm text-[#D0D6E0]">Home</li>
                <li className="text-sm text-[#D0D6E0]">Launch TG Bot</li>
                <li className="text-sm text-[#D0D6E0]">About</li>
              </ul>
            </div>
            <div className="flex flex-col gap-4">
              <h5 className="text-lg text-white font-bold">Company</h5>
              <ul className="flex flex-col gap-4">
                <li className="text-sm text-[#D0D6E0]">Help & Support</li>
                <li className="text-sm text-[#D0D6E0]">Terms & Conditions</li>
                <li className="text-sm text-[#D0D6E0]">Privacy Policy</li>
              </ul>
            </div>

            <div className="flex flex-col gap-4">
              <h5 className="text-lg text-white font-bold">Resource</h5>
              <ul className="flex flex-col gap-4">
                <li className="text-sm text-[#D0D6E0]">Partner</li>
                <li className="text-sm text-[#D0D6E0]">Blog</li>
                <li className="text-sm text-[#D0D6E0]">Newsletter</li>
              </ul>
            </div>
          </div>
        </div>
        <span className="text-sm text-[#D0D6E0]">
          StarkFinder 2025 All right reserved
        </span>
      </div>
    </div>
  );
}
