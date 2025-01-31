import { AccordionLanding } from './accordion-landing'
import { HeaderSection } from './header-section'
import { MotionBox } from './motion-box'

export function Question() {
  return (
    <section
      id="faq"
      className="bg-black-scale-400 pt-14 px-4 pb-[7.25rem] scroll-mt-[3.6rem]"
    >
      <MotionBox>
        <HeaderSection
          title=" Frequently asked Questions"
          description="We know you might have a few questions—here are some of the most
          common ones about StarkFinder and how it can help you navigate the
          Starknet ecosystem"
        />
      </MotionBox>
      <div className="flex flex-col  text-white gap-[2.125rem] max-w-[50.438rem] mx-auto">
        {itemsAccordion.map((item, index) => (
          <MotionBox
            key={`${index}-${item.title}`}
            motionProps={{ transition: { duration: 0.5, delay: index * 0.1 } }}
          >
            <AccordionLanding title={item.title} content={item.content} />
          </MotionBox>
        ))}
      </div>
    </section>
  )
}

const itemsAccordion = [
  {
    title: 'What is StarkFinder?',
    content:
      'StarkFinder is a decentralized application that helps you navigate the Starknet ecosystem. It provides a user-friendly interface to search, discover, and interact with Starknet contracts and applications.',
  },
  {
    title: 'How do I use StarkFinder?',
    content:
      'You can use StarkFinder to search for Starknet contracts and applications by name, address, or category. You can also interact with contracts and applications by sending transactions, calling functions, and more.',
  },
  {
    title: 'Is StarkFinder free to use?',
    content:
      'Yes, StarkFinder is free to use. You can search, discover, and interact with Starknet contracts and applications without any fees or charges.',
  },
  {
    title: 'How can I contribute to StarkFinder?',
    content:
      'You can contribute to StarkFinder by submitting feedback, reporting bugs, and suggesting new features. You can also contribute to the development of StarkFinder by submitting pull requests and helping to improve the codebase.',
  },
]
