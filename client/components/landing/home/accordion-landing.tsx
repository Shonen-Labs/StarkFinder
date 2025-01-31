import { Minus, Plus } from 'lucide-react'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

export type AccordionLandingProps = { title: string; content: string }

export function AccordionLanding({ title, content }: AccordionLandingProps) {
  return (
    <Accordion type="single" collapsible>
      <AccordionItem
        value="item-1"
        className="border-2 border-green-dark rounded-lg [&[data-state=open]_.contain-icons]:bg-violet-light [&[data-state=closed]_.icon-minus]:hidden [&[data-state=open]_.icon-plus]:hidden"
      >
        <AccordionTrigger
          className="relative text-xl sm:text-2xl pl-10 py-6 pr-24"
          hasIcon={false}
        >
          {title}
          <div className="contain-icons absolute right-0 top-0 bottom-0 w-[5.375rem] bg-green-dark flex items-center justify-center rounded-r-[0.375rem]">
            <Plus className="size-6 shrink-0 transition-transform duration-200 icon-plus" />
            <Minus className="size-6 shrink-0 transition-transform duration-200 icon-minus" />
          </div>
        </AccordionTrigger>
        <AccordionContent className="pl-24 pt-5 pb-8 p-9 text-base sm:text-xl sm:leading-9">
          {content}
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}
