import Link from "next/link";
import Accordion from "@/components/devx/contracts/Accordion";

export default function Sidebar() {
  return (
    <div className="flex flex-col max-w-48 fixed ">
      <div>
        <Link href="/devx">
          <h1 className="text-3xl font-medium pb-4">DevXStark</h1>
        </Link>
        <Link href="/devx/contracts">
          <h1 className="text-lg font-medium pb-4">Introduction</h1>
        </Link>
      </div>
      <Accordion />
    </div>
  );
}
