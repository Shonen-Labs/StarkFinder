type HeaderSectionProps = {
  title: string
  description: string
}
export function HeaderSection({ title, description }: HeaderSectionProps) {
  return (
    <div className="text-center pb-[2.875rem]">
      <h2 className="text-white font-bold text-lp-sub2 leading-tight">
        {title}
      </h2>
      <p className="text-grayscale-600 text-lp-text3 pt-[1.375rem] md:max-w-[42rem] mx-auto">
        {description}
      </p>
    </div>
  )
}
