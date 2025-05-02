import Link from "next/link";
import Accordion from "@/components/devx/contracts/Accordion";

export default function Sidebar() {
  return (
    <div className="w-64 h-screen bg-[#171849] text-white overflow-y-auto fixed left-0 top-0 bottom-0 z-10">
      <div className="p-4">
        <Link href="/devx" className="block">
          <h1 className="text-3xl font-medium pb-4">DevXStark</h1>
        </Link>
        <Link href="/devx/contracts" className="block">
          <h1 className="text-lg font-medium pb-4">Introduction</h1>
        </Link>
      </div>
      <Accordion />
    </div>
  );
}