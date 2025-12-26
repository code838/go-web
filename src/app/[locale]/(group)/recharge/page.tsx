'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from '@/i18n/navigation'
import QRCode from 'react-qr-code'
import USDTIcon from '@/svgs/tokens/usdt.svg'
import BTCIcon from '@/svgs/tokens/BTC.svg'
import BTCBIcon from '@/svgs/tokens/BTCB.svg'
import BNBIcon from '@/svgs/tokens/BNB.svg'
import ETHIcon from '@/svgs/tokens/eth.svg'
import TRXIcon from '@/svgs/tokens/TRX.svg'
import ChevronIcon from '@/svgs/chevron.svg'
import ChevronBackIcon from '@/svgs/chevron-back.svg'
import CopyIcon from '@/svgs/copy-icon.svg'
import FaqAccordion from '@/components/faq-accordion'
import { useUserAddress, useCoins } from '@/requests'
import { useAuth } from '@/hooks/useAuth'
import { useIsMobile } from '@/hooks/useMediaQuery'
import { toast } from '@/components/toast'
import type { Coin, Network, UserAddress } from '@/types'
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

export default function RechargePage() {
  const t = useTranslations()
  const router = useRouter()
  const { userId } = useAuth()
  const isMobile = useIsMobile()
  
  // Convert userId to number, default to 0 if not logged in
  const userIdNum = userId ? Number(userId) : 0
  
  // Fetch user addresses and coins
  const { data: addresses, isLoading: isLoadingAddresses } = useUserAddress(userIdNum)
  const { data: coins, isLoading: isLoadingCoins } = useCoins()
  
  // State for coin and network selection
  const [showCoinDropdown, setShowCoinDropdown] = useState(false)
  const [showNetworkDropdown, setShowNetworkDropdown] = useState(false)
  const [selectedCoin, setSelectedCoin] = useState<Coin | null>(null)
  const [selectedNetwork, setSelectedNetwork] = useState<Network | null>(null)
  const [currentAddress, setCurrentAddress] = useState<UserAddress | null>(null)

  // 获取币种图标
  const getCoinIcon = (coinName: string) => {
    return coinIcons[coinName] || USDTIcon
  }

  // Filter coins to only show USDT
  const filteredCoins = coins?.filter(coin => coin.coinName === 'USDT') || []

  // Initialize default coin and network
  useEffect(() => {
    if (filteredCoins && filteredCoins.length > 0 && !selectedCoin) {
      const defaultCoin = filteredCoins[0]
      setSelectedCoin(defaultCoin)
      if (defaultCoin.networks.length > 0) {
        setSelectedNetwork(defaultCoin.networks[0])
      }
    }
  }, [filteredCoins, selectedCoin])

  // Update current address when coin, network, or addresses change
  useEffect(() => {
    if (addresses && selectedCoin && selectedNetwork) {
      const address = addresses.find(
        (addr) => addr.coinId === selectedCoin.coinId && addr.networkId === selectedNetwork.networkId
      )
      setCurrentAddress(address || null)
    } else {
      setCurrentAddress(null)
    }
  }, [addresses, selectedCoin, selectedNetwork])

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setShowCoinDropdown(false)
      setShowNetworkDropdown(false)
    }

    if (showCoinDropdown || showNetworkDropdown) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [showCoinDropdown, showNetworkDropdown])

  const handleCopyAddress = () => {
    if (currentAddress) {
      navigator.clipboard.writeText(currentAddress.address)
      toast.success(t('recharge.addressCopied'))
    }
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
          <h2 className='flex-1 text-center text-base font-semibold text-white/80 pr-9'>{t('recharge.title')}</h2>
        </div>

        {/* Main Form */}
        <div className='flex flex-col gap-6'>
          {/* Coin Selection */}
          <div className='flex flex-col gap-1'>
            <label className='text-xs font-medium text-[#6E6E70]'>{t('recharge.coin')}</label>
            <div className='relative'>
              <button
                type='button'
                onClick={(e) => {
                  e.stopPropagation()
                  setShowCoinDropdown(!showCoinDropdown)
                  setShowNetworkDropdown(false)
                }}
                disabled={isLoadingCoins || !filteredCoins || filteredCoins.length === 0}
                className='flex w-full items-center justify-between rounded-lg border border-[#303030] bg-[#303030] px-4 py-3 hover:bg-[#303030]/80 disabled:cursor-not-allowed disabled:opacity-50'>
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
                    <span className='text-sm font-normal text-white/50'>{t('recharge.selectCoin')}</span>
                  )}
                </div>
                <ChevronDown className='h-5 w-5 text-white' />
              </button>

              {showCoinDropdown && filteredCoins && filteredCoins.length > 0 && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className='absolute left-0 right-0 top-full z-10 mt-1 max-h-60 overflow-y-auto rounded-lg border border-white/10 bg-[#0a0a0a] shadow-lg'>
                  {filteredCoins.map((coin) => {
                    const CoinIcon = getCoinIcon(coin.coinName)
                    return (
                      <button
                        key={coin.coinId}
                        type='button'
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedCoin(coin)
                          setSelectedNetwork(coin.networks.length > 0 ? coin.networks[0] : null)
                          setShowCoinDropdown(false)
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
            <label className='text-xs font-medium text-[#6E6E70]'>{t('recharge.network')}</label>
            <div className='relative'>
              <button
                type='button'
                onClick={(e) => {
                  e.stopPropagation()
                  setShowNetworkDropdown(!showNetworkDropdown)
                  setShowCoinDropdown(false)
                }}
                disabled={!selectedCoin || !selectedCoin.networks || selectedCoin.networks.length === 0}
                className='flex w-full items-center justify-between rounded-lg border border-[#303030] bg-[#303030] px-4 py-3 hover:bg-[#303030]/80 disabled:cursor-not-allowed disabled:opacity-50'>
                <span className='text-sm font-normal text-white'>
                  {selectedNetwork ? selectedNetwork.network : t('recharge.selectNetwork')}
                </span>
                <ChevronDown className='h-5 w-5 text-white' />
              </button>

              {showNetworkDropdown && selectedCoin && selectedCoin.networks.length > 0 && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className='absolute left-0 right-0 top-full z-10 mt-1 max-h-60 overflow-y-auto rounded-lg border border-white/10 bg-[#0a0a0a] shadow-lg'>
                  {selectedCoin.networks.map((network) => (
                    <button
                      key={network.networkId}
                      type='button'
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedNetwork(network)
                        setShowNetworkDropdown(false)
                      }}
                      className='flex w-full items-center gap-2 px-4 py-3 text-left hover:bg-white/5'>
                      <span className='text-sm font-normal text-white'>{network.network}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Recharge Address Section */}
          <div className='flex flex-col gap-3'>
            <label className='text-xs font-medium text-[#6E6E70]'>{t('recharge.rechargeAddress')}</label>
            
            {/* QR Code and Deposit Info */}
            {isLoadingAddresses ? (
              <div className='flex flex-col items-center justify-center gap-3'>
                <div className='h-32 w-32 animate-pulse rounded-lg border border-white/60 bg-transparent' />
                <span className='text-xs font-medium text-[#6E6E70]'>{t('recharge.loading')}</span>
              </div>
            ) : currentAddress ? (
              <>
                <div className='flex flex-col items-center justify-center gap-3'>
                  <div className='h-32 w-32 flex-shrink-0 rounded-lg bg-white p-2'>
                    <QRCode
                      value={currentAddress.address}
                      size={112}
                      style={{ height: 'auto', maxWidth: '100%', width: '100%' }}
                      viewBox={`0 0 256 256`}
                    />
                  </div>
                  <p className='text-xs font-medium text-[#6E6E70]'>
                    {t('recharge.depositOnlyToAddress', { coin: selectedCoin?.coinName || 'USDT' })}
                  </p>
                </div>

                {/* Address Display */}
                <div className='flex flex-col gap-2 rounded-lg border border-[#1D1D1D] p-3'>
                  <span className='text-xs font-medium text-[#6E6E70]'>{t('recharge.address')}</span>
                  <div className='flex items-center gap-3'>
                    <span className='flex-1 break-all text-base font-medium text-white'>
                      {currentAddress.address}
                    </span>
                    <button
                      onClick={handleCopyAddress}
                      className='flex h-4 w-4 flex-shrink-0 items-center justify-center hover:opacity-80'>
                      <CopyIcon className='h-4 w-4 text-white' />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className='flex items-center gap-3 rounded-lg border border-[#070707] bg-white/15 px-3 py-3'>
                <div className='h-16 w-16 rounded-lg border border-white/60 bg-transparent' />
                <div className='flex flex-col'>
                  <span className='text-xs font-medium text-[#6E6E70]'>{t('recharge.address')}</span>
                  <span className='text-xs font-medium leading-[15px] text-white'>--</span>
                </div>
              </div>
            )}
          </div>

          {/* Warning Information */}
          {selectedCoin && (
            <div className='flex flex-col gap-1'>
              <p className='text-xs font-medium text-white/80'>
                {t('recharge.minDepositAmount', { amount: '1', coin: selectedCoin.coinName })}
              </p>
              <p className='whitespace-pre-line text-xs font-medium text-[#6E6E70]'>
                {t('recharge.depositWarning', { amount: '1', coin: selectedCoin.coinName })}
              </p>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Desktop Layout (original)
  return (
    <div className='flex w-full gap-40'>
      {/* Left Column - Recharge Form */}
      <div className='flex w-80 flex-col items-center gap-6'>
        <div className='flex w-full items-center'>
          <h2 className='text-base font-medium'>{t('recharge.title')}</h2>
        </div>

        {/* Coin Selection */}
        <div className='flex w-full flex-col gap-1'>
          <label className='text-secondary text-xs font-medium'>{t('recharge.rechargeCoin')}</label>
          <div className='relative'>
            <button
              type='button'
              onClick={(e) => {
                e.stopPropagation()
                setShowCoinDropdown(!showCoinDropdown)
                setShowNetworkDropdown(false)
              }}
              disabled={isLoadingCoins || !filteredCoins || filteredCoins.length === 0}
              className='border-card bg-card hover:bg-card/80 flex w-full items-center justify-between rounded-lg border px-4 py-3 disabled:opacity-50 disabled:cursor-not-allowed'>
              <div className='flex items-center gap-2'>
                {selectedCoin ? (
                  <>
                    {(() => {
                      const CoinIcon = getCoinIcon(selectedCoin.coinName)
                      return <CoinIcon className='h-[24px] w-[24px] object-contain' />
                    })()}
                    <span className='text-sm font-normal'>{selectedCoin.coinName}</span>
                  </>
                ) : (
                  <span className='text-secondary/50 text-sm font-normal'>{t('recharge.selectCoin')}</span>
                )}
              </div>
              <ChevronDown className='h-5 w-5 text-white' />
            </button>

            {showCoinDropdown && filteredCoins && filteredCoins.length > 0 && (
              <div
                onClick={(e) => e.stopPropagation()}
                className='absolute top-full left-0 right-0 z-10 mt-1 max-h-60 overflow-y-auto rounded-lg border border-white/10 bg-[#0a0a0a] shadow-lg'>
                {filteredCoins.map((coin) => {
                  const CoinIcon = getCoinIcon(coin.coinName)
                  return (
                    <button
                      key={coin.coinId}
                      type='button'
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedCoin(coin)
                        setSelectedNetwork(coin.networks.length > 0 ? coin.networks[0] : null)
                        setShowCoinDropdown(false)
                      }}
                      className='flex w-full items-center gap-2 px-4 py-3 text-left hover:bg-white/5'>
                      <CoinIcon className='h-5 w-5' />
                      <span className='text-sm font-normal'>{coin.coinName}</span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Network Selection */}
        <div className='flex w-full flex-col gap-1'>
          <label className='text-secondary text-xs font-medium'>{t('recharge.selectNetwork')}</label>
          <div className='relative'>
            <button
              type='button'
              onClick={(e) => {
                e.stopPropagation()
                setShowNetworkDropdown(!showNetworkDropdown)
                setShowCoinDropdown(false)
              }}
              disabled={!selectedCoin || !selectedCoin.networks || selectedCoin.networks.length === 0}
              className='border-card bg-card hover:bg-card/80 flex w-full items-center justify-between rounded-lg border px-4 py-3 disabled:opacity-50 disabled:cursor-not-allowed'>
              <span className='text-sm font-normal'>
                {selectedNetwork ? selectedNetwork.network : t('recharge.selectNetwork')}
              </span>
              <ChevronDown className='h-5 w-5 text-white' />
            </button>

            {showNetworkDropdown && selectedCoin && selectedCoin.networks.length > 0 && (
              <div
                onClick={(e) => e.stopPropagation()}
                className='absolute top-full left-0 right-0 z-10 mt-1 max-h-60 overflow-y-auto rounded-lg border border-white/10 bg-[#0a0a0a] shadow-lg'>
                {selectedCoin.networks.map((network) => (
                  <button
                    key={network.networkId}
                    type='button'
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedNetwork(network)
                      setShowNetworkDropdown(false)
                    }}
                    className='flex w-full items-center gap-2 px-4 py-3 text-left hover:bg-white/5'>
                    <span className='text-sm font-normal'>{network.network}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recharge Address with QR Code */}
        <div className='flex w-full flex-col gap-3'>
          <label className='text-secondary text-xs font-medium'>{t('recharge.rechargeAddress')}</label>
          
          {/* QR Code and Deposit Info */}
          {isLoadingAddresses ? (
            <div className='flex flex-col items-center justify-center gap-3'>
              <div className='h-32 w-32 animate-pulse rounded-lg border border-white/60 bg-transparent' />
              <span className='text-secondary text-xs font-medium'>{t('recharge.loading')}</span>
            </div>
          ) : currentAddress ? (
            <>
              <div className='flex flex-col items-center justify-center gap-3'>
                <div className='h-32 w-32 flex-shrink-0 rounded-lg bg-white p-2'>
                  <QRCode
                    value={currentAddress.address}
                    size={112}
                    style={{ height: 'auto', maxWidth: '100%', width: '100%' }}
                    viewBox={`0 0 256 256`}
                  />
                </div>
                <p className='text-secondary text-xs font-medium text-center'>
                  {t('recharge.depositOnlyToAddress', { coin: selectedCoin?.coinName || 'USDT' })}
                </p>
              </div>

              {/* Address Display */}
              <div className='flex flex-col gap-2 rounded-lg border border-[#1D1D1D] p-3'>
                <span className='text-secondary text-xs font-medium'>{t('recharge.address')}</span>
                <div className='flex items-center gap-3'>
                  <span className='flex-1 break-all text-sm font-medium'>
                    {currentAddress.address}
                  </span>
                  <button
                    onClick={handleCopyAddress}
                    className='flex h-4 w-4 flex-shrink-0 items-center justify-center hover:opacity-80'>
                    <CopyIcon className='h-4 w-4 text-white' />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className='flex items-center gap-3 rounded-lg border border-[#070707] bg-white/15 px-3 py-3'>
              <div className='h-16 w-16 rounded-lg border border-white/60 bg-transparent' />
              <div className='flex flex-col'>
                <span className='text-secondary text-xs font-medium'>{t('recharge.address')}</span>
                <span className='text-xs font-medium leading-[15px]'>--</span>
              </div>
            </div>
          )}
        </div>

        {/* Developer Note */}
        {/* <div className='bg-card flex items-stretch justify-stretch gap-[10px] rounded-xl px-6 py-6'>
          <p className='text-xs font-medium leading-[18px]'>{t('recharge.developerNote')}</p>
        </div> */}
      </div>

      {/* Right Column - FAQ */}
      <div className='flex w-[280px] flex-col gap-3'>
        <h2 className='text-base font-medium text-white/80'>{t('recharge.faqTitle')}</h2>
        <FaqAccordion />
      </div>
    </div>
  )
}

