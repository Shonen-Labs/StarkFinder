import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

import Link from 'next/link'
import { Button, buttonVariants } from '@/components/ui/button'
import { ChatIcon, ContractIcon, RocketLaunchIcon } from '@/components/icons'
import { cn } from '@/lib/utils'
import { FilePenLine } from 'lucide-react'

export function ModalLanding() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="landing" variant="primary">
          Launch App
          <RocketLaunchIcon />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[38.75rem] [&_button>svg]:size-6 text-white drop-shadow-[0_5px_20px_rgba(0,0,0,0.15)] bg-[#131315] rounded-lg pb-12 border-[#292B41] bg-[url('/img/bg-modal.png')] bg-cover bg-no-repeat bg-center">
        <DialogHeader className="max-w-96 mx-auto">
          <DialogTitle className="pt-7 text-center font-medium text-3xl leading-10 text-[#EEEFFC] tracking-normal">
            How would you like to launch the App
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-5 max-w-[32.375rem] w-full pt-5 mx-auto">
          {itemsButton.map((item, index) => (
            <DialogClose asChild key={index}>
              <Link
                href={item.link}
                className={cn(
                  buttonVariants({
                    variant: 'tertiary',
                    size: 'landing-2xl',
                    className: 'w-full text-[0.938rem] font-medium',
                  }),
                )}
              >
                {item.icon}
                {item.text}
              </Link>
            </DialogClose>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}

const itemsButton = [
  // {
  //   icon: <ChatIcon />,
  //   text: 'New Chat',
  //   link: '/agent/transaction/2fc5da97-6f45-4bf2-84f0-bbc1cbb57cdd',
  // },
  {
    icon: <ContractIcon />,
    text: 'New Transaction',
    link: '/agent/c/d1555821-60f5-4431-a765-6ac9f62c1792',
  },
  { icon: <FilePenLine />, text: 'DevXStark', link: '/devx' },
]
