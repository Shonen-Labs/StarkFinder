"use client";
import { Minus, Plus } from "lucide-react";
import { useState } from "react";

export default function Accordion({
  item,
  index,
}: {
  item: { name: string; description: string };
  index: number;
}) {
  const [toggle, setToggle] = useState<any>(null);
  return (
    <div className="w-full overflow-hidden relative flex flex-col p-1 border border-[#152329]">
      <div
        onClick={() => setToggle(toggle !== index ? index : false)}
        className="w-full cursor-pointer min-h-[50px] p-6 flex items-center justify-between gap-2"
      >
        <div className="flex-1 text-lg flex items-center gap-4 lg:text-xl text-white">
          <span>0{index + 1}</span>
          {item?.name}
        </div>
        <div className="w-[70px] rounded-sm text-white bg-[#152329] h-[70px] flex items-center justify-center">
          {toggle !== index ? <Plus /> : <Minus />}
        </div>
      </div>
      <div
        style={{
          transition: "all .4s",
        }}
        className={`w-full ${
          toggle === index ? "max-h-[30rem]" : "max-h-[0]"
        } flex items-center overflow-hidden relative justify-between gap-2`}
      >
        <div className="px-6 pb-6 w-full">
          <p className="text-base leading-loose font-light text-[#eee]">
            {item.description}
          </p>
        </div>
      </div>
    </div>
  );
}
