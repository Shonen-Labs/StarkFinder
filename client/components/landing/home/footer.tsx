import Link from 'next/link'
import { XIcon, TelegramIcon, GithubIcon } from '@/components/icons'
import { MotionBox } from './motion-box'

export function Footer() {
  return (
    <footer className="bg-blue-dark text-white pt-20 px-5 pb-10">
      <div className="max-w-[70.75rem] mx-auto">
        <div className="flex flex-col md:flex-row justify-between gap-16 md:gap-24">
          <MotionBox>
            <InfoFooter />
          </MotionBox>
          <MenuFooter />
        </div>
        <p className="text-sm pt-10 max-md:text-center">
          Copyright <span className="text-base leading-none">&copy; </span>
          StarkFinder 2025 All right reserved
        </p>
      </div>
    </footer>
  )
}

function MenuFooter() {
  return (
    <nav
      className="flex justify-between md:max-w-[39.063rem] w-full"
      role="menu"
    >
      {menuItems.map((menu, index) => (
        <MotionBox
          key={`${index}-${menu.title}`}
          className="flex flex-col gap-5 "
        >
          <h3 className="text-lp-text2 leading-7">{menu.title}</h3>
          {menu.subItems.map((subItem, index) => (
            <Link
              key={`${index}-${subItem.name}`}
              href={subItem.url}
              className="hover:text-white/80 transition-colors"
            >
              {subItem.name}
            </Link>
          ))}
        </MotionBox>
      ))}
    </nav>
  )
}

function InfoFooter() {
  return (
    <div className="flex flex-col gap-6 md:max-w-[20rem] max-md:text-center">
      <h2 className="text-lp-sub2 font-bold">StarkFinder</h2>
      <p className="text-grayscale-400">
        The only platform you need for all things Starknet
      </p>
      <div className="flex items-center max-md:justify-center gap-6">
        {socialMedia.map((social, index) => (
          <Link
            key={`${index}-${social.name}`}
            href={social.href}
            className="cursor-pointer [&_path]:hover:fill-grayscale-100 [&_path]:transition-colors"
            role="menuitem"
          >
            <social.icon />
          </Link>
        ))}
      </div>
    </div>
  )
}

const menuItems = [
  {
    title: 'Site Map',
    subItems: [
      { name: 'Home', url: '/' },
      { name: 'Launch TG Bot', url: '#' },
      { name: 'About', url: '#' },
    ],
  },
  {
    title: 'Company',
    subItems: [
      { name: 'Help & Support', url: '#' },
      { name: 'Terms of Service', url: '#' },
      { name: 'Privacy Policy', url: '#' },
    ],
  },
  {
    title: 'Resource',
    subItems: [
      { name: 'Partner', url: '#' },
      { name: 'Blog', url: '#' },
      { name: 'Newsletter', url: '#' },
    ],
  },
]

const socialMedia = [
  { name: 'Twitter', icon: XIcon, href: '#' },
  { name: 'Github', icon: GithubIcon, href: '#' },
  { name: 'Telegram', icon: TelegramIcon, href: '#' },
]
