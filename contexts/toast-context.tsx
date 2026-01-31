/**
 * Toast Context Provider
 * Provides toast notifications using Sonner
 */

'use client'

import { createContext, useContext, useCallback } from 'react'
import { toast as sonnerToast, Toaster } from 'sonner'
import { SUCCESS_MESSAGES, ERROR_MESSAGES } from '@/lib/constants'

interface ToastContextType {
  toast: typeof sonnerToast
  success: (
    message: string,
    options?: Parameters<typeof sonnerToast.success>[1]
  ) => void
  error: (
    message: string,
    options?: Parameters<typeof sonnerToast.error>[1]
  ) => void
  info: (
    message: string,
    options?: Parameters<typeof sonnerToast.info>[1]
  ) => void
  warning: (
    message: string,
    options?: Parameters<typeof sonnerToast.warning>[1]
  ) => void
  loading: (
    message: string,
    options?: Parameters<typeof sonnerToast.loading>[1]
  ) => string | number
  promise: <T>(
    promise: Promise<T>,
    messages: {
      loading: string
      success: string | ((data: T) => string)
      error: string | ((error: any) => string)
    }
  ) => Promise<T>
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const success = useCallback(
    (message: string, options?: Parameters<typeof sonnerToast.success>[1]) => {
      sonnerToast.success(message, options)
    },
    []
  )

  const error = useCallback(
    (message: string, options?: Parameters<typeof sonnerToast.error>[1]) => {
      sonnerToast.error(message, options)
    },
    []
  )

  const info = useCallback(
    (message: string, options?: Parameters<typeof sonnerToast.info>[1]) => {
      sonnerToast.info(message, options)
    },
    []
  )

  const warning = useCallback(
    (message: string, options?: Parameters<typeof sonnerToast.warning>[1]) => {
      sonnerToast.warning(message, options)
    },
    []
  )

  const loading = useCallback(
    (message: string, options?: Parameters<typeof sonnerToast.loading>[1]) => {
      return sonnerToast.loading(message, options)
    },
    []
  )

  const promise = useCallback(
    <T,>(
      promise: Promise<T>,
      messages: {
        loading: string
        success: string | ((data: T) => string)
        error: string | ((error: any) => string)
      }
    ) => {
      sonnerToast.promise(promise, messages)
      return promise
    },
    []
  )

  return (
    <ToastContext.Provider
      value={{
        toast: sonnerToast,
        success,
        error,
        info,
        warning,
        loading,
        promise,
      }}
    >
      {children}
      <Toaster
        position="bottom-center"
        richColors
        closeButton
        duration={4000}
        toastOptions={{
          style: {
            marginBottom: '0.5rem',
          },
        }}
      />
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

// Convenience hooks with default messages
export function useToastMessages() {
  const toast = useToast()

  return {
    success: (message?: string) =>
      toast.success(message || SUCCESS_MESSAGES.saved),
    error: (message?: string) => toast.error(message || ERROR_MESSAGES.generic),
    saved: () => toast.success(SUCCESS_MESSAGES.saved),
    created: () => toast.success(SUCCESS_MESSAGES.created),
    updated: () => toast.success(SUCCESS_MESSAGES.updated),
    deleted: () => toast.success(SUCCESS_MESSAGES.deleted),
    addedToCart: () => toast.success(SUCCESS_MESSAGES.addedToCart),
    orderPlaced: () => toast.success(SUCCESS_MESSAGES.orderPlaced),
  }
}
