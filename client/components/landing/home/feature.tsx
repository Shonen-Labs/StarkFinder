import Image, { StaticImageData } from 'next/image'
import { Button } from '@/components/ui/button'
import secure from '@/public/img/secure-blockchain.png'
import ai from '@/public//img/ai-powered.png'
import realTime from '@/public/img/real-time.png'
import { cn } from '@/lib/utils'

export function Feature() {
  return (
    <section className="pt-[6rem] bg-[#7e3dff] px-4">
      <h2 className="text-orange-bright font-bold text-lp-h2 leading-none text-center mb-[8.875rem]">
        Our Features
      </h2>
      <div className="max-w-[75rem] mx-auto">
        {itemFeatures.map((feature, index) => (
          <FeatureSection
            key={`${index}-${feature.title}`}
            title={feature.title}
            description={feature.description}
            image={feature.img}
            position={feature?.position as 'left' | 'right'}
          />
        ))}
      </div>
    </section>
  )
}

type FeatureSectionProps = {
  title: string
  description: string
  image: StaticImageData
  textButton?: string
  position?: 'left' | 'right'
}

function FeatureSection({
  title,
  description,
  textButton = 'Get started',
  image,
  position = 'left',
}: FeatureSectionProps) {
  const section = (
    <div className="max-w-[32.875rem]">
      <h3 className="font-black text-lp-sub2 text-white pb-3">{title}</h3>
      <p className="pb-6 text-lp-text text-grayscale-500">{description}</p>
      <Button size="landing-lg" variant="primary">
        {textButton}
      </Button>
    </div>
  )
  const picture = <Image src={image} alt={title} quality={100} sizes="100vw" />
  const isPositionLeft = position === 'left'

  return (
    <div
      className={cn(
        'flex flex-col md:flex-row items-center justify-between gap-[2rem] pb-[6.688rem]',
        !isPositionLeft && 'flex-col-reverse',
      )}
    >
      {isPositionLeft ? (
        <>
          {picture} {section}
        </>
      ) : (
        <>
          {section} {picture}
        </>
      )}
    </div>
  )
}

const itemFeatures = [
  {
    title: 'AI-Powered Matching',
    description:
      'Leverage advanced artificial intelligence to connect users with precision and personalization. Our intelligent matching algorithm analyzes user profiles, preferences, and interaction patterns to create meaningful, targeted connections across multiple domains.',
    img: ai,
  },
  {
    title: 'Secure Blockchain Payments',
    description:
      'Utilize cutting-edge blockchain technology to ensure transparent, secure, and instantaneous financial transactions. Our platform provides end-to-end encryption and decentralized payment mechanisms that protect user funds and transaction integrity.',
    img: secure,
    position: 'right',
  },
  {
    title: 'AI-Powered Matching',
    description:
      'Empower seamless teamwork with dynamic, interactive collaboration features. Users can communicate, share resources, and work together simultaneously through integrated communication channels, document sharing, and live editing capabilities.',
    img: realTime,
  },
]
