import { StarkFinderIcon } from '@/components/icons'
import { Button } from '@/components/ui/button'
import { MotionBox } from './motion-box'

export function Hero() {
  return (
    <section className="sm:bg-[url('/img/bg1-home.webp')] bg-[url('/img/bg-movil.webp')] text-white px-4 mt-[-5.1rem] bg-purple bg-cover bg-no-repeat bg-center">
      <MotionBox className="flex flex-col items-center pb-[8rem] md:pb-[12.5rem] pt-[11.188rem]">
        <StarkFinderIcon />
        <h2 className="leading-tight md:text-lp-h2 text-5xl text-center font-black whitespace-pre-line pt-[1.625rem] pb-5 uppercase">
          StarkFinder:
          <span className="flex">Your Ultimate Starknet Hub</span>
        </h2>
        <p className="text-lp-sub font-medium text-center text-balance pb-[1.875rem]">
          Empowering users and developers to navigate the Starknet ecosystem
          with ease DeFi transactions, smart contracts, and deployments made
          simple.
        </p>
        <Button size="landing" variant="primary" className="h-[3.375rem] px-8">
          Launch TG Bot
        </Button>
      </MotionBox>
    </section>
  )
}
