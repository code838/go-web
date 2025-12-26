'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter, useSearchParams } from 'next/navigation'
import { useRouter as useI18nRouter } from '@/i18n/navigation'
import USDTIcon from '@/svgs/tokens/usdt.svg'
import BTCIcon from '@/svgs/tokens/BTC.svg'
import BTCBIcon from '@/svgs/tokens/BTCB.svg'
import BNBIcon from '@/svgs/tokens/BNB.svg'
import ETHIcon from '@/svgs/tokens/eth.svg'
import TRXIcon from '@/svgs/tokens/TRX.svg'
import ChevronBackIcon from '@/svgs/chevron-back.svg'
import { toast } from '@/components/toast'
import { useAuth } from '@/hooks/useAuth'
import { useWithdraw } from '@/requests'
import { ContentLoading } from '@/components/loading-spinner'

// 币种图标映射
const coinIcons: Record<string, any> = {
  'USDT': USDTIcon,
  'BTC': BTCIcon,
  'BTCB': BTCBIcon,
  'BNB': BNBIcon,
  'ETH': ETHIcon,
  'TRX': TRXIcon,
}

export default function ConfirmWithdrawPage() {
  const t = useTranslations()
  const router = useRouter()
  const i18nRouter = useI18nRouter()
  const searchParams = useSearchParams()
  const { userInfo, userId } = useAuth()
  
  // 提现 mutation
  const withdrawMutation = useWithdraw()
  
  // 从 URL 参数获取数据
  const coinName = searchParams.get('coin') || ''
  const networkName = searchParams.get('network') || ''
  const amount = searchParams.get('amount') || ''
  const fee = searchParams.get('fee') || ''
  const receiveAmount = searchParams.get('receiveAmount') || ''
  const address = searchParams.get('address') || ''
  const coinId = searchParams.get('coinId') || ''
  const networkId = searchParams.get('networkId') || ''

  // 获取币种图标
  const getCoinIcon = (coinName: string) => {
    return coinIcons[coinName] || USDTIcon
  }

  const handleConfirmWithdraw = async () => {
    if (!userInfo || !userId || !coinId || !networkId || !address || !amount) {
      toast.error(t('wallet.pleaseLogin'))
      return
    }

    try {
      const res = await withdrawMutation.mutateAsync({
        userId: parseInt(userId),
        amount: amount,
        coinId: parseInt(coinId),
        networkId: parseInt(networkId),
        address: address
      })
      
      if (res.data.code === 0 || res.data.code === 200) {
        toast.success(t('withdraw.submitSuccess'))
        // 跳转到成功页面，替换当前页面避免返回问题
        i18nRouter.replace('/withdraw-success')
      } else {
        toast.error(res.data.msg || t('withdraw.submitError'))
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.msg || t('withdraw.submitError'))
    }
  }

  // 验证必需的参数
  if (!coinName || !networkName || !amount || !address) {
    return (
      <div className='flex w-full items-center justify-center py-20'>
        <p className='text-[#6E6E70]'>{t('withdraw.invalidParams')}</p>
      </div>
    )
  }

  const CoinIcon = getCoinIcon(coinName)

  return (
    <div className='flex flex-col gap-6 pb-24'>
      {/* Header with back button */}
      <div className='flex items-center gap-2'>
        <button
          onClick={() => i18nRouter.back()}
          className='flex h-7 w-7 items-center justify-center rounded-lg bg-white/5'>
          <ChevronBackIcon />
        </button>
        <h2 className='flex-1 text-center text-base font-semibold text-white/80 pr-9'>{t('withdraw.confirmTitle')}</h2>
      </div>

      {/* Main Form */}
      <div className='flex flex-col gap-6'>
        {/* Withdraw Coin */}
        <div className='flex flex-col gap-1'>
          <label className='text-xs font-medium text-[#6E6E70]'>{t('withdraw.withdrawCoin')}</label>
          <div className='flex items-center rounded-lg border border-[#303030] px-4 py-3'>
            <div className='flex items-center gap-2'>
              <CoinIcon className='h-6 w-6 object-contain' />
              <span className='text-sm font-normal text-white'>{coinName}</span>
            </div>
          </div>
        </div>

        {/* Withdraw Address */}
        <div className='flex flex-col gap-1'>
          <label className='text-xs font-medium text-[#6E6E70]'>{t('withdraw.withdrawAddress')}</label>
          <div className='flex flex-col gap-2 rounded-lg border border-white/20 px-4 py-3'>
            <span className='text-base font-medium text-white/80 break-all'>
              {address}
            </span>
          </div>
          <div className='flex items-center rounded-lg border border-[#303030] px-4 py-3'>
            <span className='text-sm font-normal text-white'>{networkName}</span>
          </div>
        </div>

        {/* Withdraw Amount */}
        <div className='flex flex-col gap-1'>
          <label className='text-xs font-medium text-[#6E6E70]'>{t('withdraw.withdrawAmount')}</label>
          <div className='flex items-center rounded-lg border border-[#303030] px-4 py-3'>
            <div className='flex items-center gap-2'>
              <CoinIcon className='h-5 w-5 object-contain' />
              <span className='text-sm font-semibold text-[#E5AD54]'>{amount} {coinName}</span>
            </div>
          </div>
        </div>

        {/* Fee */}
        <div className='flex flex-col gap-1'>
          <label className='text-xs font-medium text-[#6E6E70]'>{t('withdraw.fee')}</label>
          <div className='flex items-center rounded-lg border border-[#303030] px-4 py-3'>
            <div className='flex items-center gap-2'>
              <CoinIcon className='h-5 w-5 object-contain' />
              <span className='text-sm font-semibold text-[#E5AD54]'>{fee} {coinName}</span>
            </div>
          </div>
        </div>

        {/* Confirm Button */}
        <div className='flex flex-col gap-6 pt-6'>
          <button
            onClick={handleConfirmWithdraw}
            disabled={withdrawMutation.isPending}
            className='w-full rounded-lg border border-[#1D1D1D] bg-[#6741FF] py-3 text-base font-bold text-white transition-colors hover:bg-[#6741FF]/90 disabled:cursor-not-allowed disabled:opacity-50'>
            {withdrawMutation.isPending ? t('withdraw.submitting') : t('withdraw.confirm')}
          </button>
        </div>
      </div>

      {/* Loading overlay */}
      {withdrawMutation.isPending && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50'>
          <ContentLoading text={t('withdraw.submitting')} className='py-10' />
        </div>
      )}
    </div>
  )
}
