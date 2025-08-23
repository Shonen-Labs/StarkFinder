import Link from 'next/link'
import { XIcon, TelegramIcon, GithubIcon } from '@/components/icons'
import { MotionBox } from './motion-box'

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

export function Footer() {
  return (
    <footer className="bg-footer-background text-footer-text pt-20 px-5 pb-10">
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
              className="hover:text-footer-linkHover transition-colors"
              target={subItem.target}
              rel={subItem.rel}
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
            className="cursor-pointer text-footer-link hover:text-footer-linkHover [&_path]:hover:fill-grayscale-100 [&_path]:transition-colors"
            role="menuitem"
            target={social.target}
            rel={social.rel}
          >
            <social.icon />
          </Link>
        ))}
      </div>
    </div>
  )
}

const menuItems: MenuSection[] = [
  {
    title: 'Navigation',
    subItems: [
      { name: 'About', url: '/about' },
      { name: 'Docs', url: 'https://docs.starkfinder.xyz', target: '_blank', rel: 'noopener noreferrer' },
      { name: 'Terms of Service', url: '/terms' },
      { name: 'Privacy Policy', url: '/privacy' },
    ],
  },
  {
    title: 'Community',
    subItems: [
      { name: 'GitHub', url: 'https://github.com/Shonen-Labs/StarkFinder', target: '_blank', rel: 'noopener noreferrer' },
      { name: 'X (Twitter)', url: 'https://x.com/StrkFinder', target: '_blank', rel: 'noopener noreferrer' },
      { name: 'Discord', url: 'https://discord.gg/your-discord-link', target: '_blank', rel: 'noopener noreferrer' },
    ],
  },
];

const socialMedia: SocialMediaItem[] = [
  { name: 'X', icon: XIcon, href: 'https://x.com/StrkFinder', target: '_blank', rel: 'noopener noreferrer' },
  { name: 'Github', icon: GithubIcon, href: 'https://github.com/Shonen-Labs/StarkFinder', target: '_blank', rel: 'noopener noreferrer' },
  { name: 'Telegram', icon: TelegramIcon, href: 'https://t.me/shogenlabs/', target: '_blank', rel: 'noopener noreferrer' },
  { name: 'Discord', icon: XIcon, href: 'https://discord.gg/your-discord-link', target: '_blank', rel: 'noopener noreferrer' }, // Replace XIcon with DiscordIcon if available
];
