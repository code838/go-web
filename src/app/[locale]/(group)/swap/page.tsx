'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from '@/i18n/navigation'
import StarIcon from '@/svgs/stars.svg'
import UsdtIcon from '@/svgs/tokens/usdt.svg'
import BTCIcon from '@/svgs/tokens/BTC.svg'
import BTCBIcon from '@/svgs/tokens/BTCB.svg'
import BNBIcon from '@/svgs/tokens/BNB.svg'
import ETHIcon from '@/svgs/tokens/eth.svg'
import TRXIcon from '@/svgs/tokens/TRX.svg'
import ChevronIcon from '@/svgs/chevron.svg'
import ChevronBackIcon from '@/svgs/chevron-back.svg'
import SwapIcon from '@/svgs/swap.svg'
import SwapConfirmDialog from '@/components/swap-confirm-dialog'
import { useAuth } from '@/hooks/useAuth'
import { useIsMobile } from '@/hooks/useMediaQuery'
import { useExchangeRate, useExchange, useCoins } from '@/requests'
import { toast } from '@/components/toast'
import { ChevronDown } from 'lucide-react'

// 币种图标映射
const coinIcons: Record<string, any> = {
  'USDT': UsdtIcon,
  'BTC': BTCIcon,
  'BTCB': BTCBIcon,
  'BNB': BNBIcon,
  'ETH': ETHIcon,
  'TRX': TRXIcon,
}

