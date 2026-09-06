import React from "react"
import { AlertTriangle, Loader2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string | React.ReactNode
  confirmLabel?: string
  cancelLabel?: string
  variant?: "default" | "destructive" | "warning"
  isLoading?: boolean
  onConfirm: () => void | Promise<void>
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "destructive",
  isLoading = false,
  onConfirm,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-2xl p-6 sm:p-7">
        <DialogHeader className="space-y-3">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                variant === "destructive"
                  ? "bg-destructive/10 text-destructive"
                  : variant === "warning"
                  ? "bg-amber-500/10 text-amber-600"
                  : "bg-editorial-navy/10 text-editorial-navy dark:text-editorial-sand"
              }`}
            >
              <AlertTriangle className="w-5 h-5" />
            </div>
            <DialogTitle className="font-serif text-lg sm:text-xl font-bold text-foreground">
              {title}
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            {description}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="pt-4 flex flex-col sm:flex-row gap-2 sm:justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isLoading}
            onClick={() => onOpenChange(false)}
            className="rounded-xl text-xs h-9"
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={variant === "destructive" ? "destructive" : "default"}
            size="sm"
            disabled={isLoading}
            onClick={onConfirm}
            className={`rounded-xl text-xs h-9 min-w-[90px] ${
              variant === "destructive"
                ? "bg-destructive hover:bg-destructive/90 text-white"
                : "bg-editorial-navy hover:bg-editorial-navy/90 text-white dark:bg-editorial-sand dark:text-editorial-navy"
            }`}
          >
            {isLoading ? (
              <span className="flex items-center gap-1.5">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Processing...</span>
              </span>
            ) : (
              confirmLabel
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
