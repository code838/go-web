'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from '@/i18n/navigation'
import USDTIcon from '@/svgs/tokens/usdt.svg'
import BTCIcon from '@/svgs/tokens/BTC.svg'
import BTCBIcon from '@/svgs/tokens/BTCB.svg'
import BNBIcon from '@/svgs/tokens/BNB.svg'
import ETHIcon from '@/svgs/tokens/eth.svg'
import TRXIcon from '@/svgs/tokens/TRX.svg'
import ChevronIcon from '@/svgs/chevron.svg'
import ChevronBackIcon from '@/svgs/chevron-back.svg'
import FaqAccordion from '@/components/faq-accordion'
import WithdrawConfirmDialog from '@/components/withdraw-confirm-dialog'
import { toast } from '@/components/toast'
import { useAuth } from '@/hooks/useAuth'
import { useIsMobile } from '@/hooks/useMediaQuery'
import {
  useCoins,
  useWithdrawAddressList,
  useWithdrawFee,
  useWithdraw,
  type UserAddress,
  type FeeInfo
} from '@/requests'
import type { Coin, Network, CoinBalance } from '@/types'
import { ContentLoading } from '@/components/loading-spinner'
import { ChevronDown } from 'lucide-react'

// 币种图标映射
const coinIcons: Record<string, any> = {
  'USDT': USDTIcon,
  'BTC': BTCIcon,
  'BTCB': BTCBIcon,
  'BNB': BNBIcon,
  'ETH': ETHIcon,
  'TRX': TRXIcon,
}

