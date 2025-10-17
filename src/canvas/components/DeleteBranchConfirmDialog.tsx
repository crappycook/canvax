import { AlertTriangle } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface DeleteBranchConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  branchCount: number
  onConfirm: () => void
  onCancel: () => void
}

export function DeleteBranchConfirmDialog({
  open,
  onOpenChange,
  branchCount,
  onConfirm,
  onCancel,
}: DeleteBranchConfirmDialogProps) {
  const handleConfirm = () => {
    onConfirm()
    onOpenChange(false)
  }

  const handleCancel = () => {
    onCancel()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <DialogTitle>Delete Node with Branches</DialogTitle>
          </div>
          <DialogDescription>
            This node has {branchCount} {branchCount === 1 ? 'branch' : 'branches'}.
            Deleting this node will also delete all downstream nodes in {branchCount === 1 ? 'this branch' : 'these branches'}.
            This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleConfirm}>
            Delete All
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
