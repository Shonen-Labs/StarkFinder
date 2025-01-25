"use client";
import React, { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { slideup, LargeSlideup } from "@/constants/framer";

// animattions to staggerText
const AnimateTextWord = ({ children, type }: { children: React.ReactNode, type?: string }) => {
  const AnimateTextRef = useRef(null);
  const inView = useInView(AnimateTextRef, {
    margin: "0px 100px -120px 0px",
    once: true
  });
  const text = typeof children === "string" ? children : "";
  if (type === "bigtext") {
    return (
      <span
        ref={AnimateTextRef}
        className="flex gap-x-[4px] gap-y-[3px] flex-wrap w-full items-center relative"
      >
        {text?.split(" ")?.map((data: string, index: number) => {
          return (
            <div key={index} className="inline-flex hide relative">
              <motion.span
                variants={LargeSlideup}
                custom={index}
                initial="initial"
                animate={inView ? "animate" : "exit"}
              >
                {data === " " ? "\u00A0" : data}
              </motion.span>
            </div>
          );
        })}
      </span>
    );
  }
  if (type === "bigtext_Center") {
    return (
      <span
        ref={AnimateTextRef}
        className="flex lg:inline-block gap-[4px] flex-wrap w-full items-center lg:space-x-[10px] lg:items-center relative"
      >
        {text?.split(" ")?.map((data: string, index: number) => {
          return (
            <div key={index} className="inline-flex hide relative">
              <motion.span
                variants={LargeSlideup}
                custom={index}
                initial="initial"
                animate={inView ? "animate" : "exit"}
              >
                {data === " " ? "\u00A0" : data}
              </motion.span>
            </div>
          );
        })}
      </span>
    );
  }
  return (
    <span
      ref={AnimateTextRef}
      className="flex gap-x-[5px] gap-y-[2px] flex-wrap w-full items-center relative"
    >
      {text?.split(" ")?.map((data: string, index: number) => {
        return (
          <div key={index} className="inline-flex  hide relative">
            <motion.span
              variants={slideup}
              custom={index}
              initial="initial"
              animate={inView ? "animate" : "exit"}
            >
              {data === " " ? "\u00A0" : data}
            </motion.span>
          </div>
        );
      })}
    </span>
  );
};

export default AnimateTextWord;