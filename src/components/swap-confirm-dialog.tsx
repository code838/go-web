'use client'

import DialogShell from '@/components/dialog-shell'
import USDTIcon from '@/svgs/tokens/usdt.svg'
import StarIcon from '@/svgs/stars.svg'
import { useTranslations } from 'next-intl'
import { CircleX } from 'lucide-react'

type SwapConfirmDialogProps = {
  payType: string // 'points' 或币种名称
  payAmount: number
  fee: number
  receiveAmount: number
  onConfirm: () => void
  onClose: () => void
}

export default function SwapConfirmDialog({
  payType,
  payAmount,
  fee,
  receiveAmount,
  onConfirm,
  onClose
}: SwapConfirmDialogProps) {
  const t = useTranslations()

  return (
    <DialogShell title={t('swap.confirmTitle')} close={onClose} closeIcon={<CircleX />}>
      <div className='flex flex-col gap-8'>
        {/* Swap Details */}
        <div className='flex flex-col gap-4'>
          {/* Pay Type */}
          {/* <div className='flex items-center justify-between gap-[10px] py-1'>
            <span className='text-base font-medium text-white/80'>{t('swap.pay')}</span>
            <div className='flex items-center justify-center gap-1'>
              {payType === 'points' ? (
                <>
                  <StarIcon className='h-5 w-5' />
                  <span className='text-base font-medium text-white/80'>{t('swap.points')}</span>
                </>
              ) : (
                <>
                  <div className='h-5 w-5 rounded-full bg-[#26A17B]' />
                  <span className='text-base font-medium text-white/80'>ETH</span>
                </>
              )}
            </div>
          </div> */}

          {/* Pay Amount */}
          <div className='flex items-center justify-between gap-[10px] py-1'>
            <span className='text-base text-white/80'>{t('swap.payAmount')}</span>
            <span className='text-base'>
              {payAmount} {payType === 'points' ? t('swap.points') : payType}
            </span>
          </div>

          {/* Fee */}
          <div className='flex items-center justify-between gap-[10px] py-1'>
            <span className='text-base text-white/80'>{t('swap.fee')}</span>
            <span className='text-base text-[#E5AD54]'>{fee.toFixed(4)} USDT</span>
          </div>

          {/* Receive Amount */}
          <div className='flex items-center justify-between gap-[10px] py-1'>
            <span className='text-base text-white/80'>{t('swap.receiveAmount')}</span>
            <span className='text-base text-[#E5AD54]'>
              {receiveAmount.toFixed(4)} USDT
            </span>
          </div>
        </div>

        {/* Confirm Button */}
        <button
          onClick={onConfirm}
          className='flex w-full items-center justify-center rounded-lg bg-brand px-4 py-3 text-sm font-semibold transition-opacity hover:opacity-90'>
          {t('swap.confirm')}
        </button>
      </div>
    </DialogShell>
  )
}

