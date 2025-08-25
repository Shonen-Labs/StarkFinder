import gsap from "gsap";
import { SplitText } from "gsap/SplitText";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import React, { useRef } from "react";

gsap.registerPlugin(SplitText, ScrollTrigger);

interface CopyProps {
  children: React.ReactNode;
  animateOnScroll?: boolean;
  delay?: number;
}

export default function Copy({
  children,
  animateOnScroll = true,
  delay = 0,
}: CopyProps) {
  const containerRef = useRef<HTMLDivElement | HTMLElement | null>(null);
  const elementRef = useRef<HTMLElement[]>([]);
  const splitRef = useRef<any[]>([]);
  const lines = useRef<HTMLElement[]>([]);

  useGSAP(
    () => {
      if (!containerRef.current) return;
      splitRef.current = [];
      elementRef.current = [];
      lines.current = [];

      let elements: HTMLElement[] = [];
      if (
        (containerRef.current as HTMLElement).hasAttribute("data-copy-wrapper")
      ) {
        elements = Array.from(
          (containerRef.current as HTMLElement).children
        ) as HTMLElement[];
      } else {
        elements = [containerRef.current as HTMLElement];
      }

      elements.forEach((element) => {
        elementRef.current.push(element);

        const split = SplitText.create(element, {
          type: "lines",
          mask: "lines",
        });
        splitRef.current.push(split);

        const computedStyle = window.getComputedStyle(element);
        const textIndent = computedStyle.textIndent;

        if (textIndent && textIndent !== "0px") {
          if (split.lines.length > 0) {
            (split.lines[0] as HTMLElement).style.paddingLeft = textIndent;
          }
          element.style.textIndent = "0";
        }
        lines.current.push(...split.lines);
      });

      gsap.set(lines.current, {
        y: "100%",
      });
      const animationProps = {
        y: "0%",
        duration: 1,
        stagger: 0.1,
        ease: "power4.out",
        delay: delay,
      };
      if (animateOnScroll) {
        gsap.to(lines.current, {
          ...animationProps,
          scrollTrigger: {
            trigger: containerRef.current,
            start: "top 75%",
            once: true,
          },
        });
      } else {
        gsap.to(lines.current, animationProps);
      }

      return () => {
        splitRef.current.forEach((split) => {
          if (split) {
            split.revert();
          }
        });
      };
    },
    {
      scope: containerRef,
      dependencies: [animateOnScroll, delay],
    }
  );

  if (React.Children.count(children) === 1 && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement, {
      ref: containerRef,
    });
  }
  return (
    <div ref={containerRef} data-copy-wrapper="true">
      {children}
    </div>
  );
}