import { RocketLaunchIcon } from '@/components/icons'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export function Header() {
  return (
    <header className="sticky top-11 mx-3 z-50">
      <div className="rounded-[12.5rem] max-w-max md:max-w-[55.313rem] max-md:gap-4 mx-auto flex justify-between items-center p-3 bg-white drop-shadow-[0_4px_44px_rgba(224,227,255,0.73)]">
        <h1 className="text-blue-navy font-bold text-[2rem]">StarkFinder</h1>
        <nav className="flex gap-11 max-md:hidden">
          {menuItems.map((item, index) => (
            <Link
              key={`${index}-${item.name}`}
              href={item.href}
              className="text-black hover:text-orange-bright text-base font-bold transition-colors"
            >
              {item.name}
            </Link>
          ))}
        </nav>
        <Button size="landing" variant="primary">
          Launch App
          <RocketLaunchIcon />
        </Button>
      </div>
    </header>
  )
}

const menuItems = [
  { name: 'How It Works', href: '#' },
  { name: 'Our Features', href: '#' },
  { name: 'FAQ', href: '#' },
]