export default function SwapPage() {
  const t = useTranslations('swap')
  const router = useRouter()
  const { userInfo, userId, initUserInfo } = useAuth()
  const isMobile = useIsMobile()
  const [payAmount, setPayAmount] = useState('')
  const [selectedCoinId, setSelectedCoinId] = useState<number>(0) // 0 表示积分
  const [receiveAmount, setReceiveAmount] = useState('0')
  const [showPayDropdown, setShowPayDropdown] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  
  // 用于跟踪上次显示的错误信息，避免重复显示
  const lastErrorRef = useRef<string | null>(null)

  // 获取币种列表
  const { data: coins = [] } = useCoins()

  // 获取用户余额信息
  const usdtBalance = useMemo(() => {
    const usdtCoin = userInfo?.coinsBalance?.find(coin => coin.coinName === 'USDT')
    return parseFloat(usdtCoin?.balance || '0')
  }, [userInfo])

  const points = useMemo(() => {
    return parseFloat(userInfo?.points || '0')
  }, [userInfo])

  // 获取所有可兑换的币种（包括积分）
  const availableCoins = useMemo(() => {
    const coinsList = userInfo?.coinsBalance?.map(coin => ({
      coinId: coin.coinId,
      coinName: coin.coinName,
      balance: parseFloat(coin.balance || '0')
    })) || []
    
    // 添加积分作为第一个选项
    return [
      { coinId: 0, coinName: 'Points', balance: points },
      ...coinsList.filter(c => c.coinName !== 'USDT') // 排除USDT
    ]
  }, [userInfo, points])

  // 获取当前选中币种的余额
  const currentBalance = useMemo(() => {
    const coin = availableCoins.find(c => c.coinId === selectedCoinId)
    return coin?.balance || 0
  }, [availableCoins, selectedCoinId])

  // 获取当前选中币种的名称
  const currentCoinName = useMemo(() => {
    const coin = availableCoins.find(c => c.coinId === selectedCoinId)
    return coin?.coinName || 'Points'
  }, [availableCoins, selectedCoinId])

  // 获取兑换汇率和手续费
  const { data: exchangeRateData, refetch: refetchRate, error: exchangeRateError } = useExchangeRate(
    {
      fromCoinId: selectedCoinId,
      num: payAmount || undefined
    },
    {
      enabled: !!userId && selectedCoinId !== undefined
    }
  )

  // 兑换 mutation
  const exchangeMutation = useExchange()

  // 处理汇率获取错误
  useEffect(() => {
    if (exchangeRateError) {
      const errorMsg = (exchangeRateError as Error)?.message || t('errorMessage')
      // 只有当错误信息与上次不同时才显示，避免重复显示
      if (errorMsg !== lastErrorRef.current) {
        lastErrorRef.current = errorMsg
        toast.error(errorMsg)
      }
    } else {
      // 清除错误状态
      lastErrorRef.current = null
    }
  }, [exchangeRateError, t])

  // 当输入金额或选择币种变化时，更新接收金额
  useEffect(() => {
    if (exchangeRateData?.exchangeVal && exchangeRateData?.exchangeFee) {
      // 计算扣除手续费后的实际到账金额
      const totalValue = parseFloat(exchangeRateData.exchangeVal)
      const feeAmount = parseFloat(exchangeRateData.exchangeFee)
      const actualReceive = totalValue - feeAmount
      setReceiveAmount(actualReceive.toFixed(4))
    } else if (exchangeRateData?.exchangeVal) {
      // 如果没有手续费信息，直接使用 exchangeVal
      setReceiveAmount(exchangeRateData.exchangeVal)
    } else {
      setReceiveAmount('0')
    }
  }, [exchangeRateData])

  const fee = exchangeRateData?.exchangeFee || '0'
  const minSwapAmount = parseFloat(exchangeRateData?.minNum || '0')
  const exchangeRate = exchangeRateData?.exchangeRate || '0'
  const exchangePrice = exchangeRateData?.exchangePrice || '0'

  // 当输入金额变化时，重新获取汇率
  const handlePayAmountChange = (value: string) => {
    // 只允许数字和小数点
    if (value && !/^\d*\.?\d*$/.test(value)) {
      return
    }
    setPayAmount(value)
  }

  // 当输入金额变化时，延迟获取汇率
  useEffect(() => {
    if (payAmount && parseFloat(payAmount) > 0) {
      const timer = setTimeout(() => {
        refetchRate()
      }, 500)
      return () => clearTimeout(timer)
    } else {
      setReceiveAmount('0')
    }
  }, [payAmount, refetchRate])

  // 当切换币种时，重新获取汇率信息（获取最小金额等基本信息）
  useEffect(() => {
    if (selectedCoinId !== undefined && userId) {
      refetchRate()
    }
  }, [selectedCoinId, userId, refetchRate])

  const handleMaxClick = () => {
    setPayAmount(currentBalance.toString())
  }

  const handleSwap = () => {
    if (!userId) {
      toast.error(t('wallet.pleaseLogin'))
      return
    }

    const amount = parseFloat(payAmount)
    if (!amount || amount <= 0) {
      toast.error(t('errorEnterAmount'))
      return
    }

    if (amount < minSwapAmount) {
      toast.error(`${t('errorMinAmount')} ${minSwapAmount}`)
      return
    }

    if (amount > currentBalance) {
      toast.error(t('swapButtonInsufficientBalance'))
      return
    }

    // 打开确认弹框
    setShowConfirmDialog(true)
  }

  const handleConfirmSwap = async () => {
    if (!userId) {
      toast.error(t('wallet.pleaseLogin'))
      return
    }

    setShowConfirmDialog(false)
    setIsProcessing(true)

    try {
      const result = await exchangeMutation.mutateAsync({
        userId: Number(userId),
        coinId: selectedCoinId,
        num: payAmount
      })

      toast.success(t('successMessage'))

      // 刷新用户信息
      await initUserInfo()

      // 重置表单
      setPayAmount('')
      setReceiveAmount('0')

      // 跳转到兑换记录页面
      router.push('/swap-records')
    } catch (error: any) {
      console.error('Swap failed:', error)
      const errorMsg = error?.response?.data?.msg || error?.message || t('errorMessage')
      toast.error(errorMsg)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleCloseConfirmDialog = () => {
    setShowConfirmDialog(false)
  }

  // 切换币种
  const handleCoinChange = (coinId: number) => {
    setSelectedCoinId(coinId)
    setShowPayDropdown(false)
    setPayAmount('')
    setReceiveAmount('0')
  }

  // 获取币种图标
  const getCoinIcon = (coinName: string) => {
    return coinIcons[coinName] || UsdtIcon
  }

  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null)

  const faqItems = [
    {
      question: t('faq.q1.question'),
      answer: t('faq.q1.answer')
    },
    {
      question: t('faq.q2.question'),
      answer: t('faq.q2.answer')
    },
    {
      question: t('faq.q3.question'),
      answer: t('faq.q3.answer')
    }
  ]

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index)
  }

  // Mobile: Close dropdown when clicking anywhere
  useEffect(() => {
    if (isMobile) {
      const handleClickOutside = () => {
        setShowPayDropdown(false)
      }

      if (showPayDropdown) {
        document.addEventListener('click', handleClickOutside)
        return () => document.removeEventListener('click', handleClickOutside)
      }
    }
  }, [isMobile, showPayDropdown])

  // Mobile Layout
  if (isMobile) {
    return (
      <div className='flex flex-col gap-6 pb-24 w-full min-w-0 overflow-hidden'>
        {/* Header with back button */}
        <div className='flex items-center gap-2 min-w-0 w-full'>
          <button
            onClick={() => router.back()}
            className='flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-white/5'>
            <ChevronBackIcon />
          </button>
          <h2 className='flex-1 text-center text-base font-semibold text-white/80 min-w-0 truncate'>{t('title')}</h2>
        </div>

        {/* Main Form */}
        <div className='flex flex-col gap-6 w-full min-w-0'>
          {/* From Section */}
          <div className='flex flex-col gap-4 w-full min-w-0'>
            <div className='flex flex-col gap-3 rounded-lg border border-white/20 bg-white/5 px-3 sm:px-4 py-3 w-full min-w-0 overflow-hidden'>
              <div className='flex items-center justify-between gap-1.5 sm:gap-2 min-w-0 w-full'>
                <p className='text-sm font-medium text-[#6E6E70] flex-shrink-0'>{t('pay')}</p>
                <div className='flex items-center gap-1 min-w-0'>
                  <p className='text-[10px] font-medium text-[#6E6E70] whitespace-nowrap'>
                    <span className='text-white'>{currentBalance.toFixed(selectedCoinId === 0 ? 2 : 6)}</span>
                  </p>
                  <button
                    onClick={handleMaxClick}
                    className='text-[10px] font-semibold text-[#6741FF] flex-shrink-0 whitespace-nowrap ml-0.5'>
                    {t('max')}
                  </button>
                </div>
              </div>

              <div className='flex items-center justify-between gap-1.5 sm:gap-2 min-w-0 w-full'>
                <div className='relative flex items-center gap-1 sm:gap-1.5'>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setShowPayDropdown(!showPayDropdown)
                    }}
                    className='flex items-center gap-1 sm:gap-1.5 whitespace-nowrap'>
                    {selectedCoinId === 0 ? (
                      <>
                        <StarIcon className='h-5 w-5 flex-shrink-0' />
                        <span className='text-xs sm:text-sm font-normal text-white'>{t('points')}</span>
                      </>
                    ) : (
                      <>
                        {(() => {
                          const CoinIcon = getCoinIcon(currentCoinName)
                          return <CoinIcon className='h-5 w-5 flex-shrink-0' />
                        })()}
                        <span className='text-xs sm:text-sm font-normal text-white max-w-[50px] sm:max-w-none truncate' title={currentCoinName}>{currentCoinName}</span>
                      </>
                    )}
                    <ChevronDown className='h-3 w-3 text-white flex-shrink-0' />
                  </button>

                  {/* Dropdown Menu */}
                  {showPayDropdown && (
                    <div 
                      onClick={(e) => e.stopPropagation()}
                      className='absolute left-0 top-8 z-10 min-w-[140px] rounded-lg border border-white/10 bg-[#0a0a0a] py-2 shadow-lg'>
                      {availableCoins.map(coin => {
                        const CoinIcon = coin.coinId === 0 ? StarIcon : getCoinIcon(coin.coinName)
                        return (
                          <button
                            key={coin.coinId}
                            onClick={(e) => {
                              e.stopPropagation()
                              handleCoinChange(coin.coinId)
                            }}
                            className='flex w-full items-center gap-2 px-4 py-2 hover:bg-white/5'>
                            <CoinIcon className='h-5 w-5' />
                            <span className='text-sm text-white'>
                              {coin.coinId === 0 ? t('points') : coin.coinName}
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>

                <input
                  value={payAmount}
                  onChange={e => handlePayAmountChange(e.target.value)}
                  placeholder='0.00'
                  className='min-w-0 flex-1 bg-transparent text-right text-sm sm:text-base font-medium text-[#6E6E70] outline-none placeholder:text-[#6E6E70]'
                  style={{ width: 0 }}
                />
              </div>
            </div>

            {/* Swap Icon */}
            <div className='flex justify-center'>
              <SwapIcon />
            </div>

            {/* To Section */}
            <div className='flex flex-col justify-center rounded-lg border border-white/20 bg-white/5 px-3 sm:px-4 py-3 w-full min-w-0 overflow-hidden'>
              <div className='flex items-center justify-between gap-1.5 sm:gap-2 min-w-0 w-full'>
                <div className='flex items-center gap-1.5 sm:gap-2 flex-shrink-0'>
                  <UsdtIcon className='h-5 w-5 flex-shrink-0' />
                  <span className='text-sm font-medium text-white whitespace-nowrap'>USDT</span>
                </div>
                <p className='text-sm sm:text-base font-medium text-[#6E6E70] text-right whitespace-nowrap flex-shrink-0'>
                  {parseFloat(receiveAmount || '0').toFixed(4)}
                </p>
              </div>
            </div>
          </div>

          {/* Fee Information */}
          <div className='flex flex-col gap-1 w-full min-w-0'>
            <div className='flex items-center justify-between py-1 gap-1.5 min-w-0 w-full'>
              <span className='text-xs font-medium text-[#6E6E70] flex-shrink-0'>{t('fee')}</span>
              <span className='text-xs font-medium text-[#6E6E70] text-right whitespace-nowrap flex-shrink-0'>
                {fee ? `${parseFloat(fee).toFixed(4)} USDT` : '-'}
              </span>
            </div>
            <div className='flex items-center justify-between py-1 gap-1.5 min-w-0 w-full'>
              <span className='text-xs font-medium text-[#6E6E70] flex-shrink-0'>{t('minSwapAmount')}</span>
              <span className='text-xs font-medium text-[#6E6E70] text-right min-w-0 flex items-center justify-end gap-1'>
                <span className='whitespace-nowrap'>{minSwapAmount.toFixed(2)}</span>
                <span className='whitespace-nowrap flex-shrink-0'>{selectedCoinId === 0 ? t('points') : currentCoinName}</span>
              </span>
            </div>
          </div>

          {/* Swap Button */}
          <button
            onClick={handleSwap}
            disabled={
              isProcessing || 
              !!exchangeRateError ||
              !payAmount || 
              parseFloat(payAmount) <= 0 ||
              parseFloat(payAmount) < minSwapAmount || 
              parseFloat(payAmount) > currentBalance
            }
            className={`w-full rounded-lg border border-[#1D1D1D] py-3 text-base font-bold text-white transition-colors ${
              isProcessing || 
              !!exchangeRateError ||
              !payAmount || 
              parseFloat(payAmount) <= 0 ||
              parseFloat(payAmount) < minSwapAmount || 
              parseFloat(payAmount) > currentBalance
                ? 'bg-[#6E6E70] cursor-not-allowed'
                : 'bg-[#6741FF] hover:bg-[#6741FF]/90'
            }`}>
            {isProcessing
              ? t('swapButtonProcessing')
              : !payAmount || parseFloat(payAmount) <= 0
                ? t('swapButton')
                : parseFloat(payAmount) < minSwapAmount
                  ? `${t('swapButtonMinAmount')} ${minSwapAmount.toFixed(2)}`
                  : parseFloat(payAmount) > currentBalance
                    ? t('swapButtonInsufficientBalance')
                    : t('swapButton')}
          </button>
        </div>

        {/* Swap Confirmation Dialog */}
        {showConfirmDialog && (
          <SwapConfirmDialog
            payType={selectedCoinId === 0 ? 'points' : currentCoinName}
            payAmount={parseFloat(payAmount) || 0}
            fee={parseFloat(fee) || 0}
            receiveAmount={parseFloat(receiveAmount) || 0}
            onConfirm={handleConfirmSwap}
            onClose={handleCloseConfirmDialog}
          />
        )}
      </div>
    )
  }

  // Desktop Layout (original)
  return (
    <div className='flex w-full gap-[160px]'>
      {/* 左侧：闪兑表单 */}
      <div className='flex w-[320px] flex-col gap-6'>
        <h2 className='text-base font-medium leading-6 text-white/80'>{t('title')}</h2>

        {/* 余额信息 */}
        {/* <div className='flex flex-col gap-1 rounded-xl border border-border bg-card px-4 py-4'> */}
          {/* <p className='text-sm font-medium leading-[21px] text-secondary'>
            {t('balance')}{usdtBalance.toFixed(2)} USDT
          </p> */}
          {/* <p className='text-sm font-semibold leading-[21px] text-white/80'>
            {t('pointsBalance')}{points.toFixed(2)} <span className='text-brand'>{t('pointsUnit')}</span>
            {exchangePrice && selectedCoinId === 0 && ` (1 ${t('points')} = ${parseFloat(exchangePrice).toFixed(4)} USDT)`}
          </p>
          {availableCoins.filter(c => c.coinId !== 0).map(coin => (
            <p key={coin.coinId} className='text-sm font-semibold leading-[21px] text-secondary'>
              {coin.coinName}：{coin.balance.toFixed(6)}
              {exchangePrice && selectedCoinId === coin.coinId && ` (1 ${coin.coinName} = ${parseFloat(exchangePrice).toFixed(4)} USDT)`}
            </p>
          ))}
        </div> */}

        {/* 闪兑表单 */}
        <div className='flex flex-col gap-4'>
          {/* 付出部分 */}
          <div className='flex flex-col gap-3 rounded-lg border border-white/20 bg-card px-4 py-3'>
            <div className='flex items-center justify-between'>
              <p className='text-sm font-medium leading-[21px] text-secondary'>{t('pay')}</p>
              <div className='flex items-center gap-2.5'>
                <p className='text-xs font-medium leading-[15px] text-secondary'>
                  {t('available')}：<span className='text-primary text-xs'>{currentBalance.toFixed(selectedCoinId === 0 ? 2 : 6)}</span>
                </p>
                <button
                  onClick={handleMaxClick}
                  className='text-[10px] font-semibold leading-[15px] text-brand'>
                  {t('max')}
                </button>
              </div>
            </div>

            <div className='flex items-center justify-between gap-2.5'>
              <div className='relative flex items-center gap-2 rounded-lg flex-shrink-0'>
                <button
                  onClick={() => setShowPayDropdown(!showPayDropdown)}
                  className='flex items-center gap-2 whitespace-nowrap'>
                  {selectedCoinId === 0 ? (
                    <>
                      <StarIcon className='h-5 w-5 flex-shrink-0' />
                      <span className='text-sm font-normal leading-[21px] text-white'>{t('points')}</span>
                    </>
                  ) : (
                    <>
                      {(() => {
                        const CoinIcon = getCoinIcon(currentCoinName)
                        return <CoinIcon className='h-5 w-5 flex-shrink-0' />
                      })()}
                      <span className='text-sm font-normal leading-[21px] text-white'>{currentCoinName}</span>
                    </>
                  )}
                  <div className='flex h-3 w-3 items-center justify-center flex-shrink-0'>
                    <ChevronIcon className='h-3 w-3 text-white' />
                  </div>
                </button>

                {/* 下拉菜单 */}
                {showPayDropdown && (
                  <div className='absolute top-8 left-0 z-10 min-w-[140px] rounded-lg border border-border bg-[#141414] py-2'>
                    {availableCoins.map(coin => {
                      const CoinIcon = coin.coinId === 0 ? StarIcon : getCoinIcon(coin.coinName)
                      return (
                        <button
                          key={coin.coinId}
                          onClick={() => handleCoinChange(coin.coinId)}
                          className='flex w-full items-center gap-2 px-4 py-2 hover:bg-card'>
                          <CoinIcon className='h-5 w-5' />
                          <span className='text-sm text-white'>
                            {coin.coinId === 0 ? t('points') : coin.coinName}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>

              <input
                // type='number'
                value={payAmount}
                onChange={e => handlePayAmountChange(e.target.value)}
                placeholder='0.00'
                className='min-w-0 flex-1 bg-transparent text-right text-base font-medium leading-6 text-secondary outline-none placeholder:text-secondary'
              />
            </div>
          </div>

          {/* 兑换图标 */}
          <div className='flex justify-center'>
            <SwapIcon />
          </div>

          {/* 收到部分 */}
          <div className='flex flex-col justify-center rounded-lg border border-white/20 bg-card px-4 py-3'>
            <div className='flex items-center justify-between gap-2.5'>
              <div className='flex items-center gap-2'>
                <UsdtIcon className='h-5 w-5' />
                <span className='text-sm font-medium leading-[21px] text-white'>USDT</span>
              </div>
              <p className='text-base font-medium leading-6 text-secondary'>
                {parseFloat(receiveAmount || '0').toFixed(4)}
              </p>
            </div>
          </div>

          {/* 手续费和最小闪兑金额 */}
          <div className='flex flex-col gap-1'>
            <div className='flex items-center justify-between py-1'>
              <span className='text-xs font-medium leading-[18px] text-secondary'>{t('fee')}</span>
              <span className='text-xs font-medium leading-[18px] text-secondary'>
                {fee ? `${parseFloat(fee).toFixed(4)} USDT` : '-'}
              </span>
            </div>
            <div className='flex items-center justify-between py-1'>
              <span className='text-xs font-medium leading-[18px] text-secondary'>{t('minSwapAmount')}</span>
              <span className='text-xs font-medium leading-[18px] text-secondary'>
                {minSwapAmount.toFixed(2)} {selectedCoinId === 0 ? t('points') : currentCoinName}
              </span>
            </div>
            {exchangeRate && (
              <div className='flex items-center justify-between py-1'>
                <span className='text-xs font-medium leading-[18px] text-secondary'>{t('feeRate')}</span>
                <span className='text-xs font-medium leading-[18px] text-secondary'>
                  {(parseFloat(exchangeRate) * 100).toFixed(2)}%
                </span>
              </div>
            )}
          </div>

          {/* 闪兑按钮 */}
          <button
            onClick={handleSwap}
            disabled={
              isProcessing || 
              !!exchangeRateError ||
              !payAmount || 
              parseFloat(payAmount) <= 0 ||
              parseFloat(payAmount) < minSwapAmount || 
              parseFloat(payAmount) > currentBalance
            }
            className={`w-full rounded-lg border border-border py-2 text-sm font-bold leading-[21px] text-white transition-colors ${
              isProcessing || 
              !!exchangeRateError ||
              !payAmount || 
              parseFloat(payAmount) <= 0 ||
              parseFloat(payAmount) < minSwapAmount || 
              parseFloat(payAmount) > currentBalance
                ? 'bg-[#6E6E70] cursor-not-allowed'
                : 'bg-brand hover:bg-brand/90'
            }`}>
            {isProcessing
              ? t('swapButtonProcessing')
              : !payAmount || parseFloat(payAmount) <= 0
                ? t('swapButton')
                : parseFloat(payAmount) < minSwapAmount
                  ? `${t('swapButtonMinAmount')} ${minSwapAmount.toFixed(2)}`
                  : parseFloat(payAmount) > currentBalance
                    ? t('swapButtonInsufficientBalance')
                    : t('swapButton')}
          </button>

        </div>
      </div>

      {/* 右侧：常见问题 */}
      <div className='flex w-[280px] flex-col gap-3'>
        <h2 className='text-base font-medium leading-6 text-white/80'>{t('faqTitle')}</h2>

        <div className='flex flex-col gap-0'>
          {faqItems.map((item, index) => (
            <div key={index} className='flex flex-col gap-2 rounded-lg border border-border px-4 py-2'>
              <button onClick={() => toggleFaq(index)} className='flex items-center justify-between gap-[10px]'>
                <span className='flex-1 text-left text-sm font-medium leading-[21px] text-white/80'>{item.question}</span>
                <div
                  className={`flex h-5 w-5 flex-shrink-0 items-center justify-center transition-transform ${openFaqIndex === index ? 'rotate-180' : ''
                    }`}>
                  <ChevronIcon className='h-5 w-5 text-secondary' />
                </div>
              </button>

              {openFaqIndex === index && (
                <div className='whitespace-pre-line text-xs font-medium leading-[21px] text-white/50'>{item.answer}</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Swap Confirmation Dialog */}
      {showConfirmDialog && (
        <SwapConfirmDialog
          payType={selectedCoinId === 0 ? 'points' : currentCoinName}
          payAmount={parseFloat(payAmount) || 0}
          fee={parseFloat(fee) || 0}
          receiveAmount={parseFloat(receiveAmount) || 0}
          onConfirm={handleConfirmSwap}
          onClose={handleCloseConfirmDialog}
        />
      )}
    </div>
  )
}

