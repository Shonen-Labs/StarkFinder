import Image, { StaticImageData } from 'next/image'
import { Button } from '@/components/ui/button'
import calendar from '@/public/img/calendar.png'
import notification from '@/public/img/notification.png'
import files from '@/public/img/files.png'
import social from '@/public/img/social.png'

import {
  CalendarIcon,
  FileIcon,
  IntegrationIcon,
  NotificationIcon,
} from '@/components/icons'

export function Offer() {
  return (
    <section className="bg-[#5530d6] px-4 pt-14 pb-[7.25rem]">
      <div className="text-center pb-[2.875rem]">
        <h2 className="text-white font-bold text-lp-sub2 leading-tight">
          What can we offer
        </h2>
        <p className="text-grayscale-600 text-lp-text3 pt-5 md:max-w-[42rem] mx-auto">
          At StarkFinder, we provide a comprehensive suite of tools and features
          tailored for both users and developers in the Starknet ecosystem
        </p>
      </div>

      <div className="grid max-md:place-items-center grid-cols-1 md:grid-cols-2 gap-4 max-w-[61.625rem] mx-auto">
        {itemOffer.map((offer, index) => (
          <SectionOffer
            key={`${index}-${offer.title}`}
            title={offer.title}
            description={offer.description}
            src={offer.src}
            icon={offer.icon}
          />
        ))}
      </div>

      <div className="text-center pt-14">
        <Button size="landing-xl" variant="tertiary">
          Launch App
        </Button>
      </div>
    </section>
  )
}

type SectionOfferProps = {
  title: string
  description: string
  src: StaticImageData
  icon: React.ReactNode
}

function SectionOffer({ title, description, src, icon }: SectionOfferProps) {
  return (
    <div className="bg-grayscale-900 max-w-[30.313rem] w-full rounded-2xl drop-shadow-[0_17px_17px_rgba(0,0,0,0.12)]">
      <Image src={src} alt={title} quality={100} sizes="100vw" />

      <div className="flex items-start p-9 gap-5">
        <div className="pt-2">{icon}</div>
        <div>
          <h3 className="font-bold text-2xl leading-9">{title}</h3>
          <p className="font-medium text-lp-text2 text-grayscale-800">
            {description}
          </p>
        </div>
      </div>
    </div>
  )
}

const itemOffer = [
  {
    title: 'Save your files',
    description: 'We automatically save your files as you type.',
    src: files,
    icon: <FileIcon />,
  },
  {
    title: 'Notification',
    description: 'Get notified when something new comes up.',
    src: notification,
    icon: <NotificationIcon />,
  },
  {
    title: 'Calendar',
    description: 'Use calendar to filter your files by date',
    src: calendar,
    icon: <CalendarIcon />,
  },
  {
    title: 'Integration',
    description: 'Integrate seamlessly with other apps',
    src: social,
    icon: <IntegrationIcon />,
  },
]
