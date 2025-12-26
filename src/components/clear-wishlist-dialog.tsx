'use client'

import { useTranslations } from 'next-intl'

type ClearWishlistDialogProps = {
  onConfirm: () => void
  onCancel: () => void
}

export default function ClearWishlistDialog({ onConfirm, onCancel }: ClearWishlistDialogProps) {
  const t = useTranslations('wishlist')

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-[12px]'>
      <div className='animate-in zoom-in-90 w-[240px] space-y-6 rounded-[24px] bg-black/60 p-6 backdrop-blur-[24px] duration-200'>
        {/* Title and Message */}
        <div className='space-y-2'>
          <h3 className='text-base font-semibold text-white'>{t('clearConfirmTitle')}</h3>
          <p className='text-sm font-medium text-white/80'>{t('clearConfirmMessage')}</p>
        </div>

        {/* Action Buttons */}
        <div className='flex items-center justify-end gap-2.5'>
          <button
            onClick={onCancel}
            className='rounded-lg bg-[#303030] px-4 py-1 text-sm font-semibold text-white transition-opacity hover:opacity-80'>
            {t('cancel')}
          </button>
          <button
            onClick={onConfirm}
            className='rounded-lg bg-[#6741FF] px-4 py-1 text-sm font-semibold text-white transition-opacity hover:opacity-90'>
            {t('confirm')}
          </button>
        </div>
      </div>
    </div>
  )
}
