"use client"

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ContractIcon, RocketLaunchIcon } from '@/components/icons'
import { cn } from '@/lib/utils'
import { FilePenLine } from 'lucide-react'

export function ModalLanding() {
  const router = useRouter()

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="landing" variant="primary">
          Launch App
          <RocketLaunchIcon />
        </Button>
      </DialogTrigger>
      <DialogContent
        className={cn(
          "max-w-[90vw] sm:max-w-[28rem] lg:max-w-[32rem] [&_button>svg]:size-6 text-white",
          "drop-shadow-[0_5px_20px_rgba(0,0,0,0.15)] rounded-2xl pb-8 sm:pb-12",
          "bg-gradient-to-br from-[#3B2A7D] via-[#6A4B9E] to-[#D47FA6]"
        )}
      >
        <DialogHeader className="max-w-[80%] sm:max-w-80 lg:max-w-96 mx-auto">
          <DialogTitle
            className={cn(
              "pt-5 sm:pt-7 text-center font-medium text-2xl sm:text-3xl leading-8 sm:leading-10 text-[#EEEFFC] tracking-normal"
            )}
          >
            How would you like to launch the App
          </DialogTitle>
        </DialogHeader>

        <div
          className={cn(
            "flex flex-col gap-3 sm:gap-5 max-w-[80%] sm:max-w-[22rem] lg:max-w-[26rem] w-full pt-4 sm:pt-5 mx-auto"
          )}
        >
          {itemsButton.map((item, index) => (
            <DialogClose asChild key={index}>
              <Button
                variant="primary"
                size="landing"
                className={cn(
                  "w-full font-bold text-base h-9 sm:h-11 px-4 sm:px-6 rounded-[1.5rem] sm:rounded-[1.75rem]"
                )}
                onClick={() => router.push(item.link)}
              >
                {item.icon}
                {item.text}
              </Button>
            </DialogClose>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}

const itemsButton = [
  {
    icon: <ContractIcon className="text-grayscale-200" />,
    text: 'New Transaction',
    link: '/agent/c/d1555821-60f5-4431-a765-6ac9f62c1792',
  },
  { icon: <FilePenLine className="text-grayscale-200" />, text: 'DevXStark', link: '/devx' },
]