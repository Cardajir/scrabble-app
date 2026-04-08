'use client'

/**
 * LinkButton – Button styled jako odkaz (Next.js Link).
 * Použití místo <Button asChild><Link href="...">text</Link></Button>
 * protože @base-ui/react Button nepodporuje asChild prop.
 */
import Link from 'next/link'
import { type VariantProps } from 'class-variance-authority'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface LinkButtonProps extends VariantProps<typeof buttonVariants> {
  href: string
  className?: string
  children: React.ReactNode
}

export function LinkButton({ href, variant, size, className, children }: LinkButtonProps) {
  return (
    <Link href={href} className={cn(buttonVariants({ variant, size }), className)}>
      {children}
    </Link>
  )
}
