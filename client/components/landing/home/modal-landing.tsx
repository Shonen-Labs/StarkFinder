import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

import { Button, buttonVariants } from '@/components/ui/button'
import { ChatIcon, ContractIcon, RocketLaunchIcon } from '@/components/icons'
import { ExternalLink } from '@/components/base'
import { cn } from '@/lib/utils'

export function ModalLanding() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="landing" variant="primary">
          Launch App
          <RocketLaunchIcon />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[620px] rounded-lg pb-12 border-none bg-[url('/img/bg-modal.png')] bg-cover bg-no-repeat bg-center">
        <DialogHeader className="max-w-96 mx-auto">
          <DialogTitle className="pt-7 text-center font-medium text-3xl leading-10 text-[#EEEFFC] tracking-normal">
            How would you like to launch the App
          </DialogTitle>
        </DialogHeader>

        <div className="max-w-[518px] w-full pt-5 mx-auto">
          <DialogClose asChild>
            <ExternalLink
              href="https://stark-finder-mq45.vercel.app/agent/chat/2fc5da97-6f45-4bf2-84f0-bbc1cbb57cdd"
              className={cn(
                buttonVariants({
                  variant: 'tertiary',
                  size: 'landing-2xl',
                  className: 'w-full text-[0.938rem] font-medium mt-5',
                }),
              )}
            >
              <ChatIcon />
              New Chat
            </ExternalLink>
          </DialogClose>
          <DialogClose asChild>
            <ExternalLink
              href="https://stark-finder-mq45.vercel.app/agent/transaction/d1555821-60f5-4431-a765-6ac9f62c1792"
              className={cn(
                buttonVariants({
                  variant: 'tertiary',
                  size: 'landing-2xl',
                  className: 'w-full text-[0.938rem] font-medium mt-5',
                }),
              )}
            >
              <ContractIcon />
              New Transaction
            </ExternalLink>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  )
}
