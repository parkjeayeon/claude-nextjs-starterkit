import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const textVariants = cva('-tracking-[0.2px] leading-normal', {
  variants: {
    variant: {
      h1: 'text-[30px] font-semibold',
      h2: 'text-2xl font-semibold',
      h3: 'text-xl font-semibold',
      h4: 'text-lg font-semibold',
      h5: 'text-sm font-semibold',
      h6: 'text-xs font-semibold',
      body1: 'text-xl',
      body2: 'text-lg',
      body3: 'text-base',
      body4: 'text-[15px]',
      body5: 'text-sm',
      body6: 'text-[13px]',
      body7: 'text-xs',
      body8: 'text-[10px]',
    },
    color: {
      default: 'text-foreground',
      muted: 'text-muted-foreground',
      destructive: 'text-destructive',
      accent: 'text-accent-foreground',
    },
  },
  defaultVariants: {
    variant: 'body3',
    color: 'default',
  },
})

type TextElement =
  | 'p'
  | 'span'
  | 'h1'
  | 'h2'
  | 'h3'
  | 'h4'
  | 'h5'
  | 'h6'
  | 'label'
  | 'div'

type TextProps = React.ComponentProps<'p'> &
  VariantProps<typeof textVariants> & {
    as?: TextElement
  }

function Text({ as, variant, color, className, ...props }: TextProps) {
  const Comp = (as || 'p') as React.ElementType
  return (
    <Comp
      data-slot="text"
      className={cn(textVariants({ variant, color }), className)}
      {...props}
    />
  )
}

export { Text, textVariants }
export type { TextProps }
