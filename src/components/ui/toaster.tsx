"use client"

import { Toaster as HotToaster } from "react-hot-toast"

export function Toaster() {
  return (
    <HotToaster
      position="top-right"
      toastOptions={{
        duration: 3000,
        style: {
          background: "hsl(var(--background))",
          color: "hsl(var(--foreground))",
          border: "1px solid hsl(var(--border))",
          opacity: 1,
          zIndex: 9999,
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
        },
        success: {
          duration: 3000,
          style: {
            background: "hsl(var(--success))",
            color: "white",
            opacity: 1,
            zIndex: 9999,
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
          },
        },
        error: {
          duration: 4000,
          style: {
            background: "hsl(var(--destructive))",
            color: "white",
            opacity: 1,
            zIndex: 9999,
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
          },
        },
      }}
    />
  )
}