export default function WithdrawPage() {
  const t = useTranslations()
  const router = useRouter()
  const { userInfo, userId } = useAuth()
  const isMobile = useIsMobile()

  const [selectedCoinId, setSelectedCoinId] = useState<number | null>(null)
  const [selectedNetworkId, setSelectedNetworkId] = useState<number | null>(null)
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null)
  const [manualAddress, setManualAddress] = useState('') // 手动输入的地址
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [showCoinDialog, setShowCoinDialog] = useState(false)
  const [showNetworkDialog, setShowNetworkDialog] = useState(false)
  const [showAddressDropdown, setShowAddressDropdown] = useState(false) // 输入框聚焦时显示地址列表
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)

  const coinDropdownRef = useRef<HTMLDivElement>(null)
  const networkDropdownRef = useRef<HTMLDivElement>(null)
  const addressDropdownRef = useRef<HTMLDivElement>(null)
  const addressInputRef = useRef<HTMLInputElement>(null)

  // 获取币种和网络列表
  const { data: coins, isLoading: coinsLoading } = useCoins()

  // 获取用户提现地址列表
  const { data: addressList, isLoading: addressLoading, refetch: refetchAddresses } = useWithdrawAddressList(userId ? parseInt(userId) : 0)

  // 获取手续费信息
  const { data: feeData, isLoading: feeLoading } = useWithdrawFee()

  // 提现 mutation
  const withdrawMutation = useWithdraw()

  // 自动选择第一个币种
  useEffect(() => {
    if (coins && coins.length > 0 && !selectedCoinId) {
      setSelectedCoinId(coins[0].coinId)
      if (coins[0].networks.length > 0) {
        setSelectedNetworkId(coins[0].networks[0].networkId)
      }
    }
  }, [coins, selectedCoinId])

  // 当选择币种时，自动选择第一个网络
  useEffect(() => {
    const selectedCoin = coins?.find(c => c.coinId === selectedCoinId)
    if (selectedCoin && selectedCoin.networks.length > 0 && !selectedNetworkId) {
      setSelectedNetworkId(selectedCoin.networks[0].networkId)
    }
  }, [selectedCoinId, coins, selectedNetworkId])

  // Close dropdowns when clicking outside (desktop only)
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!isMobile) {
        if (coinDropdownRef.current && !coinDropdownRef.current.contains(event.target as Node)) {
          setShowCoinDialog(false)
        }
        if (networkDropdownRef.current && !networkDropdownRef.current.contains(event.target as Node)) {
          setShowNetworkDialog(false)
        }
        if (addressDropdownRef.current && !addressDropdownRef.current.contains(event.target as Node)) {
          setShowAddressDropdown(false)
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isMobile])

  // Mobile: Close dropdowns when clicking anywhere
  useEffect(() => {
    if (isMobile) {
      const handleClickOutside = () => {
        setShowCoinDialog(false)
        setShowNetworkDialog(false)
        setShowAddressDropdown(false)
      }

      if (showCoinDialog || showNetworkDialog || showAddressDropdown) {
        document.addEventListener('click', handleClickOutside)
        return () => document.removeEventListener('click', handleClickOutside)
      }
    }
  }, [isMobile, showCoinDialog, showNetworkDialog, showAddressDropdown])

  // 获取选中的币种信息
  const selectedCoin = coins?.find(c => c.coinId === selectedCoinId)
  const selectedNetwork = selectedCoin?.networks.find(n => n.networkId === selectedNetworkId)

  // 获取选中的地址信息
  const selectedAddress = addressList?.find(a => a.id === selectedAddressId)
  
  // 获取实际使用的地址（直接使用 manualAddress）
  const actualAddress = manualAddress

  // 筛选出当前选中币种和网络的地址
  const filteredAddresses = useMemo(() => {
    return addressList?.filter(
      addr => addr.coinId === selectedCoinId && addr.networkId === selectedNetworkId
    ) || []
  }, [addressList, selectedCoinId, selectedNetworkId])

  // 当币种或网络改变时，如果当前地址不在新的列表中，则清空地址
  useEffect(() => {
    if (filteredAddresses.length === 0 && manualAddress) {
      setSelectedAddressId(null)
      setManualAddress('')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredAddresses])

  // 获取用户余额（从用户信息中获取）
  const availableBalance = useMemo(() => {
    if (!userInfo || !selectedCoinId) return 0
    const coinBalance = userInfo.coinsBalance?.find((cb: CoinBalance) => cb.coinId === selectedCoinId)
    return parseFloat(coinBalance?.balance || '0')
  }, [userInfo, selectedCoinId])

  // 获取提现手续费
  const withdrawFee = useMemo(() => {
    if (!feeData || !selectedCoinId) return 0
    const withdrawFeeInfo = feeData.find(f => f.type === 1) // 1: 提现手续费
    const fee = withdrawFeeInfo?.fees.find(f => f.coinId === selectedCoinId)
    return parseFloat(fee?.fee || '0')
  }, [feeData, selectedCoinId])

  // 获取最小提现金额
  const minimumWithdrawAmount = useMemo(() => {
    if (!feeData || !selectedCoinId) return 0
    const withdrawFeeInfo = feeData.find(f => f.type === 1) // 1: 提现手续费
    const fee = withdrawFeeInfo?.fees.find(f => f.coinId === selectedCoinId)
    return parseFloat(fee?.minAmount || '0')
  }, [feeData, selectedCoinId])

  // 计算到账金额
  const amountToReceive = useMemo(() => {
    const amount = parseFloat(withdrawAmount) || 0
    return Math.max(0, amount - withdrawFee)
  }, [withdrawAmount, withdrawFee])

  const handleSelectCoin = (coin: Coin) => {
    setSelectedCoinId(coin.coinId)
    if (coin.networks.length > 0) {
      setSelectedNetworkId(coin.networks[0].networkId)
    }
    setShowCoinDialog(false)
  }

  const handleSelectNetwork = (network: Network) => {
    setSelectedNetworkId(network.networkId)
    setShowNetworkDialog(false)
  }

  const handleMaxAmount = () => {
    setWithdrawAmount(availableBalance.toString())
  }

  const handleWithdraw = () => {
    if (!userInfo || !userId) {
      toast.error(t('wallet.pleaseLogin'))
      return
    }

    if (!selectedCoinId || !selectedNetworkId) {
      toast.error(t('withdraw.selectNetwork'))
      return
    }

    if (!actualAddress) {
      toast.error(t('withdraw.selectAddress'))
      return
    }

    const amount = parseFloat(withdrawAmount)
    if (!amount || amount <= 0) {
      toast.error(t('withdraw.amountPlaceholder'))
      return
    }

    if (amount < minimumWithdrawAmount) {
      toast.error(`${t('withdraw.minimumAmount')}: ${minimumWithdrawAmount} ${selectedCoin?.coinName || 'USDT'}`)
      return
    }

    if (amount > availableBalance) {
      toast.error(t('common.insufficientBalance'))
      return
    }

    if (isMobile) {
      // Mobile: Navigate to confirmation page
      const params = new URLSearchParams({
        coin: selectedCoin?.coinName || '',
        network: selectedNetwork?.network || '',
        amount: withdrawAmount,
        fee: withdrawFee.toString(),
        receiveAmount: amountToReceive.toString(),
        address: actualAddress,
        coinId: selectedCoinId.toString(),
        networkId: selectedNetworkId.toString(),
      })
      router.push(`/confirm-withdraw?${params.toString()}`)
    } else {
      // Desktop: Show confirmation dialog
      setShowConfirmDialog(true)
    }
  }

  const handleConfirmWithdraw = async () => {
    if (!userInfo || !userId || !selectedCoinId || !selectedNetworkId || !actualAddress) return

    try {
      const res = await withdrawMutation.mutateAsync({
        userId: parseInt(userId),
        amount: withdrawAmount,
        coinId: selectedCoinId,
        networkId: selectedNetworkId,
        address: actualAddress
      })
      if (res.data.code === 0 || res.data.code === 200) {
        toast.success(t('withdraw.submitSuccess'))
        setShowConfirmDialog(false)
        // 重置表单
        setWithdrawAmount('')
        setManualAddress('')
        setSelectedAddressId(null)
      } else {
        toast.error(res.data.msg || t('withdraw.submitError'))
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.msg || t('withdraw.submitError'))
    }
  }

  const handleCloseConfirmDialog = () => {
    setShowConfirmDialog(false)
  }

  const handleSelectAddress = (address: UserAddress) => {
    setManualAddress(address.address)
    setSelectedAddressId(address.id || null)
    setShowAddressDropdown(false)
    // 聚焦回输入框
    addressInputRef.current?.focus()
  }

  const handleAddressManagement = () => {
    router.push('/wallet/address')
  }

  // 获取币种图标
  const getCoinIcon = (coinName: string) => {
    return coinIcons[coinName] || USDTIcon
  }

  // if (!userInfo || !userId) {
  //   return (
  //     <div className='flex w-full items-center justify-center py-20'>
  //       <p className='text-secondary'>{t('wallet.pleaseLogin')}</p>
  //     </div>
  //   )
  // }

  if (coinsLoading || feeLoading) {
    return (
      <div className='flex w-full items-center justify-center py-20'>
          <ContentLoading text={t('swapRecords.loading')} className='py-10' />
      </div>
    )
  }

  // Mobile Layout
  if (isMobile) {
    return (
      <div className='flex flex-col gap-6 pb-24'>
        {/* Header with back button */}
        <div className='flex items-center gap-2'>
          <button
            onClick={() => router.back()}
            className='flex h-7 w-7 items-center justify-center rounded-lg bg-white/5'>
            <ChevronBackIcon />
          </button>
          <h2 className='flex-1 text-center text-base font-semibold text-white/80 pr-9'>{t('withdraw.title')}</h2>
        </div>

        {/* Main Form */}
        <div className='flex flex-col gap-6'>
          {/* Coin Selection */}
          <div className='flex flex-col gap-1'>
            <label className='text-xs font-medium text-[#6E6E70]'>{t('withdraw.withdrawCoin')}</label>
            <div className='relative'>
              <button
                type='button'
                onClick={() => {
                  setShowCoinDialog(!showCoinDialog)
                  setShowNetworkDialog(false)
                  setShowAddressDropdown(false)
                }}
                className='flex w-full items-center justify-between rounded-lg border border-[#303030] bg-[#303030] px-4 py-3 hover:bg-[#303030]/80'>
                <div className='flex items-center gap-2'>
                  {selectedCoin ? (
                    <>
                      {(() => {
                        const CoinIcon = getCoinIcon(selectedCoin.coinName)
                        return <CoinIcon className='h-6 w-6 object-contain' />
                      })()}
                      <span className='text-sm font-normal text-white'>{selectedCoin.coinName}</span>
                    </>
                  ) : (
                    <span className='text-sm font-normal text-white/50'>{t('wallet.selectCoin')}</span>
                  )}
                </div>
                <ChevronDown className='h-5 w-5 text-white' />
              </button>

              {showCoinDialog && coins && coins.length > 0 && (
                <div 
                  onClick={(e) => e.stopPropagation()}
                  className='absolute left-0 right-0 top-full z-10 mt-1 max-h-60 overflow-y-auto rounded-lg border border-white/10 bg-[#0a0a0a] shadow-lg'>
                  {coins.map((coin) => {
                    const CoinIcon = getCoinIcon(coin.coinName)
                    return (
                      <button
                        key={coin.coinId}
                        onClick={(e) => {
                          e.stopPropagation()
                          handleSelectCoin(coin)
                        }}
                        className='flex w-full items-center gap-2 px-4 py-3 text-left hover:bg-white/5'>
                        <CoinIcon className='h-5 w-5' />
                        <span className='text-sm font-normal text-white'>{coin.coinName}</span>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Network Selection */}
          <div className='flex flex-col gap-1'>
            <label className='text-xs font-medium text-[#6E6E70]'>{t('withdraw.selectNetwork')}</label>
            <div className='relative'>
              <button
                type='button'
                onClick={() => {
                  setShowNetworkDialog(!showNetworkDialog)
                  setShowCoinDialog(false)
                  setShowAddressDropdown(false)
                }}
                disabled={!selectedCoin || !selectedCoin.networks || selectedCoin.networks.length === 0}
                className='flex w-full items-center justify-between rounded-lg border border-[#303030] bg-[#303030] px-4 py-3 hover:bg-[#303030]/80 disabled:cursor-not-allowed disabled:opacity-50'>
                <span className='text-sm font-normal text-white'>
                  {selectedNetwork ? selectedNetwork.network : t('wallet.selectNetwork')}
                </span>
                <ChevronDown className='h-5 w-5 text-white' />
              </button>

              {showNetworkDialog && selectedCoin && selectedCoin.networks.length > 0 && (
                <div 
                  onClick={(e) => e.stopPropagation()}
                  className='absolute left-0 right-0 top-full z-10 mt-1 max-h-60 overflow-y-auto rounded-lg border border-white/10 bg-[#0a0a0a] shadow-lg'>
                  {selectedCoin.networks.map((network) => (
                    <button
                      key={network.networkId}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleSelectNetwork(network)
                      }}
                      className='flex w-full items-center gap-2 px-4 py-3 text-left hover:bg-white/5'>
                      <span className='text-sm font-normal text-white'>{network.network}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Withdraw Address */}
          <div className='flex flex-col gap-1'>
            <label className='text-xs font-medium text-[#6E6E70]'>{t('withdraw.withdrawAddress')}</label>
            
            {/* 地址输入框 - 聚焦时显示可选地址 */}
            <div className='relative' ref={addressDropdownRef}>
              <input
                ref={addressInputRef}
                type='text'
                value={manualAddress}
                onChange={(e) => setManualAddress(e.target.value)}
                onFocus={() => {
                  setShowAddressDropdown(true)
                  setShowCoinDialog(false)
                  setShowNetworkDialog(false)
                }}
                placeholder={t('withdraw.enterAddressPlaceholder')}
                disabled={!selectedCoinId || !selectedNetworkId}
                className='w-full rounded-lg border border-white/20 bg-white/5 px-4 py-3 text-base font-medium text-white placeholder:text-[#6E6E70] focus:border-white/30 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50'
              />

              {/* 地址下拉列表 - 仅在聚焦时显示 */}
              {showAddressDropdown && !addressLoading && filteredAddresses.length > 0 && (
                <div 
                  onClick={(e) => e.stopPropagation()}
                  className='absolute left-0 right-0 top-full z-10 mt-1 flex max-h-64 flex-col gap-3 overflow-y-auto rounded-lg border border-white/10 bg-[#0a0a0a] p-4 shadow-lg'>
                  <div className='text-xs font-medium text-[#6E6E70]'>{t('withdraw.selectFromList')}</div>
                  {filteredAddresses.map((addr, index) => (
                    <button
                      key={addr.id}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleSelectAddress(addr)
                      }}
                      className='flex flex-col justify-center text-left hover:opacity-80'>
                      <span className='text-xs font-medium text-[#6E6E70]'>
                        {addr.remark || `${t('withdraw.myAddress', { number: index + 1 })}`}
                      </span>
                      <span className='text-base font-medium text-white/80'>
                        {addr.address.length > 30
                          ? `${addr.address.slice(0, 20)}...${addr.address.slice(-10)}`
                          : addr.address
                        }
                      </span>
                    </button>
                  ))}

                  {/* Address Management Button */}
                  <div className='flex flex-col items-center justify-center border-t border-white/10 pt-3'>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleAddressManagement()
                      }}
                      className='flex items-center justify-center gap-[10px] rounded bg-[#303030] px-2 py-1 hover:opacity-80'>
                      <span className='text-xs font-medium text-white/80'>{t('withdraw.manageAddress')}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Withdraw Amount */}
          <div className='flex flex-col gap-1'>
            <label className='text-xs font-medium text-[#6E6E70]'>{t('withdraw.withdrawAmount')}</label>
            <div className='flex flex-col gap-1 rounded-lg border border-white/20 bg-white/5 px-4 py-3'>
              <div className='flex items-center justify-between'>
                <input
                  type='text'
                  value={withdrawAmount}
                  onChange={(e) => {
                    const value = e.target.value
                    if (value === '' || /^\d*\.?\d*$/.test(value)) {
                      setWithdrawAmount(value)
                    }
                  }}
                  placeholder='0'
                  className='flex-1 bg-transparent text-base font-medium text-[#6E6E70] placeholder:text-[#6E6E70] focus:outline-none'
                />
                <span className='text-sm font-medium text-white'>{selectedCoin?.coinName || 'USDT'}</span>
              </div>
              <div className='flex items-center justify-end gap-[10px]'>
                <span className='text-xs font-medium text-[#6E6E70]'>
                  {t('withdraw.available')}: {availableBalance.toFixed(2)}
                </span>
                <button
                  onClick={handleMaxAmount}
                  className='text-xs font-semibold text-[#6741FF]'>
                  MAX
                </button>
              </div>
            </div>
          </div>

          {/* Withdrawal Info */}
          <div className='flex flex-col'>
            <div className='flex items-center justify-between py-1'>
              <span className='text-xs font-medium text-[#6E6E70]'>{t('withdraw.minimumAmount')}</span>
              <span className='text-xs font-medium text-[#6E6E70]'>
                {minimumWithdrawAmount} {selectedCoin?.coinName || 'USDT'}
              </span>
            </div>
            <div className='flex items-center justify-between py-1'>
              <span className='text-xs font-medium text-[#6E6E70]'>{t('withdraw.fee')}</span>
              <span className='text-xs font-medium text-[#6E6E70]'>
                {withdrawFee} {selectedCoin?.coinName || 'USDT'}
              </span>
            </div>
            <div className='flex items-center justify-between py-1'>
              <span className='text-xs font-medium text-[#6E6E70]'>{t('withdraw.receiveAmount')}</span>
              <span className='text-xs font-medium text-[#6E6E70]'>
                {amountToReceive.toFixed(2)} {selectedCoin?.coinName || 'USDT'}
              </span>
            </div>
          </div>

          {/* Withdraw Button */}
          <button
            onClick={handleWithdraw}
            disabled={
              !selectedCoinId ||
              !selectedNetworkId ||
              !actualAddress ||
              !withdrawAmount ||
              parseFloat(withdrawAmount) <= 0 ||
              parseFloat(withdrawAmount) > availableBalance
            }
            className='w-full rounded-lg border border-[#1D1D1D] bg-[#6741FF] py-3 text-base font-bold text-white transition-colors hover:bg-[#6741FF]/90 disabled:cursor-not-allowed disabled:opacity-50'>
            {t('withdraw.submit')}
          </button>
        </div>
      </div>
    )
  }

  // Desktop Layout (original)
  return (
    <div className='flex w-full gap-40'>
      {/* Left Column - Withdraw Form */}
      <div className='flex w-80 flex-col gap-4'>
        <div className='flex w-full items-center'>
          <h2 className='text-base font-medium text-white/80'>{t('withdraw.title')}</h2>
        </div>

        {/* Coin Selection */}
        <div ref={coinDropdownRef} className='relative flex w-full flex-col gap-1'>
          <label className='text-secondary text-xs font-normal'>{t('withdraw.withdrawCoin')}</label>
          <button
            onClick={() => setShowCoinDialog(!showCoinDialog)}
            className='border-button bg-button flex items-center justify-between rounded-lg border px-4 py-3 hover:border-white/30'>
            <div className='flex items-center gap-2'>
              {selectedCoin && (() => {
                const CoinIcon = getCoinIcon(selectedCoin.coinName)
                return <CoinIcon className='h-[24px] w-[24px] object-cotain' />
              })()}
              <span className='text-sm font-normal'>{selectedCoin?.coinName || t('wallet.selectCoin')}</span>
            </div>
            <ChevronIcon className='h-5 w-5 text-white' />
          </button>

          {/* Coin Dropdown */}
          {showCoinDialog && (
            <div className='absolute left-0 top-full z-50 mt-1 flex w-full flex-col gap-2 rounded-xl border border-border bg-bg p-2 shadow-lg'>
              {coins && coins.length > 0 ? (
                coins.map((coin) => {
                  const CoinIcon = getCoinIcon(coin.coinName)
                  return (
                    <button
                      key={coin.coinId}
                      onClick={() => handleSelectCoin(coin)}
                      className='flex items-center gap-2 rounded-lg px-3 py-2 text-left hover:bg-button'>
                      <CoinIcon className='h-[20px] w-[20px]' />
                      <span className='text-sm font-normal text-white/80'>{coin.coinName}</span>
                    </button>
                  )
                })
              ) : (
                <p className='px-3 py-2 text-xs text-secondary'>{t('wallet.noCoinsAvailable')}</p>
              )}
            </div>
          )}
        </div>

        {/* Network Selection */}
        <div ref={networkDropdownRef} className='relative flex w-full flex-col gap-1'>
          <label className='text-secondary text-xs font-normal'>{t('withdraw.selectNetwork')}</label>
          <button
            onClick={() => setShowNetworkDialog(!showNetworkDialog)}
            disabled={!selectedCoin || selectedCoin.networks.length === 0}
            className='border-button bg-button flex items-center justify-between rounded-lg border px-4 py-3 hover:border-white/30 disabled:cursor-not-allowed disabled:opacity-50'>
            <span className='text-sm font-normal'>{selectedNetwork?.network || t('wallet.selectNetwork')}</span>
            <ChevronIcon className='h-5 w-5 text-white' />
          </button>

          {/* Network Dropdown */}
          {showNetworkDialog && selectedCoin && (
            <div className='absolute left-0 top-full z-50 mt-1 flex w-full flex-col gap-2 rounded-xl border border-border bg-bg p-2 shadow-lg'>
              {selectedCoin.networks.length > 0 ? (
                selectedCoin.networks.map((network) => (
                  <button
                    key={network.networkId}
                    onClick={() => handleSelectNetwork(network)}
                    className='rounded-lg px-3 py-2 text-left text-sm font-normal text-white/80 hover:bg-button'>
                    {network.network}
                  </button>
                ))
              ) : (
                <p className='px-3 py-2 text-xs text-secondary'>{t('wallet.noNetworksAvailable')}</p>
              )}
            </div>
          )}
        </div>

        {/* Withdraw Address */}
        <div className='flex w-full flex-col gap-1'>
          <label className='text-secondary text-xs font-normal'>{t('withdraw.withdrawAddress')}</label>
          
          {/* 地址输入框 - 聚焦时显示可选地址 */}
          <div ref={addressDropdownRef} className='relative flex w-full flex-col'>
            <input
              ref={addressInputRef}
              type='text'
              value={manualAddress}
              onChange={(e) => setManualAddress(e.target.value)}
              onFocus={() => {
                setShowAddressDropdown(true)
                setShowCoinDialog(false)
                setShowNetworkDialog(false)
              }}
              placeholder={t('withdraw.enterAddressPlaceholder')}
              disabled={!selectedCoinId || !selectedNetworkId}
              className='bg-card w-full rounded-lg border border-white/20 px-4 py-3 text-base font-medium text-white/80 placeholder:text-secondary focus:border-white/30 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50'
            />

            {/* 地址下拉列表 - 仅在聚焦时显示 */}
            {showAddressDropdown && !addressLoading && filteredAddresses.length > 0 && (
              <div className='absolute left-0 top-full z-50 mt-1 flex w-full max-h-96 flex-col gap-3 overflow-y-auto rounded-xl border border-border bg-bg p-4 shadow-lg'>
                <div className='text-xs font-medium text-secondary'>{t('withdraw.selectFromList')}</div>
                {filteredAddresses.map((addr, index) => (
                  <button
                    key={addr.id}
                    onClick={() => handleSelectAddress(addr)}
                    className='flex flex-col justify-center text-left hover:opacity-80'>
                    <span className='text-xs font-medium text-secondary'>
                      {addr.remark || `${t('withdraw.myAddress', { number: index + 1 })}`}
                    </span>
                    <span className='text-base font-medium text-white/80'>
                      {addr.address.length > 30
                        ? `${addr.address.slice(0, 20)}...${addr.address.slice(-10)}`
                        : addr.address
                      }
                    </span>
                  </button>
                ))}

                {/* Address Management Button */}
                <div className='flex flex-col items-center justify-center border-t border-border pt-3'>
                  <button
                    onClick={handleAddressManagement}
                    className='bg-button flex items-center justify-center gap-[10px] rounded px-2 py-1 hover:opacity-80'>
                    <span className='text-xs font-medium text-white/80'>{t('withdraw.manageAddress')}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Withdraw Amount */}
        <div className='flex w-full flex-col gap-1'>
          <label className='text-secondary text-xs font-normal'>{t('withdraw.withdrawAmount')}</label>
          <div className='flex w-full flex-col gap-2'>
            <div className='bg-card flex flex-col justify-center gap-0 rounded-lg border border-white/20 px-4 py-2'>
              <div className='flex items-center justify-between'>
                <input
                  type='text'
                  value={withdrawAmount}
                  onChange={(e) => {
                    const value = e.target.value
                    // 只允许输入数字和小数点
                    if (value === '' || /^\d*\.?\d*$/.test(value)) {
                      setWithdrawAmount(value)
                    }
                  }}
                  placeholder='0'
                  className='flex-1 bg-transparent text-base font-medium text-white/80 placeholder:text-secondary focus:outline-none'
                />
                <span className='text-sm font-medium'>{selectedCoin?.coinName || 'USDT'}</span>
              </div>
              <div className='flex items-center justify-end gap-[10px]'>
                <span className='text-xs font-medium text-secondary'>
                  {t('withdraw.available')}: {availableBalance.toFixed(2)}
                </span>
                <button
                  onClick={handleMaxAmount}
                  className='text-xs font-semibold text-brand'>
                  MAX
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Withdrawal Info */}
        <div className='flex w-full flex-col'>
          <div className='flex items-center justify-between py-1'>
            <span className='text-xs font-medium text-secondary'>{t('withdraw.minimumAmount')}</span>
            <span className='text-xs font-medium text-secondary'>
              {minimumWithdrawAmount} {selectedCoin?.coinName || 'USDT'}
            </span>
          </div>
          <div className='flex items-center justify-between py-1'>
            <span className='text-xs font-medium text-secondary'>{t('withdraw.fee')}</span>
            <span className='text-xs font-medium text-secondary'>
              {withdrawFee} {selectedCoin?.coinName || 'USDT'}
            </span>
          </div>
          <div className='flex items-center justify-between py-1'>
            <span className='text-xs font-medium text-secondary'>{t('withdraw.receiveAmount')}</span>
            <span className='text-xs font-medium text-secondary'>
              {amountToReceive.toFixed(2)} {selectedCoin?.coinName || 'USDT'}
            </span>
          </div>
        </div>

        {/* Withdraw Button */}
        <button
          onClick={handleWithdraw}
          disabled={
            withdrawMutation.isPending ||
            !selectedCoinId ||
            !selectedNetworkId ||
            !actualAddress ||
            !withdrawAmount ||
            parseFloat(withdrawAmount) <= 0 ||
            parseFloat(withdrawAmount) > availableBalance
          }
          className='bg-brand hover:bg-brand/90 w-full rounded-lg border border-border py-2 text-sm font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-50'>
          {withdrawMutation.isPending ? t('withdraw.submitting') : t('withdraw.submit')}
        </button>
      </div>

      {/* Right Column - FAQ */}
      <div className='flex w-[280px] flex-col gap-3'>
        <div className='flex items-center'>
          <h2 className='text-base font-medium text-white/80'>{t('withdraw.faqTitle')}</h2>
        </div>
        <FaqAccordion type='withdraw' />
      </div>

      {/* Withdraw Confirmation Dialog */}
      {showConfirmDialog && selectedCoin && selectedNetwork && actualAddress && (
        <WithdrawConfirmDialog
          coin={selectedCoin.coinName}
          network={selectedNetwork.network}
          amount={parseFloat(withdrawAmount) || 0}
          fee={withdrawFee}
          receiveAmount={amountToReceive}
          address={actualAddress}
          isLoading={withdrawMutation.isPending}
          onConfirm={handleConfirmWithdraw}
          onClose={handleCloseConfirmDialog}
        />
      )}
    </div>
  )
}

