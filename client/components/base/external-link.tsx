type ExternalLinkProps = {
  children: React.ReactNode
  className?: string
  href: string
}
export function ExternalLink({ children, className, href }: ExternalLinkProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
    >
      {children}
    </a>
  )
}
