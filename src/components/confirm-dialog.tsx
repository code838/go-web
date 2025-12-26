'use client'

import { ReactNode } from 'react'
import { LoadingSpinner } from './loading-spinner'

type ConfirmDialogProps = {
  title: string
  message: string | ReactNode
  confirmText: string
  cancelText: string
  onConfirm: () => void
  onCancel: () => void
  variant?: 'default' | 'danger'
  isLoading?: boolean
}

export default function ConfirmDialog({ title, message, confirmText, cancelText, onConfirm, onCancel, variant = 'default', isLoading = false }: ConfirmDialogProps) {
  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-[12px]'>
      <div className='animate-in zoom-in-90 relative w-[520px] space-y-6 rounded-[32px] border border-[#1D1D1D] bg-black/60 px-16 py-6 backdrop-blur-[24px] duration-200'>
        <div className='flex items-center justify-center py-3'>
          <h3 className='text-center text-2xl font-semibold'>{title}</h3>
        </div>

        <p className='text-center text-lg text-white/80'>{message}</p>

        <div className='flex gap-4'>
          <button
            onClick={onCancel}
            disabled={isLoading}
            className='flex-1 rounded-lg bg-[#303030] px-4 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50'>
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`flex-1 rounded-lg px-4 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 flex items-center justify-center gap-2 ${variant === 'danger' ? 'bg-[#F75353]' : 'bg-[#6741FF]'
              }`}>
            {isLoading && <LoadingSpinner size="sm" />}
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}




