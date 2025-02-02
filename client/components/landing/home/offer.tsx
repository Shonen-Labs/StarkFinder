import Image, { StaticImageData } from 'next/image'
import { Button } from '@/components/ui/button'
import calendar from '@/public/img/calendar.png'
import notification from '@/public/img/notification.png'
import files from '@/public/img/files.png'
import social from '@/public/img/social.png'
import { HeaderSection } from './header-section'
import { SectionBackground } from './section-background'
import {
  CalendarIcon,
  FileIcon,
  IntegrationIcon,
  NotificationIcon,
} from '@/components/icons'
import { MotionBox } from './motion-box'

export function Offer() {
  return (
    <section
      id="offer"
      className="bg-purple scroll-mt-[4rem] px-4 pt-14 pb-[7.25rem] relative"
    >
      <SectionBackground id="particles1" />

      <MotionBox>
        <HeaderSection
          title="What can we offer"
          description=" At StarkFinder, we provide a comprehensive suite of tools and features
          tailored for both users and developers in the Starknet ecosystem"
        />
      </MotionBox>

      <div className="grid max-md:place-items-center grid-cols-1 md:grid-cols-2 gap-4 max-w-[61.625rem] mx-auto overflow-hidden">
        {itemOffer.map((offer, index) => (
          <MotionBox
            key={`${index}-${offer.title}`}
            motionProps={{
              initial: { opacity: 0, x: index % 2 !== 0 ? 40 : -40 },
              whileInView: { opacity: 1, x: 0 },
              transition: { duration: 0.8, delay: 0.2 },
            }}
          >
            <SectionOffer
              title={offer.title}
              description={offer.description}
              src={offer.src}
              icon={offer.icon}
            />
          </MotionBox>
        ))}
      </div>

      <MotionBox
        className="text-center pt-14"
        motionProps={{ initial: { opacity: 0, y: 30 } }}
      >
        <Button size="landing-xl" variant="tertiary">
          Launch App
        </Button>
      </MotionBox>
    </section>
  )
}

export type SectionOfferProps = {
  title: string
  description: string
  src: StaticImageData
  icon: React.ReactNode
}

function SectionOffer({ title, description, src, icon }: SectionOfferProps) {
  return (
    <div className="bg-black-scale-300 border border-[#6a49db] drop-shadow-[0_17px_17px_rgba(0,0,0,0.12)] max-w-[30.313rem] w-full overflow-hidden rounded-2xl">
      <Image src={src} alt={title} quality={100} />

      <div className="flex items-start p-9 gap-5">
        <div className="pt-2">{icon}</div>
        <div>
          <h3 className="font-bold text-2xl leading-9 text-grayscale-300">
            {title}
          </h3>
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
