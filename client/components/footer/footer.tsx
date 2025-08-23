import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Card } from '@/components/ui/card'
import { XIcon, TelegramIcon, GithubIcon } from '@/components/icons'

interface MenuItem {
  name: string
  url: string
  target?: string
  rel?: string
}

interface MenuSection {
  title: string
  subItems: MenuItem[]
}

interface SocialMediaItem {
  name: string
  icon: React.ComponentType
  href: string
  target?: string
  rel?: string
}

function DevXFooter() {
  return (
    <footer className="border-t border-slate-700 bg-gradient-to-b from-slate-900 to-slate-950 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 lg:gap-8">
          {/* Brand Section */}
          <div className="md:col-span-1">
            <InfoFooter />
          </div>
          
          {/* Menu Sections */}
          <div className="md:col-span-3">
            <MenuFooter />
          </div>
        </div>
        
        <Separator className="my-6 bg-slate-700" />
        
        {/* Copyright */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <p className="text-slate-400">
              © {new Date().getFullYear()} StarkFinder. All rights reserved.
            </p>
          </div>
          <div className="flex items-center gap-6">
            <Link 
              href="/terms" 
              className="text-slate-400 hover:text-white transition-colors hover:underline underline-offset-4"
            >
              Terms of Service
            </Link>
            <Link 
              href="/privacy" 
              className="text-slate-400 hover:text-white transition-colors hover:underline underline-offset-4"
            >
              Privacy Policy
            </Link>
            <Link 
              href="/cookies" 
              className="text-slate-400 hover:text-white transition-colors hover:underline underline-offset-4"
            >
              Cookies
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

function MenuFooter() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
      {menuItems.map((menu, index) => (
        <Card key={`${index}-${menu.title}`} className="p-4 border-0 bg-transparent shadow-none">
          <div className="space-y-3">
            <h3 className="font-semibold text-white text-base">{menu.title}</h3>
            <nav className="space-y-2">
              {menu.subItems.map((subItem, subIndex) => (
                <Link
                  key={`${subIndex}-${subItem.name}`}
                  href={subItem.url}
                  className="group flex items-center gap-2 text-sm text-slate-300 hover:text-white transition-all duration-200 hover:translate-x-1"
                  target={subItem.target}
                  rel={subItem.rel}
                >
                  <div className="w-1 h-1 rounded-full bg-slate-600 group-hover:bg-blue-400 transition-colors" />
                  {subItem.name}
                </Link>
              ))}
            </nav>
          </div>
        </Card>
      ))}
    </div>
  )
}

function InfoFooter() {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-white">StarkFinder</h2>
        <p className="text-sm text-slate-300 leading-relaxed max-w-sm">
          The comprehensive platform for Starknet developers and enthusiasts. Build, explore, and manage your blockchain journey.
        </p>
      </div>
      
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-slate-200">Follow Us</h3>
        <div className="flex items-center gap-2">
          {socialMedia.map((social, index) => (
            <Button
              key={`${index}-${social.name}`}
              variant="outline"
              size="icon"
              asChild
              className="h-9 w-9 border-slate-600 bg-slate-800 hover:bg-slate-700 hover:border-slate-500 transition-all duration-200 text-slate-300 hover:text-white [&>svg]:h-4 [&>svg]:w-4"
            >
              <Link
                href={social.href}
                target={social.target}
                rel={social.rel}
                aria-label={`Follow us on ${social.name}`}
                className="flex items-center justify-center"
              >
                <social.icon />
              </Link>
            </Button>
          ))}
        </div>
      </div>
      
      <div className="pt-1">
        <p className="text-xs text-slate-500">
          Built for the Starknet community
        </p>
      </div>
    </div>
  )
}

const menuItems: MenuSection[] = [
  {
    title: 'Platform',
    subItems: [
      { name: 'Dashboard', url: '/devx' },
      { name: 'Profile', url: '/devx/profile' },
      { name: 'Contracts', url: '/devx/contracts' },
      { name: 'Resources', url: '/devx/resources' },
      { name: 'Transactions', url: '/devx/transactions' },
    ],
  },
  {
    title: 'Developer',
    subItems: [
      { name: 'Documentation', url: '/docs' },
      { name: 'API Reference', url: '/api-docs' },
      { name: 'SDK', url: '/sdk' },
      { name: 'Examples', url: '/examples' },
    ],
  },
  {
    title: 'Community',
    subItems: [
      { name: 'Twitter', url: 'https://x.com/StrkFinder', target: '_blank', rel: 'noopener noreferrer' },
      { name: 'GitHub', url: 'https://github.com/Shonen-Labs/StarkFinder', target: '_blank', rel: 'noopener noreferrer' },
      { name: 'Telegram', url: 'https://t.me/starkfinder_bot/', target: '_blank', rel: 'noopener noreferrer' },
      { name: 'Help & Support', url: '/support' },
    ],
  },
]

const socialMedia: SocialMediaItem[] = [
  { 
    name: 'Twitter', 
    icon: XIcon, 
    href: 'https://x.com/StrkFinder', 
    target: '_blank', 
    rel: 'noopener noreferrer' 
  },
  { 
    name: 'GitHub', 
    icon: GithubIcon, 
    href: 'https://github.com/Shonen-Labs/StarkFinder', 
    target: '_blank', 
    rel: 'noopener noreferrer' 
  },
  { 
    name: 'Telegram', 
    icon: TelegramIcon, 
    href: 'https://t.me/starkfinder_bot/', 
    target: '_blank', 
    rel: 'noopener noreferrer' 
  },
]

export { DevXFooter }