'use client'

import { useTranslations } from 'next-intl'
import { useRouter } from '@/i18n/navigation'
import ChevronBackIcon from '@/svgs/chevron-back.svg'

export default function WithdrawSuccessPage() {
  const t = useTranslations()
  const router = useRouter()

  const handleViewOrders = () => {
    // 跳转到订单页面
    router.replace('/withdraw-records')
  }

  const handleGoBack = () => {
    // 返回到提现页面，并清除历史记录
    router.replace('/withdraw')
  }

  return (
    <div className='flex flex-col gap-16 pb-24'>
      {/* Header with back button */}
      <div className='flex items-center gap-2'>
        <button
          onClick={handleGoBack}
          className='flex h-7 w-7 items-center justify-center rounded-lg bg-white/5'>
          <ChevronBackIcon />
        </button>
        <h2 className='flex-1 text-center text-base font-semibold text-white/80 pr-9'>{t('withdraw.withdrawApplication')}</h2>
      </div>

      {/* Main Content */}
      <div className='flex flex-col items-center gap-16'>
        {/* Success Status */}
        <div className='flex flex-col items-center gap-1'>
          {/* Success Icon */}
          <div className='flex h-10 w-10 items-center justify-center rounded-full bg-white'>
            <svg 
              width="24" 
              height="24" 
              viewBox="0 0 24 24" 
              fill="none"
              className="text-[#6741FF]"
            >
              <path 
                d="M9 16.17L4.83 12L3.41 13.41L9 19L21 7L19.59 5.59L9 16.17Z" 
                fill="currentColor"
                stroke="currentColor"
                strokeWidth="2"
              />
            </svg>
          </div>
          
          {/* Status Text */}
          <h1 className='text-xl font-semibold text-white'>{t('withdraw.submitted')}</h1>
        </div>

        {/* Description and Actions */}
        <div className='flex flex-col items-center gap-1'>
          {/* Description */}
          <div className='flex flex-col items-center gap-1 px-1 py-1'>
            <p className='text-sm font-semibold text-white/80'>
              {t('withdraw.orderSubmittedMessage')}
            </p>
          </div>
          
          {/* View Orders Link */}
          <button
            onClick={handleViewOrders}
            className='text-sm font-semibold text-[#6741FF]'>
            {t('withdraw.viewOrders')}
          </button>
        </div>

        {/* Return Button */}
        <div className='flex w-full flex-col gap-3 pt-6'>
          <button
            onClick={handleGoBack}
            className='w-full rounded-lg border border-[#1D1D1D] bg-[#6741FF] py-3 text-base font-bold text-white transition-colors hover:bg-[#6741FF]/90'>
            {t('common.return')}
          </button>
        </div>
      </div>
    </div>
  )
}
