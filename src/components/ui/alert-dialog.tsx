"use client"

import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface AlertDialogProps {
  children: React.ReactNode
}

interface AlertDialogTriggerProps {
  asChild?: boolean
  children: React.ReactNode
}

interface AlertDialogContentProps {
  children: React.ReactNode
}

interface AlertDialogHeaderProps {
  children: React.ReactNode
}

interface AlertDialogFooterProps {
  children: React.ReactNode
}

interface AlertDialogTitleProps {
  children: React.ReactNode
}

interface AlertDialogDescriptionProps {
  children: React.ReactNode
}

interface AlertDialogActionProps {
  onClick?: () => void
  className?: string
  children: React.ReactNode
}

interface AlertDialogCancelProps {
  children: React.ReactNode
}

const AlertDialog = ({ children }: AlertDialogProps) => {
  const [open, setOpen] = React.useState(false)
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as React.ReactElement<any>, { setOpen })
        }
        return child
      })}
    </Dialog>
  )
}

const AlertDialogTrigger = ({ asChild, children, setOpen }: AlertDialogTriggerProps & { setOpen?: (open: boolean) => void }) => (
  <DialogTrigger asChild={asChild} onClick={() => setOpen?.(true)}>
    {children}
  </DialogTrigger>
)

const AlertDialogContent = ({ children }: AlertDialogContentProps) => (
  <DialogContent className="sm:max-w-[425px]">
    {children}
  </DialogContent>
)

const AlertDialogHeader = ({ children }: AlertDialogHeaderProps) => (
  <DialogHeader>
    {children}
  </DialogHeader>
)

const AlertDialogFooter = ({ children }: AlertDialogFooterProps) => (
  <DialogFooter>
    {children}
  </DialogFooter>
)

const AlertDialogTitle = ({ children }: AlertDialogTitleProps) => (
  <DialogTitle>
    {children}
  </DialogTitle>
)

const AlertDialogDescription = ({ children }: AlertDialogDescriptionProps) => (
  <DialogDescription>
    {children}
  </DialogDescription>
)

const AlertDialogAction = ({ onClick, className, children, setOpen }: AlertDialogActionProps & { setOpen?: (open: boolean) => void }) => (
  <Button
    onClick={() => {
      onClick?.()
      setOpen?.(false)
    }}
    className={className}
  >
    {children}
  </Button>
)

const AlertDialogCancel = ({ children, setOpen }: AlertDialogCancelProps & { setOpen?: (open: boolean) => void }) => (
  <Button
    variant="outline"
    onClick={() => setOpen?.(false)}
  >
    {children}
  </Button>
)

export {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} 