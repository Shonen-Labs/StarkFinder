import { Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetClose,
  SheetTrigger,
} from "@/components/ui/sheet"
import Link from "next/link";
import { ModalLanding } from "./modal-landing";

export function Header() {
  return (
    <header className="sticky top-3 mx-3 z-50">
      {/* Desktop Header */}
      <div className="hidden md:flex rounded-[12.5rem] max-w-max md:max-w-[55.313rem] mx-auto justify-between items-center py-3 px-6 bg-white/95 backdrop-blur-sm drop-shadow-[0_4px_44px_rgba(224,227,255,0.73)]">
        <h1 className="text-[#172033] font-bold text-[2rem]">
          StarkFinder
        </h1>
        <nav className="flex gap-11" role="menu">
          {menuItems.map((item, index) => (
            <Link
              key={`${index}-${item.name}`}
              href={item.href}
              className="text-black hover:text-[#ff6b35] text-base font-bold transition-colors"
              role="menuitem"
            >
              {item.name}
            </Link>
          ))}
        </nav>
        <ModalLanding />
      </div>

      {/* Mobile Header */}
      <div className="md:hidden rounded-[12.5rem] w-full mx-auto flex justify-between items-center p-3 bg-white/95 backdrop-blur-sm drop-shadow-[0_4px_44px_rgba(224,227,255,0.73)]">
        <h1 className="text-[#172033] font-bold text-xl">
          StarkFinder
        </h1>
        
        <Sheet>
          <SheetTrigger asChild>
            <Button size="icon" className="bg-[#172033] text-white hover:bg-[#172033]/80 h-10 w-10">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Open menu</span>
            </Button>
          </SheetTrigger>
          
          <SheetContent 
            side="right" 
            className="w-full sm:w-[350px] p-0 bg-gradient-to-b from-[#172033] to-[#2a3441] border-none text-white"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-600">
              <h2 className="text-white font-bold text-xl">
                StarkFinder
              </h2>
              <SheetClose asChild>
                <Button size="icon" variant="ghost" className="h-9 w-9 hover:bg-white/10 text-white">
                  <X className="h-5 w-5" />
                  <span className="sr-only">Close menu</span>
                </Button>
              </SheetClose>
            </div>
            
            {/* Navigation */}
            <div className="p-6 flex-1">
              <nav className="space-y-2" role="menu">
                {menuItems.map((item, index) => (
                  <SheetClose asChild key={`${index}-${item.name}`}>
                    <Link
                      href={item.href}
                      className="flex items-center w-full px-4 py-4 text-white hover:text-[#ff6b35] hover:bg-white/10 rounded-xl transition-all duration-200 font-medium text-lg"
                      role="menuitem"
                    >
                      {item.name}
                    </Link>
                  </SheetClose>
                ))}
              </nav>
              
              {/* CTA Button */}
              <div className="mt-8">
                <ModalLanding />
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}

const menuItems = [
  { name: "Home", href: "/" },
  { name: "DevX", href: "/devx" },
  { name: "Example Contracts", href: "/app/contracts" },
];
