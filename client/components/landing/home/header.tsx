import { ModalLanding } from "./modal-landing";
import { Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

export function Header() {
  return (
    <header className="sticky top-11 mx-3 z-50">
      <div className="md:flex hidden rounded-[12.5rem] max-w-max md:max-w-[55.313rem] max-md:gap-4 mx-auto  justify-between items-center p-3 bg-white drop-shadow-[0_4px_44px_rgba(224,227,255,0.73)]">
        <h1 className="text-blue-navy font-bold [@media(max-width:25.688rem)]:text-2xl text-[2rem]">
          StarkFinder
        </h1>
        <nav className="flex gap-11 max-md:hidden" role="menu">
          {menuItems.map((item, index) => (
            <a
              key={`${index}-${item.name}`}
              href={item.href}
              className="text-black hover:text-orange-bright text-base font-bold transition-colors"
              role="menuitem"
            >
              {item.name}
            </a>
          ))}
        </nav>

        <ModalLanding />
      </div>
      <div className=" md:hidden  rounded-[12.5rem] w-full  mx-auto flex justify-between items-center p-3 bg-white drop-shadow-[0_4px_44px_rgba(224,227,255,0.73)]">
        <h1 className="text-blue-navy font-bold [@media(max-width:25.688rem)]:text-2xl text-[2rem]">
          StarkFinder
        </h1>
        <Sheet>
      <SheetTrigger asChild>
      <Button  size="icon"  variant="ghost">
          <Menu className="h-4 w-4" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle> StarkFinderrr</SheetTitle>
          <SheetDescription>Browse through our website sections</SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-4 py-6">
         
        <nav className="flex flex-col gap-2" role="menu">
          {menuItems.map((item, index) => (
            <a
              key={`${index}-${item.name}`}
              href={item.href}
              className="text-black hover:text-orange-bright text-base font-bold transition-colors"
              role="menuitem"
            >
              {item.name}
            </a>
          ))}
        </nav>
        </div>
        <SheetFooter>
        <ModalLanding />
          
        </SheetFooter>
      </SheetContent>
    </Sheet>

      </div>
    </header>
  );
}

const menuItems = [
  { name: "How It Works", href: "#offer" },
  { name: "Our Features", href: "#feature" },
  { name: "FAQ", href: "#faq" },
];
