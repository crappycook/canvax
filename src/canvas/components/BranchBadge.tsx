import { memo } from 'react'
import { GitBranch } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BranchBadgeProps {
  branchIndex: number
  branchId: string
  className?: string
}

export const BranchBadge = memo(function BranchBadge({
  branchIndex,
  branchId,
  className,
}: BranchBadgeProps) {
  return (
    <div
      className={cn(
        'absolute -right-2 -top-2 z-10 flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground shadow-sm',
        className
      )}
      title={`Branch ${branchIndex + 1} (ID: ${branchId})`}
      role="status"
      aria-label={`Branch ${branchIndex + 1}`}
    >
      <GitBranch className="size-3" />
      <span>B{branchIndex + 1}</span>
    </div>
  )
})
