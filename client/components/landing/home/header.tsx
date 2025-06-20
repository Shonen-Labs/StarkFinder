import { ModalLanding } from "./modal-landing";
import { Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet"

export function Header() {
  return (
    <header className="sticky top-0 mx-3 z-50 pt-3">
      {/* Desktop Header */}
      <div className="hidden md:flex rounded-[12.5rem] max-w-max md:max-w-[55.313rem] mx-auto justify-between items-center p-3 bg-white drop-shadow-[0_4px_44px_rgba(224,227,255,0.73)]">
        <h1 className="text-blue-navy font-bold text-[2rem]">
          StarkFinder
        </h1>
        <nav className="flex gap-11" role="menu">
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
      
      {/* Mobile Header */}
      <div className="md:hidden rounded-[12.5rem] w-full mx-auto flex justify-between items-center p-3 bg-white drop-shadow-[0_4px_44px_rgba(224,227,255,0.73)]">
        <h1 className="text-blue-navy font-bold text-xl">
          StarkFinder
        </h1>
        
        <Sheet>
          <SheetTrigger asChild>
            <Button size="icon" variant="ghost" className="h-9 w-9 hover:bg-gray-50">
              <Menu className="h-5 w-5 text-blue-navy" />
              <span className="sr-only">Open menu</span>
            </Button>
          </SheetTrigger>
          
          <SheetContent 
            side="right" 
            className="w-full sm:w-[350px] p-0 bg-gradient-to-b from-blue-50 to-white border-none"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-blue-100 bg-white/80 backdrop-blur-sm">
              <h2 className="text-blue-navy font-bold text-xl">
                StarkFinder
              </h2>
              <SheetClose asChild>
                <Button size="icon" variant="ghost" className="h-9 w-9 hover:bg-blue-100">
                  <X className="h-5 w-5 text-blue-navy" />
                  <span className="sr-only">Close menu</span>
                </Button>
              </SheetClose>
            </div>
            
            {/* Navigation */}
            <div className="p-6 flex-1">
              <nav className="space-y-2" role="menu">
                {menuItems.map((item, index) => (
                  <SheetClose asChild key={`${index}-${item.name}`}>
                    <a
                      href={item.href}
                      className="flex items-center w-full px-4 py-4 text-gray-700 hover:text-orange-bright hover:bg-white/60 hover:shadow-sm rounded-xl transition-all duration-200 font-medium text-lg"
                      role="menuitem"
                    >
                      {item.name}
                    </a>
                  </SheetClose>
                ))}
              </nav>
              
              {/* CTA Button - Closer to navigation */}
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
  { name: "How It Works", href: "#offer" },
  { name: "Our Features", href: "#feature" },
  { name: "FAQ", href: "#faq" },
];
