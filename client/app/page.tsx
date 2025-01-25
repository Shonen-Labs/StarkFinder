import { BentoDemo } from "@/components/landing/BentoGrid";
import { Background } from "@/components/landing/DotPattern";
import { GridPatternDemo } from "@/components/landing/gridbackground";

import { NavbarDemo } from "@/components/landing/Navbar";

export default function Home() {
  return (
    <div>
       <NavbarDemo />
      <Background />
      <BentoDemo />
     
      <GridPatternDemo />
    </div>);
}
