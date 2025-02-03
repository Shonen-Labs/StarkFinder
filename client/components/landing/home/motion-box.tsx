'use client'

import { motion, MotionProps } from 'framer-motion'

type MotionBoxProps = {
  children?: React.ReactNode
  motionProps?: MotionProps
  className?: string
}

export function MotionBox({
  children,
  motionProps,
  className,
}: MotionBoxProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 25 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className={className}
      {...motionProps}
    >
      {children}
    </motion.div>
  )
}
