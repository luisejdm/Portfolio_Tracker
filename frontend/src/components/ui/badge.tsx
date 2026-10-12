import { cn } from '@/lib/utils'

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'buy' | 'sell' | 'default'
}

export function Badge({ className, variant = 'default', children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
        variant === 'buy' && 'bg-green-500/15 text-green-400',
        variant === 'sell' && 'bg-red-500/15 text-red-400',
        variant === 'default' && 'bg-white/10 text-muted',
        className,
      )}
      {...props}
    >
      {children}
    </span>
  )
}
