'use client'

import DialogShell from '@/components/dialog-shell'
import USDTIcon from '@/svgs/tokens/usdt.svg'
import { useTranslations } from 'next-intl'
import { CircleX, Loader2 } from 'lucide-react'

type WithdrawConfirmDialogProps = {
  coin: string
  network: string
  amount: number
  fee: number
  receiveAmount: number
  address: string
  isLoading?: boolean
  onConfirm: () => void
  onClose: () => void
}

export default function WithdrawConfirmDialog({
  coin,
  network,
  amount,
  fee,
  receiveAmount,
  address,
  isLoading = false,
  onConfirm,
  onClose
}: WithdrawConfirmDialogProps) {
  const t = useTranslations()

  // Format address for display (show first 6 and last 5 characters)
  const formatAddress = (addr: string) => {
    if (addr.length <= 11) return addr
    return `${addr.slice(0, 6)}...${addr.slice(-5)}`
  }

  return (
    <DialogShell title={t('withdraw.confirmTitle')} close={onClose} closeIcon={<CircleX />}>
      <div className='flex flex-col gap-8'>
        {/* Withdrawal Details */}
        <div className='flex flex-col gap-2'>
          {/* Coin */}
          <div className='flex items-center justify-between gap-[10px] py-1'>
            <span className='text-base font-medium text-white/80'>{t('wallet.coin')}</span>
            <div className='flex items-center justify-center gap-1'>
              <USDTIcon className='h-5 w-5' />
              <span className='text-base font-medium text-white/80'>{coin}</span>
            </div>
          </div>

          {/* Network */}
          <div className='flex items-center justify-between gap-[10px] py-1'>
            <span className='text-base font-medium text-white/80'>{t('wallet.network')}</span>
            <span className='text-base font-medium text-white/80'>{network}</span>
          </div>

          {/* Withdraw Amount */}
          <div className='flex items-center justify-between gap-[10px] py-1'>
            <span className='text-base font-medium text-white/80'>{t('withdraw.withdrawAmount')}</span>
            <span className='text-base font-medium text-[#E5AD54]'>{amount} {coin}</span>
          </div>

          {/* Fee */}
          <div className='flex items-center justify-between gap-[10px] py-1'>
            <span className='text-base font-medium text-white/80'>{t('withdraw.fee')}</span>
            <span className='text-base font-medium text-[#E5AD54]'>{fee} {coin}</span>
          </div>

          {/* Receive Amount */}
          <div className='flex items-center justify-between gap-[10px] py-1'>
            <span className='text-base font-medium text-white/80'>{t('withdraw.receiveAmount')}</span>
            <span className='text-base font-medium text-[#E5AD54]'>{receiveAmount} {coin}</span>
          </div>

          {/* Address */}
          <div className='flex items-center justify-between gap-[10px] py-1'>
            <span className='text-base font-medium text-white/80'>{t('wallet.address')}</span>
            <span className='text-base font-medium text-white/80'>{formatAddress(address)}</span>
          </div>
        </div>

        {/* Confirm Button */}
        <button
          onClick={onConfirm}
          disabled={isLoading}
          className='flex w-full items-center justify-center gap-2 rounded-lg bg-brand px-4 py-3 text-sm font-semibold transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50'>
          {isLoading && <Loader2 className='h-4 w-4 animate-spin' />}
          {isLoading ? t('withdraw.submitting') : t('withdraw.confirm')}
        </button>
      </div>
    </DialogShell>
  )
}

